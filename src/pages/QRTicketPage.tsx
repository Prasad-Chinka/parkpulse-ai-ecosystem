import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Calendar,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  Printer,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  XCircle,
  X,
  Bell
} from 'lucide-react';
import { api } from '../services/api.ts';

interface QRTicketPageProps {
  reservationId?: string;
  onNavigateToScanner: () => void;
}

export const QRTicketPage: React.FC<QRTicketPageProps> = ({
  reservationId,
  onNavigateToScanner,
}) => {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(reservationId || '');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Load all user bookings to allow switching tickets
  const loadReservations = () => {
    api.getMyReservations().then(res => {
      if (res?.reservations?.length > 0) {
        setMyReservations(res.reservations);
        if (!selectedId) {
          setSelectedId(res.reservations[0]._id);
        }
      }
    });
  };

  useEffect(() => {
    loadReservations();
  }, []);

  // Fetch ticket details
  const fetchTicket = () => {
    if (!selectedId) return;
    setLoading(true);
    api.getQRTicket(selectedId)
      .then(res => {
        if (res?.ticket) {
          setTicket(res.ticket);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();
  }, [selectedId]);

  // Handle Cancel Booking with Confirmation
  const handleConfirmCancel = async () => {
    if (!ticket) return;
    setCancelling(true);
    try {
      const res = await api.cancelReservation(ticket.reservationId);
      if (res?.error) {
        showToast('error', `Failed to cancel: ${res.error}`);
      } else {
        showToast('success', `Reservation for Slot ${ticket.slotNumber} has been successfully cancelled and bay released.`);
        setShowCancelConfirm(false);
        fetchTicket();
        loadReservations();
      }
    } catch (err: any) {
      showToast('error', 'Error cancelling reservation: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  // Quick simulation helper
  const handleSimulateEntry = async () => {
    if (!ticket) return;
    const res = await api.verifyQREntry(ticket.qrToken || ticket.reservationId);
    if (res?.success) {
      showToast('success', `Boom barrier opened! Entry verified for Slot ${ticket.slotNumber}. Status is now ACTIVE.`);
      fetchTicket();
    } else {
      showToast('error', `Entry simulation failed: ${res?.error}`);
    }
  };

  const handleSimulateExit = async () => {
    if (!ticket) return;
    const res = await api.verifyQRExit(ticket.qrToken || ticket.reservationId);
    if (res?.success) {
      showToast('success', `Exit verified! Session completed and Slot ${ticket.slotNumber} has been released.`);
      fetchTicket();
    } else {
      showToast('error', `Exit simulation failed: ${res?.error}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification Pop-up */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-200 ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider">
            <QrCode className="w-3.5 h-3.5" /> Cryptographic Access Token
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Digital QR Parking Ticket</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Present this scannable token to the station barrier scanner or operator on arrival.
          </p>
        </div>

        {/* Ticket Selector */}
        {myReservations.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Pass:</span>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {myReservations.map(r => (
                <option key={r._id} value={r._id}>
                  {r.slotNumber} · {r.bookingStatus.toUpperCase()} ({r._id.slice(-6)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Generating encrypted digital pass...</p>
        </div>
      ) : !ticket ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Booking Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any active QR tickets yet. Reserve a slot from the Parking Stations tab to receive your scannable token.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Ticket Card */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-blue-600 uppercase">
                  {ticket.area || 'Vijayawada Hub'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{ticket.lotName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {ticket.lotAddress}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    ticket.bookingStatus === 'active'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : ticket.bookingStatus === 'completed'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : ticket.bookingStatus === 'cancelled'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {ticket.bookingStatus}
                </span>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  REF: #{ticket.reservationId.slice(-6)}
                </div>
              </div>
            </div>

            {/* QR Code & Slot Bay Spotlight */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              {/* Animated QR Code Container */}
              <div className="relative p-3.5 bg-white rounded-2xl border-2 border-blue-300 shadow-md shadow-blue-500/10 shrink-0 group">
                <div className="absolute inset-0 rounded-2xl border border-blue-400/40 animate-pulse pointer-events-none" />
                <QRCodeSVG
                  value={ticket.qrToken || ticket.reservationId}
                  size={150}
                  level="H"
                  includeMargin={false}
                  className="rounded-lg"
                />
                <div className="text-center mt-2">
                  <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    SCAN AT GATE
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Reserved Slot</span>
                  <span className="text-lg font-black text-blue-600 font-mono">
                    {ticket.slotNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Bay Floor / Section</span>
                  <span className="font-semibold text-slate-800">{ticket.floor}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Registered Vehicle</span>
                  <span className="font-mono font-bold text-slate-800">
                    {ticket.vehicleReg} ({ticket.vehicleType.toUpperCase()})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Driver</span>
                  <span className="font-medium text-slate-800">{ticket.userName}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-mono font-bold text-emerald-600">PAID (₹{ticket.totalAmount})</span>
                </div>
              </div>
            </div>

            {/* Time Window Strip */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Valid Start Time</span>
                <span className="text-slate-800 font-semibold">{new Date(ticket.startTime).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Valid End Time</span>
                <span className="text-slate-800 font-semibold">{new Date(ticket.endTime).toLocaleString()}</span>
              </div>
            </div>

            {/* Cryptographic token footer & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-3 border-t border-slate-100">
              <span className="font-mono text-slate-400 text-[11px] truncate max-w-xs">
                TOKEN: {ticket.qrToken || ticket.reservationId}
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer text-xs font-medium"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Ticket
                </button>

                {ticket.bookingStatus !== 'cancelled' && ticket.bookingStatus !== 'completed' && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Simulation & Gate Verification Station */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Gate Simulator
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Test the complete boom-barrier verification lifecycle right from this ticket without requiring two devices:
              </p>

              <div className="space-y-2 pt-2">
                <button
                  disabled={ticket.bookingStatus === 'active' || ticket.bookingStatus === 'completed' || ticket.bookingStatus === 'cancelled'}
                  onClick={handleSimulateEntry}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    ticket.bookingStatus === 'confirmed' || ticket.bookingStatus === 'pending'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Gate Entry Check-In</span>
                </button>

                <button
                  disabled={ticket.bookingStatus !== 'active'}
                  onClick={handleSimulateExit}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    ticket.bookingStatus === 'active'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Simulate Gate Exit & Release Bay</span>
                </button>

                <button
                  onClick={onNavigateToScanner}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Operator Camera Scanner</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Security Notes */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-[11px] text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-800">Smart Access Rules:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Tokens are cryptographically signed and verified in real time.</li>
                <li>Single-use barrier handshake prevents duplicate drive-throughs.</li>
                <li>Cancellations automatically release the slot back to the Vijayawada grid.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION POP-UP MODAL BEFORE CANCELLING BOOKING */}
      {showCancelConfirm && ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Parking Reservation?</h3>
                <p className="text-xs text-slate-500">This action will release your reserved slot immediately.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Station</span>
                <span className="font-semibold text-slate-800">{ticket.lotName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Slot</span>
                <span className="font-mono font-bold text-blue-600">{ticket.slotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Refund Amount</span>
                <span className="font-mono font-bold text-emerald-600">₹{ticket.totalAmount} (Full Demo Refund)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this booking? The slot will become available for other Vijayawada drivers to reserve immediately.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Keep Reservation
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
