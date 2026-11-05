import React, { useState, useEffect, useRef } from 'react';
import {
  ScanLine, Camera, CheckCircle2, AlertCircle, Clock, Car,
  ShieldCheck, RotateCcw, RefreshCw, LogOut, SlidersHorizontal,
  MapPin, Plus, Minus, Zap, ArrowRight, Check
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { IParkingLot } from '../../backend/models/index.ts';

export const OperatorScannerPage: React.FC = () => {
  const { user } = useAuth();
  const [station, setStation] = useState<IParkingLot | null>(null);
  const [availableCount, setAvailableCount] = useState<number>(0);
  const [occupiedCount, setOccupiedCount] = useState<number>(0);
  const [stationStatus, setStationStatus] = useState<'available' | 'full' | 'closed'>('available');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string>('');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [actionType, setActionType] = useState<'entry' | 'exit'>('entry');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadOperatorStation = async () => {
    try {
      const res = await api.getOperatorStation();
      if (res?.station) {
        setStation(res.station);
        setAvailableCount(res.station.availableSlots ?? (res.station.totalSlots - 5));
        setOccupiedCount(res.station.occupiedSlots ?? 5);
        setStationStatus(res.station.status || 'available');
      }
    } catch (err) {
      console.error('Failed to load operator station:', err);
    }
  };

  const fetchActiveSessions = () => {
    setLoadingSessions(true);
    api.getOperatorSessions()
      .then(res => {
        if (res?.activeSessions) {
          setActiveSessions(res.activeSessions);
        }
      })
      .finally(() => setLoadingSessions(false));
  };

  useEffect(() => {
    loadOperatorStation();
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAvailability = async (newAvail?: number, newOcc?: number, newStat?: 'available' | 'full' | 'closed') => {
    if (!station) return;
    const finalAvail = newAvail !== undefined ? newAvail : availableCount;
    const finalOcc = newOcc !== undefined ? newOcc : occupiedCount;
    const finalStat = newStat !== undefined ? newStat : stationStatus;

    try {
      const res = await api.updateStationAvailability({
        lotId: station._id,
        availableSlots: finalAvail,
        occupiedSlots: finalOcc,
        status: finalStat,
      });

      if (res?.station) {
        setStation(res.station);
        setAvailableCount(res.station.availableSlots);
        setOccupiedCount(res.station.occupiedSlots);
        setStationStatus(res.station.status);
        setStatusMessage('Station live capacity updated successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Failed to update availability:', err);
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
      return;
    }

    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError('Camera access unavailable or permission denied. Use manual token input or demo 1-click scan below.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleProcessScan = async (forcedToken?: string) => {
    const tokenToVerify = (forcedToken || tokenInput).trim();
    if (!tokenToVerify) {
      setScanError('Please enter or scan a valid QR token or booking ID.');
      return;
    }

    setIsProcessing(true);
    setScanResult(null);
    setScanError('');

    try {
      const res = actionType === 'entry'
        ? await api.verifyQREntry(tokenToVerify)
        : await api.verifyQRExit(tokenToVerify);

      if (res?.error) {
        setScanError(res.error);
      } else {
        setScanResult(res);
        setTokenInput('');
        fetchActiveSessions();
        loadOperatorStation();
      }
    } catch (err: any) {
      setScanError(err.message || 'Verification endpoint error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Station Overview & Control Strip */}
      <div className="p-6 rounded-3xl glass-panel border border-cyan-500/25 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <ScanLine className="w-3.5 h-3.5" />
              <span>Operator Terminal – Assigned Station</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {station?.name || 'Pandit Nehru Bus Station (PNBS) Multi-Level'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{station?.address || 'NH 65, Krishnalanka, Vijayawada, AP'}</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-cyan-300">Operator: {user?.name || 'Supervisor'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleUpdateAvailability(availableCount, occupiedCount, 'available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stationStatus === 'available'
                  ? 'glass-badge-green ring-2 ring-emerald-400/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              ● Station Open
            </button>
            <button
              onClick={() => handleUpdateAvailability(availableCount, occupiedCount, 'full')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stationStatus === 'full'
                  ? 'glass-badge-red ring-2 ring-red-400/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              ● Station Full
            </button>
            <button
              onClick={() => handleUpdateAvailability(availableCount, occupiedCount, 'closed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stationStatus === 'closed'
                  ? 'glass-badge-amber ring-2 ring-amber-400/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              ● Closed
            </button>
          </div>
        </div>

        {/* Live Slot Adjustment Controls */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Available Bays Modifier */}
          <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Available Bays</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{availableCount}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const next = Math.max(0, availableCount - 1);
                  setAvailableCount(next);
                  handleUpdateAvailability(next, occupiedCount + 1);
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const next = Math.min((station?.totalSlots || 60), availableCount + 1);
                  setAvailableCount(next);
                  handleUpdateAvailability(next, Math.max(0, occupiedCount - 1));
                }}
                className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Occupied Bays Modifier */}
          <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Occupied Bays</span>
              <div className="text-2xl font-black text-blue-400 mt-1">{occupiedCount}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const next = Math.max(0, occupiedCount - 1);
                  setOccupiedCount(next);
                  handleUpdateAvailability(availableCount + 1, next);
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const next = occupiedCount + 1;
                  setOccupiedCount(next);
                  handleUpdateAvailability(Math.max(0, availableCount - 1), next);
                }}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Station Capacity Overview */}
          <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Station Capacity</span>
              <div className="text-2xl font-black text-white mt-1">{station?.totalSlots || 60} Bays</div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              ₹{station?.hourlyPrice || 30}/hr
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Verification Scanner & Barrier Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: QR Verification & Scanner */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-cyan-400" />
              <span>Gate Barrier Scanner</span>
            </h3>

            {/* Entry / Exit Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setActionType('entry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  actionType === 'entry'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gate Entry
              </button>
              <button
                onClick={() => setActionType('exit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  actionType === 'exit'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gate Exit
              </button>
            </div>
          </div>

          {/* Camera Scanner Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 aspect-video flex flex-col items-center justify-center">
            {cameraActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Live optical camera scanner ready</p>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/10 cursor-pointer"
                >
                  Activate Camera Scanner
                </button>
              </div>
            )}

            {cameraActive && (
              <button
                onClick={toggleCamera}
                className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-black/60 text-xs text-white border border-white/20 cursor-pointer"
              >
                Stop Camera
              </button>
            )}
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 border border-white/10">
              {cameraError}
            </div>
          )}

          {/* Manual Token Input */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleProcessScan();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Paste QR Token (e.g. QR-TOKEN-PNBS-P02-DEMO) or Booking ID"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-white placeholder-slate-400 font-mono"
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? 'Verifying...' : 'Verify Gate'}
            </button>
          </form>

          {/* Quick 1-Click Test Scenarios */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Quick Test Simulation:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleProcessScan('QR-TOKEN-PNBS-P02-DEMO')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-cyan-300 border border-white/10 cursor-pointer"
              >
                Scan PNBS Active Token
              </button>
              <button
                type="button"
                onClick={() => handleProcessScan('QR-TOKEN-TM01-CONFIRMED')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-amber-300 border border-white/10 cursor-pointer"
              >
                Scan Trendset Mall Token
              </button>
            </div>
          </div>

          {/* Scan Result Alert */}
          {scanResult && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Barrier Opened: {scanResult.message}</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 font-mono">
                <div>Vehicle: <strong className="text-white">{scanResult.vehicle?.registrationNumber || 'AP-16-CK-4455'}</strong></div>
                <div>Slot: <strong className="text-white">{scanResult.slot?.slotNumber || 'P-02'}</strong> ({scanResult.slot?.floor || 'Ground'})</div>
                <div>Driver: {scanResult.user?.name || 'Alex Rivera'}</div>
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 space-y-1 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </div>

        {/* Right: Active Station Parking Sessions */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Active Station Sessions</h3>
            </div>
            <button
              onClick={fetchActiveSessions}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingSessions ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading active vehicle bays...</div>
          ) : activeSessions.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-xl text-slate-400 text-xs">
              No active vehicle sessions parked at this gate right now.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {activeSessions.map(session => (
                <div
                  key={session._id}
                  className="p-3.5 rounded-xl glass-card border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {session.vehicle?.registrationNumber || 'AP-16-REG'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Parked
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Bay {session.slot?.slotNumber || 'P-01'} • {session.lot?.name?.split(' ')[0] || 'PNBS'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Entry: {new Date(session.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActionType('exit');
                      handleProcessScan(session.reservation?.qrToken || session.reservationId);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all cursor-pointer flex-shrink-0"
                  >
                    Check-out Exit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
