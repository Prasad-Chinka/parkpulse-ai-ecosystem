import React, { useState, useEffect } from 'react';
import {
  Car,
  QrCode,
  Calendar,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface UserDashboardProps {
  onNavigateToBooking: () => void;
  onNavigateToTickets: (reservationId?: string) => void;
  onNavigateToVehicles: () => void;
  onNavigateToPayments: () => void;
  onNavigateToAI: (lotId: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigateToBooking,
  onNavigateToTickets,
  onNavigateToVehicles,
  onNavigateToPayments,
  onNavigateToAI,
}) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getMyReservations(),
      api.getVehicles(),
      api.getMyPayments(),
      api.getLots(),
    ])
      .then(([resvRes, vehRes, payRes, lotRes]) => {
        if (resvRes?.reservations) setReservations(resvRes.reservations);
        if (vehRes?.vehicles) setVehicles(vehRes.vehicles);
        if (payRes?.payments) setPayments(payRes.payments);
        if (lotRes?.lots) setLots(lotRes.lots);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeBooking = reservations.find(r => r.bookingStatus === 'active');
  const upcomingBookings = reservations.filter(r => r.bookingStatus === 'confirmed');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest block mb-1">
            Driver Command Dashboard
          </span>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {user?.name || 'Driver'}!
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Review active parking sessions, upcoming bay reservations, and scannable gate passes.
          </p>
        </div>

        <button
          onClick={onNavigateToBooking}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all shrink-0"
        >
          <span>Find & Reserve Bay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl glass-card border border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Bookings</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{reservations.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Lifetime reservations</span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-emerald-500/30 bg-emerald-950/10">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Active Parked</span>
          <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">{activeBooking ? 1 : 0}</p>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">Vehicles in bay</span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-sky-500/30 bg-sky-950/10">
          <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">Upcoming</span>
          <p className="text-2xl font-bold font-mono text-sky-300 mt-1">{upcomingBookings.length}</p>
          <span className="text-[11px] text-sky-400/80 mt-1 block">Confirmed bookings</span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">My Vehicles</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{vehicles.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered plates</span>
        </div>
      </div>

      {/* ACTIVE ONGOING SESSION ALERT (if any) */}
      {activeBooking && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/60 to-sky-950/60 border border-emerald-500/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 shrink-0">
              <Car className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ACTIVE PARKING SESSION
                </span>
                <span className="text-xs font-mono text-slate-300 font-semibold">{activeBooking.lotName}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Bay <span className="text-emerald-400 font-mono">{activeBooking.slotNumber}</span> ({activeBooking.floor})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Vehicle: {activeBooking.vehicleReg} · Reserved until {new Date(activeBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTickets(activeBooking._id)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Show QR Exit Pass</span>
          </button>
        </div>
      )}

      {/* Recent Reservations Table */}
      <div className="p-5 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-base font-bold text-white">Recent Reservations</h3>
          <button
            onClick={onNavigateToBooking}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
          >
            <span>Reserve New Bay</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading bookings...</div>
        ) : reservations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No bookings on record yet. Click 'Find & Reserve Bay' above to reserve your first slot!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono">
                  <th className="py-2 px-3">Facility</th>
                  <th className="py-2 px-3">Bay No.</th>
                  <th className="py-2 px-3">Vehicle Plate</th>
                  <th className="py-2 px-3">Time Window</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {reservations.slice(0, 5).map(r => (
                  <tr key={r._id} className="hover:bg-white/5">
                    <td className="py-3 px-3 font-sans font-semibold text-white">{r.lotName}</td>
                    <td className="py-3 px-3 font-bold text-sky-400">{r.slotNumber}</td>
                    <td className="py-3 px-3 text-slate-300">{r.vehicleReg}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">₹{r.totalAmount}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        r.bookingStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : r.bookingStatus === 'confirmed'
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {r.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onNavigateToTickets(r._id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-sans font-medium transition-colors"
                      >
                        View QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
