import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Clock,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ReservationModalProps {
  slot: {
    _id: string;
    lotId: string;
    slotNumber: string;
    floor: string;
    hourlyPrice: number;
    vehicleTypes: string[];
  };
  lot: {
    _id: string;
    name: string;
    address: string;
  };
  onClose: () => void;
  onSuccess: (reservationId: string) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  slot,
  lot,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [newRegNumber, setNewRegNumber] = useState<string>('');
  const [newVehicleType, setNewVehicleType] = useState<string>('car');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  // Time range defaults (now to +2 hours)
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatDateTimeLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const defaultStart = formatDateTimeLocal(now);
  const defaultEnd = formatDateTimeLocal(new Date(now.getTime() + 2 * 3600 * 1000));

  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);

  // Steps: 'details' | 'payment' | 'success'
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdReservation, setCreatedReservation] = useState<any>(null);

  // Payment Gateway Configuration
  const [paymentConfig, setPaymentConfig] = useState<{
    razorpayAvailable: boolean;
    keyId: string | null;
    activeMode: 'razorpay' | 'demo';
    message: string;
  }>({
    razorpayAvailable: false,
    keyId: null,
    activeMode: 'demo',
    message: 'Demo Payment Mode Active',
  });

  // Load user vehicles & payment config
  useEffect(() => {
    api.getVehicles().then(res => {
      if (res?.vehicles?.length > 0) {
        setVehicles(res.vehicles);
        setSelectedVehicleId(res.vehicles[0]._id);
      }
    });

    api.getPaymentConfig().then(cfg => {
      if (cfg) setPaymentConfig(cfg);
    }).catch(() => {
      setPaymentConfig({
        razorpayAvailable: false,
        keyId: null,
        activeMode: 'demo',
        message: 'Demo Payment Mode automatically active',
      });
    });
  }, []);

  // Quick calculate duration and amount
  const startD = new Date(startTime);
  const endD = new Date(endTime);
  const diffHours = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60)) || 1);
  const totalAmount = diffHours * slot.hourlyPrice;

  const handleAddQuickVehicle = async () => {
    if (!newRegNumber.trim()) return;
    try {
      const res = await api.addVehicle({
        registrationNumber: newRegNumber.trim().toUpperCase(),
        vehicleType: newVehicleType as any,
        brand: 'Personal',
        model: 'Vehicle',
        color: 'Standard',
      });
      if (res?.vehicle) {
        setVehicles(prev => [...prev, res.vehicle]);
        setSelectedVehicleId(res.vehicle._id);
        setIsAddingVehicle(false);
        setNewRegNumber('');
      }
    } catch (err: any) {
      setErrorMessage('Failed to register vehicle: ' + err.message);
    }
  };

  const handleProceedToPayment = () => {
    setErrorMessage('');
    if (!selectedVehicleId) {
      setErrorMessage('Please select or register a vehicle first.');
      return;
    }
    if (endD <= startD) {
      setErrorMessage('Reservation End time must be strictly after Start time.');
      return;
    }
    setStep('payment');
  };

  const handleExecutePayment = async (simulateSuccess: boolean = true) => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!simulateSuccess) {
        throw new Error('Transaction simulated as declined by user / bank gateway. Slot was not reserved.');
      }

      // Execute simulated demo reservation & payment transaction
      const res = await api.createReservation({
        vehicleId: selectedVehicleId,
        lotId: lot._id,
        slotId: slot._id,
        startTime,
        endTime,
        isSimulated: true,
        paymentMethod: 'Demo Payment Gateway (Simulated)',
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      setCreatedReservation(res);
      setStep('success');

      // Trigger celebration animation
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment communication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl relative border border-slate-200 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {step === 'success' ? 'Booking Confirmed!' : `Reserve Slot ${slot.slotNumber}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{lot.name} · {slot.floor}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: BOOKING DETAILS */}
        {step === 'details' && (
          <div className="py-4 space-y-4">
            {/* Slot summary card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Bay ID & Floor</p>
                <p className="text-base font-bold font-mono text-blue-600">{slot.slotNumber} ({slot.floor})</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Hourly Tariff</p>
                <p className="text-base font-bold font-mono text-slate-900">₹{slot.hourlyPrice}/hr</p>
              </div>
            </div>

            {/* Vehicle selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Vehicle</label>
                <button
                  type="button"
                  onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> {isAddingVehicle ? 'Cancel' : 'Register New'}
                </button>
              </div>

              {isAddingVehicle ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <input
                    type="text"
                    placeholder="Reg. Number (e.g. AP-16-CK-9900)"
                    value={newRegNumber}
                    onChange={e => setNewRegNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={newVehicleType}
                      onChange={e => setNewVehicleType(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="car">Car (Sedan/Hatchback)</option>
                      <option value="suv">SUV / MUV</option>
                      <option value="bike">Two Wheeler (Bike)</option>
                      <option value="ev">Electric Vehicle (EV)</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddQuickVehicle}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save & Use
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  {vehicles.length === 0 ? (
                    <option value="">No vehicles found. Click Register New above.</option>
                  ) : (
                    vehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} · {v.brand} {v.model} ({v.vehicleType.toUpperCase()})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* Start and End Time Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Breakdown */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Duration</span>
                <span className="font-mono text-slate-900 font-semibold">{diffHours} hours</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Hourly Rate</span>
                <span className="font-mono text-slate-900">₹{slot.hourlyPrice}/hr</span>
              </div>
              <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total Amount Due</span>
                <span className="font-mono text-blue-600 text-base font-extrabold">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Continue to Payment (₹{totalAmount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PAYMENT GATEWAY (Optional Razorpay / Auto Demo Mode) */}
        {step === 'payment' && (
          <div className="py-4 space-y-4">
            {/* Payment Mode Alert Banner */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900 uppercase tracking-wider block">
                  DEMO DIGITAL CHECKOUT ACTIVE
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Razorpay credentials not provided in environment. System automatically switched to Demo Payment Mode. Transactions are simulated and persistently stored in MongoDB Atlas with cryptographic QR access token.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Payment Mode</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-100 text-blue-800 border border-blue-200">
                  Simulated Demo Gateway
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Merchant</span>
                <span className="font-semibold text-slate-900">ParkPulse AI Systems</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Bay Allocation</span>
                <span className="font-mono font-bold text-blue-600">{slot.slotNumber} ({lot.name})</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Booking Duration</span>
                <span className="font-mono text-slate-900">{diffHours} Hours</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-900">Amount Payable</span>
                <span className="text-blue-600 font-mono text-lg font-black">₹{totalAmount}</span>
              </div>
            </div>

            {/* Simulation controls */}
            <div className="space-y-2 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => handleExecutePayment(true)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Payment & Generate Pass (Save to MongoDB)</span>
                  </>
                )}
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleExecutePayment(false)}
                className="w-full py-2.5 rounded-xl bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Simulate Payment Decline (Test Failure Recovery)
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => setStep('details')}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer"
              >
                ← Back to Details
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & TICKET GENERATION */}
        {step === 'success' && createdReservation && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900">Reservation Confirmed!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your payment was validated and saved to MongoDB. Digital QR ticket is ready for gate verification.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono text-left max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Ref:</span>
                <span className="text-blue-600 font-bold">{createdReservation.reservation?._id?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Slot:</span>
                <span className="text-slate-900 font-bold">{slot.slotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="text-emerald-600 font-bold">PAID (₹{totalAmount})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-amber-700 text-[11px] truncate">{createdReservation.payment?.transactionId}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Transaction Mode:</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {createdReservation.payment?.isSimulated ? 'SIMULATED DEMO' : 'LIVE TEST'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onSuccess(createdReservation.reservation?._id);
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>View Digital QR Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
