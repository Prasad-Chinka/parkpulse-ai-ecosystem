import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Receipt,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api.ts';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    api.getMyPayments()
      .then(res => {
        if (res?.payments) setPayments(res.payments);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" /> Billing & Invoicing
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Payment Receipts & History</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Audit your digital parking payments, transaction references, and VAT tax receipts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 rounded-2xl glass-panel text-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading payment history...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-16 rounded-2xl glass-panel text-center space-y-2">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Payment Records Found</h3>
          <p className="text-xs text-slate-400">Complete a slot reservation to generate your first transaction receipt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => (
            <div
              key={p._id}
              className="p-4 rounded-xl glass-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">{p.receiptNumber}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      SUCCESS
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                      p.isSimulated !== false ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {p.isSimulated !== false ? 'SIMULATED DEMO' : 'RAZORPAY TEST'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                    TXN: {p.transactionId}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(p.createdAt).toLocaleString()} · {p.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Amount Paid</span>
                  <span className="font-mono text-lg font-bold text-emerald-400">₹{p.amount}</span>
                </div>
                <button
                  onClick={() => setSelectedReceipt(p)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-sky-400 text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Receipt className="w-3.5 h-3.5" /> View Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Digital Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl relative border border-white/10 space-y-4">
            <div className="text-center pb-3 border-b border-white/10">
              <span className="text-xs text-sky-400 uppercase tracking-widest font-bold">ParkPulse AI Systems</span>
              <h3 className="text-xl font-bold text-white mt-1">Digital Tax Receipt</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedReceipt.receiptNumber}</p>
              <div className="mt-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  selectedReceipt.isSimulated !== false ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}>
                  {selectedReceipt.isSimulated !== false ? 'SIMULATED DEMO TRANSACTION (RECORDED IN MONGODB)' : 'RAZORPAY TEST TRANSACTION'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Date & Time:</span>
                <span className="text-white">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-amber-400 font-bold">{selectedReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Booking Ref:</span>
                <span className="text-sky-400">{selectedReceipt.reservationId.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="text-white">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Database Storage:</span>
                <span className="text-emerald-400">MongoDB Atlas / Persistent Store</span>
              </div>
              <div className="flex justify-between py-2 text-base font-bold border-t border-white/10">
                <span className="text-white font-sans">Total Paid:</span>
                <span className="text-emerald-400">₹{selectedReceipt.amount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
