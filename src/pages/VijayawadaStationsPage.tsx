import React, { useState, useEffect } from 'react';
import {
  MapPin, Search, Filter, ExternalLink, Zap, Car, Bike,
  Clock, ShieldCheck, ArrowUpDown, ChevronRight, Navigation,
  Sparkles, Layers, CheckCircle2, AlertTriangle, XCircle, Info, X
} from 'lucide-react';
import { IParkingLot } from '../../backend/models/index.ts';

interface VijayawadaStationsPageProps {
  onSelectStation: (lot: IParkingLot) => void;
  onOpenBooking: (lot: IParkingLot) => void;
}

export const VijayawadaStationsPage: React.FC<VijayawadaStationsPageProps> = ({
  onSelectStation,
  onOpenBooking,
}) => {
  const [stations, setStations] = useState<IParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(60);
  const [sortBy, setSortBy] = useState<'available' | 'price' | 'capacity'>('available');
  const [stationDetailModal, setStationDetailModal] = useState<IParkingLot | null>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/parking/lots');
      if (res.ok) {
        const data = await res.json();
        setStations(data.lots || []);
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations
    .filter(st => {
      if (selectedCity !== 'all' && st.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedVehicle !== 'all' && !st.vehicleCategories.includes(selectedVehicle)) {
        return false;
      }
      if (st.hourlyPrice > maxPrice) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          st.name.toLowerCase().includes(q) ||
          st.area.toLowerCase().includes(q) ||
          (st.nearbyLandmark && st.nearbyLandmark.toLowerCase().includes(q)) ||
          st.city.toLowerCase().includes(q) ||
          st.address.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.hourlyPrice - b.hourlyPrice;
      if (sortBy === 'capacity') return b.totalSlots - a.totalSlots;
      return (b.availableSlots ?? 0) - (a.availableSlots ?? 0);
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel neon-border-purple relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span>Regional Smart Parking Directory</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                20 Stations Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Parking Stations Network
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Explore proposed and verified smart parking stations across Vijayawada, Guntur, Mangalagiri, Tadepalle, and Tenali with automated QR barrier access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Showing <strong>{filteredStations.length}</strong> of {stations.length} facilities
            </span>
          </div>
        </div>

        {/* Demo Data Disclaimer Badge */}
        <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Project Demonstration Data:</strong> All unverified station capacities, tariffs, and slot availability are labelled as <strong>DEMO DATA</strong> until physically certified by municipal operators.
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl glass-panel space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search station, landmark (e.g. Benz Circle, Bus Station)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input placeholder-slate-400 focus:neon-border-purple"
            />
          </div>

          {/* City / Region Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:neon-border-purple"
            >
              <option value="all" className="bg-slate-900 text-white">All Regions ({stations.length})</option>
              <option value="Vijayawada" className="bg-slate-900 text-white">Vijayawada (7 Stations)</option>
              <option value="Guntur" className="bg-slate-900 text-white">Guntur (6 Stations)</option>
              <option value="Mangalagiri" className="bg-slate-900 text-white">Mangalagiri (1 Station)</option>
              <option value="Tadepalle" className="bg-slate-900 text-white">Tadepalle (1 Station)</option>
              <option value="Tenali" className="bg-slate-900 text-white">Tenali (5 Stations)</option>
            </select>
          </div>

          {/* Vehicle Type Filter */}
          <div>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:neon-border-purple"
            >
              <option value="all" className="bg-slate-900 text-white">All Vehicle Types</option>
              <option value="car" className="bg-slate-900 text-white">Cars Only</option>
              <option value="bike" className="bg-slate-900 text-white">Bikes Only</option>
              <option value="suv" className="bg-slate-900 text-white">SUVs Only</option>
              <option value="ev" className="bg-slate-900 text-white">EV Charging Bays</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span>Max Tariff: <strong className="text-cyan-400 font-mono">₹{maxPrice}/hr</strong></span>
            <input
              type="range"
              min="20"
              max="60"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-32 accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <button
              onClick={() => setSortBy('available')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${sortBy === 'available' ? 'bg-purple-600 text-white' : 'glass-card text-slate-300'}`}
            >
              Available Slots
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${sortBy === 'price' ? 'bg-purple-600 text-white' : 'glass-card text-slate-300'}`}
            >
              Lowest Price
            </button>
            <button
              onClick={() => setSortBy('capacity')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${sortBy === 'capacity' ? 'bg-purple-600 text-white' : 'glass-card text-slate-300'}`}
            >
              Capacity
            </button>
          </div>
        </div>
      </div>

      {/* Stations Cards Grid */}
      {loading ? (
        <div className="p-16 rounded-2xl glass-panel text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading station directory...</p>
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="p-16 rounded-2xl glass-panel text-center">
          <p className="text-slate-300 text-sm">No parking facilities match your search criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCity('all');
              setSelectedVehicle('all');
              setMaxPrice(60);
            }}
            className="mt-3 px-4 py-2 text-xs font-bold rounded-xl btn-neon-gradient"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStations.map((station) => {
            const isVerified = station.verificationStatus === 'verified';
            const available = station.availableSlots ?? 20;
            const total = station.totalSlots || 40;
            const occPercent = Math.round(((total - available) / total) * 100);

            return (
              <div
                key={station._id}
                className="rounded-2xl glass-card p-5 border border-white/10 hover:border-purple-500/50 hover:neon-glow-purple transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top line: City badge & Verification */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      {station.city}
                    </span>

                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      isVerified
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    }`}>
                      {isVerified ? '✓ VERIFIED' : 'DEMO DATA'}
                    </span>
                  </div>

                  {/* Title & Landmark */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                    {station.name}
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{station.nearbyLandmark || station.area}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {station.address}
                  </p>

                  {/* Pricing & Hours Strip */}
                  <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tariff Rate</span>
                      <span className="text-sm font-extrabold text-cyan-400 font-mono">
                        ₹{station.hourlyPrice}
                        <span className="text-[10px] text-slate-400 font-normal">/hr</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Hours</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {station.operatingHours || '24/7'}
                      </span>
                    </div>
                  </div>

                  {/* Availability Gauge */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-emerald-400">
                        {available} Slots Available
                      </span>
                      <span className="text-slate-400 font-mono">
                        {total} Total Capacity
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occPercent > 80 ? 'bg-red-500' : occPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Vehicle Compatibility Badges */}
                  <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-slate-300">
                    {station.vehicleCategories.map((vc) => (
                      <span
                        key={vc}
                        className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 uppercase font-mono"
                      >
                        {vc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => onOpenBooking(station)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl btn-neon-gradient shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Book Slot</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setStationDetailModal(station)}
                    className="p-2 rounded-xl btn-glass-ghost text-slate-300 hover:text-white"
                    title="View Station Details & Amenities"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <a
                    href={station.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(station.name + ' ' + station.city)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl btn-glass-ghost text-slate-300 hover:text-cyan-300"
                    title="Directions on Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Station Details Modal */}
      {stationDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 rounded-2xl glass-panel neon-border-purple shadow-2xl space-y-4">
            <button
              onClick={() => setStationDetailModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {stationDetailModal.city}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                stationDetailModal.verificationStatus === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                {stationDetailModal.verificationStatus === 'verified' ? 'VERIFIED LIVE FACILITY' : 'DEMO DATA (Unverified)'}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{stationDetailModal.name}</h2>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{stationDetailModal.address}</span>
              </p>
              {stationDetailModal.nearbyLandmark && (
                <p className="text-xs text-purple-300 mt-1">
                  <strong>Landmark:</strong> {stationDetailModal.nearbyLandmark}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 py-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block">Hourly Rate</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">₹{stationDetailModal.hourlyPrice}/hr</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block">Total Capacity</span>
                <span className="text-sm font-bold text-purple-300 font-mono">{stationDetailModal.totalSlots} Slots</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block">Available Now</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{stationDetailModal.availableSlots ?? 20} Free</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-200 block mb-1.5">Amenities & Security Features:</span>
              <div className="flex flex-wrap gap-1.5">
                {(stationDetailModal.amenities || ['Covered bays', 'CCTV 24x7', 'Automated Barrier', 'Attendant On-Site']).map((am, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    {am}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={() => {
                  setStationDetailModal(null);
                  onOpenBooking(stationDetailModal);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl btn-neon-gradient shadow-md"
              >
                Proceed to Reserve Slot
              </button>
              <button
                onClick={() => setStationDetailModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl btn-glass-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
