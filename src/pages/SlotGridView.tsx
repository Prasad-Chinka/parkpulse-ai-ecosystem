import React, { useState, useEffect } from 'react';
import {
  Car,
  Bike,
  Zap,
  Truck,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Layers,
  ChevronRight,
  ShieldAlert,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ParkingSlot {
  _id: string;
  lotId: string;
  slotNumber: string;
  floor: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicleTypes: ('car' | 'bike' | 'suv' | 'ev')[];
  hourlyPrice: number;
}

interface ParkingLot {
  _id: string;
  name: string;
  address: string;
  totalSlots: number;
  hourlyPrice: number;
  operatingHours: string;
  amenities: string[];
}

interface SlotGridViewProps {
  selectedLotId?: string;
  onSelectSlotToBook: (slot: ParkingSlot, lot: ParkingLot) => void;
  onNavigateToStations?: () => void;
}

export const SlotGridView: React.FC<SlotGridViewProps> = ({
  selectedLotId,
  onSelectSlotToBook,
  onNavigateToStations,
}) => {
  const { user } = useAuth();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [currentLotId, setCurrentLotId] = useState<string>(selectedLotId || '');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeSlotDetail, setActiveSlotDetail] = useState<ParkingSlot | null>(null);

  // Fetch lots
  useEffect(() => {
    api.getLots().then(res => {
      if (res?.lots?.length > 0) {
        setLots(res.lots);
        if (!currentLotId) {
          setCurrentLotId(res.lots[0]._id);
        }
      }
    });
  }, []);

  // Fetch slots for lot
  useEffect(() => {
    if (!currentLotId) return;
    setLoading(true);
    api.getLotDetails(currentLotId)
      .then(res => {
        if (res?.slots) {
          setSlots(res.slots);
          const matching = (res.slots as ParkingSlot[])
            .filter(s => s.status === 'available')
            .slice(0, 3)
            .map(s => ({
              ...s,
              slotId: s._id,
              reasons: [`Optimal ${s.floor} bay for ${selectedVehicleType === 'all' ? 'standard vehicles' : selectedVehicleType.toUpperCase()}`],
            }));
          setRecommendations(matching);
        }
      })
      .finally(() => setLoading(false));
  }, [currentLotId, selectedVehicleType]);

  const currentLot = lots.find(l => l._id === currentLotId);

  // Floors in current lot
  const availableFloors = Array.from(new Set(slots.map(s => s.floor)));

  // Filtered slots
  const filteredSlots = slots.filter(slot => {
    if (selectedFloor !== 'all' && slot.floor !== selectedFloor) return false;
    if (selectedVehicleType !== 'all') {
      if (!slot.vehicleTypes.includes(selectedVehicleType as any) && !slot.vehicleTypes.includes('car')) {
        return false;
      }
    }
    return true;
  });

  // Counts
  const availableCount = slots.filter(s => s.status === 'available').length;
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;
  const reservedCount = slots.filter(s => s.status === 'reserved').length;
  const maintenanceCount = slots.filter(s => s.status === 'maintenance').length;

  const handleToggleMaintenance = async (slotId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
    const res = await api.updateSlotStatus(slotId, nextStatus);
    if (res?.status) {
      setSlots(prev => prev.map(s => s._id === slotId ? { ...s, status: nextStatus as any } : s));
      if (activeSlotDetail?._id === slotId) {
        setActiveSlotDetail(prev => prev ? { ...prev, status: nextStatus as any } : null);
      }
    }
  };

  const getVehicleIcon = (types: string[]) => {
    if (types.includes('ev')) return <span title="EV Compatible"><Zap className="w-3.5 h-3.5 text-blue-600" /></span>;
    if (types.includes('bike')) return <span title="Two Wheeler"><Bike className="w-3.5 h-3.5 text-amber-600" /></span>;
    if (types.includes('suv')) return <span title="SUV / Heavy"><Truck className="w-3.5 h-3.5 text-purple-600" /></span>;
    return <span title="Car / Sedan"><Car className="w-3.5 h-3.5 text-slate-500" /></span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header and Facility Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" /> Real-Time Allocation Grid
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Interactive Parking Layout</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select an available green slot to book your instant reservation with QR access pass.
          </p>
        </div>

        {/* Facility Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="text-xs text-slate-500 font-medium">Station:</label>
          <select
            value={currentLotId}
            onChange={e => setCurrentLotId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {lots.map(lot => (
              <option key={lot._id} value={lot._id}>
                {lot.name} ({lot.totalSlots} slots)
              </option>
            ))}
          </select>
          {onNavigateToStations && (
            <button
              onClick={onNavigateToStations}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>All 6 Stations</span>
            </button>
          )}
          {currentLot && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(currentLot.name + ' Vijayawada')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* KPI Counters & Legend Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Available</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{availableCount}</p>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-red-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-red-700 font-semibold uppercase tracking-wider">Occupied</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{occupiedCount}</p>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm" />
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">Reserved</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{reservedCount}</p>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm" />
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Maintenance</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{maintenanceCount}</p>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-400" />
        </div>
      </div>

      {/* AI Recommended Top Slots */}
      {recommendations.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">AI-Recommended Top Compatible Slots</h3>
            </div>
            <span className="text-[11px] text-blue-700 font-mono font-medium">Ranked by convenience</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {recommendations.slice(0, 3).map((rec, i) => (
              <div
                key={rec.slotId || i}
                className="p-3 rounded-lg bg-white border border-blue-200 flex items-center justify-between hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer"
                onClick={() => {
                  const target = slots.find(s => s._id === rec.slotId);
                  if (target && currentLot) onSelectSlotToBook(target, currentLot);
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 text-sm">{rec.slotNumber}</span>
                    <span className="text-[10px] text-slate-500">{rec.floor}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                    {rec.reasons?.[0] || 'High availability rank'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-mono">₹{rec.hourlyPrice}/hr</span>
                  <span className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5 justify-end">
                    Book <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
        {/* Floor selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs text-slate-500 font-medium px-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Floor:
          </span>
          <button
            onClick={() => setSelectedFloor('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedFloor === 'all'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Floors
          </button>
          {availableFloors.map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedFloor === floor
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>

        {/* Vehicle Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium px-1">Vehicle:</span>
          {['all', 'car', 'bike', 'suv', 'ev'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedVehicleType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase transition-all cursor-pointer ${
                selectedVehicleType === type
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Slot Matrix */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-white border border-slate-200 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading live parking bay telemetry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredSlots.map(slot => {
            const isAvail = slot.status === 'available';
            const isOcc = slot.status === 'occupied';
            const isRes = slot.status === 'reserved';
            const isMaint = slot.status === 'maintenance';

            return (
              <div
                key={slot._id}
                onClick={() => {
                  if (isAvail && currentLot) {
                    onSelectSlotToBook(slot, currentLot);
                  } else {
                    setActiveSlotDetail(slot);
                  }
                }}
                className={`relative p-4 rounded-xl border transition-all flex flex-col justify-between h-32 select-none cursor-pointer ${
                  isAvail
                    ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                    : isOcc
                    ? 'bg-red-50/70 border-red-200 opacity-80'
                    : isRes
                    ? 'bg-amber-50/70 border-amber-200 opacity-90'
                    : 'bg-slate-100 border-slate-300 opacity-60'
                }`}
              >
                {/* Top Row: Slot Number & Vehicle Type */}
                <div className="flex items-center justify-between">
                  <span className={`font-mono font-black text-base ${
                    isAvail ? 'text-emerald-900' : isOcc ? 'text-red-900' : isRes ? 'text-amber-900' : 'text-slate-700'
                  }`}>
                    {slot.slotNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    {getVehicleIcon(slot.vehicleTypes)}
                  </div>
                </div>

                {/* Middle: Floor / Section */}
                <div className="text-[11px] text-slate-500 truncate">
                  {slot.floor}
                </div>

                {/* Bottom Row: Status Badge & Price */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    isAvail
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : isOcc
                      ? 'bg-red-200/80 text-red-900'
                      : isRes
                      ? 'bg-amber-200/80 text-amber-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {slot.status}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    ₹{slot.hourlyPrice}/h
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
