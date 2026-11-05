import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  MapPin,
  Car,
  Search,
  Filter,
  Navigation,
  Sparkles,
  ExternalLink,
  Crosshair,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import L from 'leaflet';
import { api } from '../services/api.ts';

interface FindParkingPageProps {
  onSelectLot: (lotId: string) => void;
  onBookLot?: (lot: any) => void;
}

export const FindParkingPage: React.FC<FindParkingPageProps> = ({
  onSelectLot,
  onBookLot,
}) => {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'granted' | 'denied'>('idle');
  const [selectedLot, setSelectedLot] = useState<any | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Landmark search suggestions
  const landmarkSuggestions = [
    'Benz Circle',
    'Railway Station',
    'Gannavaram Airport',
    'Kanaka Durga Temple',
    'PVP Square',
    'NTR Bus Station',
    'Lakshmipuram',
    'Brodipet',
    'Mangalagiri Temple',
    'Tenali Clock Tower',
  ];

  // Fetch initial lots
  useEffect(() => {
    loadStations();
  }, [selectedCity]);

  const loadStations = async (lat?: number, lng?: number) => {
    setLoading(true);
    try {
      const res = await api.searchStations({
        city: selectedCity !== 'all' ? selectedCity : undefined,
        query: searchQuery || undefined,
        lat,
        lng,
      });
      if (res?.lots) {
        setLots(res.lots);
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Vijayawada / AP Capital Region (16.5062, 80.6480)
    const map = L.map(mapContainerRef.current, {
      center: [16.5062, 80.6480],
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers when lots or selectedLot change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    lots.forEach((lot) => {
      const isSelected = selectedLot?._id === lot._id;
      const isDemo = lot.verificationStatus !== 'verified';
      const available = lot.availableSlots ?? 20;

      // Marker color logic:
      // Cyan: Selected
      // Purple: Unverified/demo station
      // Green: Available (>15)
      // Yellow: Limited (1-15)
      // Red: Full (0)
      let pinColor = '#22C55E'; // green
      if (isSelected) {
        pinColor = '#06B6D4'; // cyan
      } else if (isDemo) {
        pinColor = '#7C3AED'; // neon purple
      } else if (available === 0) {
        pinColor = '#EF4444'; // red
      } else if (available <= 15) {
        pinColor = '#F59E0B'; // yellow
      }

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background: ${pinColor};
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 16px ${pinColor}, 0 2px 6px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            P
          </div>
        `,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
      });

      const marker = L.marker([lot.latitude, lot.longitude], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 space-y-1.5 text-xs';
      popupContent.innerHTML = `
        <div style="font-weight: bold; font-size: 13px; color: #FFFFFF;">${lot.name}</div>
        <div style="color: #94A3B8; font-size: 11px;">📍 ${lot.nearbyLandmark || lot.area} (${lot.city})</div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
          <span style="color: #22C55E; font-weight: bold;">● ${lot.availableSlots ?? 20} Avail</span>
          <span style="color: #06B6D4; font-weight: bold;">₹${lot.hourlyPrice}/hr</span>
        </div>
        ${lot.distanceKm !== undefined ? `<div style="color: #EC4899; font-size: 10px; font-weight: 600;">Approx. ${lot.distanceKm} km away</div>` : ''}
        <div style="font-size: 9px; color: #EAB308; background: rgba(234, 179, 8, 0.1); padding: 2px 4px; border-radius: 4px; border: 1px solid rgba(234, 179, 8, 0.2); margin-top: 4px;">
          ${lot.verificationStatus === 'verified' ? '✓ VERIFIED FACILITY' : 'DEMO DATA (Unverified by Operator)'}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedLot(lot);
      });

      markersGroupRef.current?.addLayer(marker);
    });

    // If user position exists, show pulsing blue pin
    if (userLocation && mapInstanceRef.current) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="
            background: #06B6D4;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 20px #06B6D4, 0 0 40px #06B6D4;
            animation: pulse 1.5s infinite;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<strong style="color:#06B6D4">Your Current Location</strong>');
    }
  }, [lots, selectedLot, userLocation]);

  // Request browser geolocation
  const handleRequestLocation = () => {
    setLocationStatus('locating');
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationStatus('granted');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 13, { duration: 1.5 });
        }

        // Reload stations sorted by distance
        loadStations(coords.lat, coords.lng);
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err.message);
        setLocationStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectStationFromList = (lot: any) => {
    setSelectedLot(lot);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lot.latitude, lot.longitude], 15, { duration: 1.2 });
    }
  };

  const handleQuickLandmarkSearch = (lm: string) => {
    setSearchQuery(lm);
    api.searchStations({
      query: lm,
      city: selectedCity !== 'all' ? selectedCity : undefined,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
    }).then(res => {
      if (res?.lots) setLots(res.lots);
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCity('all');
    loadStations(userLocation?.lat, userLocation?.lng);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Banner with Neon Header & Geolocation CTA */}
      <div className="p-6 rounded-2xl glass-panel neon-border-purple relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>Location Intelligence & Interactive Map</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                20 Stations Network
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Find Nearby Smart Parking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time slot availability, GPS distance sorting, and direct navigation across Vijayawada, Guntur, Mangalagiri, Tadepalle & Tenali.
            </p>
          </div>

          {/* Location Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRequestLocation}
              disabled={locationStatus === 'locating'}
              className="px-4 py-2 text-xs font-bold rounded-xl btn-neon-gradient flex items-center gap-2 shadow-lg"
            >
              <Crosshair className={`w-4 h-4 ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
              {locationStatus === 'locating'
                ? 'Acquiring GPS...'
                : locationStatus === 'granted'
                ? 'GPS Location Active'
                : 'Use My Current Location'}
            </button>

            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-3 py-2 text-xs font-semibold rounded-xl btn-glass-ghost"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {locationStatus === 'denied' && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Location permission denied or unavailable. You can manually search landmarks or browse the 20 regional stations below.
            </span>
          </div>
        )}
      </div>

      {/* Search Bar & City Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by landmark (e.g. Benz Circle, Railway Station), area, or station name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                api.searchStations({
                  query: e.target.value,
                  city: selectedCity !== 'all' ? selectedCity : undefined,
                  lat: userLocation?.lat,
                  lng: userLocation?.lng,
                }).then(res => {
                  if (res?.lots) setLots(res.lots);
                });
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl glass-input placeholder-slate-400 focus:neon-border-purple"
            />
          </div>

          {/* City Selection Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Regions' },
              { id: 'Vijayawada', label: 'Vijayawada (7)' },
              { id: 'Guntur', label: 'Guntur (6)' },
              { id: 'Mangalagiri', label: 'Mangalagiri (1)' },
              { id: 'Tadepalle', label: 'Tadepalle (1)' },
              { id: 'Tenali', label: 'Tenali (5)' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCity(c.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCity === c.id
                    ? 'btn-neon-purple shadow-md'
                    : 'glass-card text-slate-300 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Landmark Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400 py-1 scrollbar-none">
          <span className="font-semibold text-slate-300 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Suggested Landmarks:
          </span>
          {landmarkSuggestions.map((lm) => (
            <button
              key={lm}
              onClick={() => handleQuickLandmarkSearch(lm)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 border border-white/10 shrink-0 transition-colors"
            >
              {lm}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Map (Left/Center) + Stations Sidebar List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="relative rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl h-[520px]">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 p-2.5 rounded-xl glass-panel text-[11px] space-y-1 shadow-lg pointer-events-auto border border-white/10 backdrop-blur-md">
              <span className="font-bold text-white block text-[10px] uppercase tracking-wider mb-1">
                Marker Legend
              </span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
                <span>Available (&gt;15 bays)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Limited (1–15 bays)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span>Occupied / Full</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                <span>Proposed / Demo Station</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                <span>Selected Facility</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stations Discovery List Column */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>Discovered Facilities</span>
              <span className="text-[11px] font-mono text-cyan-400">({lots.length})</span>
            </span>
            {userLocation && (
              <span className="text-[11px] text-pink-400 font-mono">
                Sorted by Proximity
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 rounded-2xl glass-panel text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Scanning spatial database...
              </div>
            ) : lots.length === 0 ? (
              <div className="p-8 rounded-2xl glass-panel text-center text-xs text-slate-400">
                No stations found for this query or city filter.
              </div>
            ) : (
              lots.map((lot) => {
                const isSelected = selectedLot?._id === lot._id;
                const isVerified = lot.verificationStatus === 'verified';

                return (
                  <div
                    key={lot._id}
                    onClick={() => handleSelectStationFromList(lot)}
                    className={`p-4 rounded-2xl glass-card cursor-pointer transition-all ${
                      isSelected
                        ? 'neon-border-cyan bg-cyan-950/30'
                        : 'hover:border-purple-500/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white leading-snug">
                          {lot.name}
                        </h3>
                        <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{lot.nearbyLandmark || lot.area} • {lot.city}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-cyan-400 font-mono">
                          ₹{lot.hourlyPrice}
                          <span className="text-[10px] text-slate-400">/hr</span>
                        </span>
                        {lot.distanceKm !== undefined && (
                          <div className="text-[10px] font-semibold text-pink-400 font-mono mt-0.5">
                            ~{lot.distanceKm} km
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-400">
                          ● {lot.availableSlots ?? 20} slots free
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400 capitalize">
                          {lot.operatingHours || '24/7'}
                        </span>
                      </div>

                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      }`}>
                        {isVerified ? 'VERIFIED' : 'DEMO DATA'}
                      </span>
                    </div>

                    {/* Quick action buttons if selected */}
                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBookLot) onBookLot(lot);
                            else onSelectLot(lot._id);
                          }}
                          className="flex-1 py-1.5 text-xs font-bold rounded-xl btn-neon-gradient text-center shadow-md"
                        >
                          Book Slot Now
                        </button>
                        <a
                          href={lot.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(lot.name + ' ' + lot.city)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-xl btn-glass-ghost text-slate-300 hover:text-white"
                          title="Open Google Maps Directions"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
