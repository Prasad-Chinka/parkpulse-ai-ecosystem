import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Car, CreditCard, Download, Plus,
  RefreshCw, CheckCircle2, Clock, Layers, AlertCircle, MapPin,
  Shield, Wrench, Trash2, Edit3, Check, X, ExternalLink, Zap
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IParkingLot } from '../../backend/models/index.ts';

interface AdminDashboardProps {
  onNavigateToSlots: (lotId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToSlots }) => {
  const [kpis, setKpis] = useState<any>(null);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [lots, setLots] = useState<IParkingLot[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stations' | 'operators' | 'reservations' | 'users' | 'add-slot' | 'audit-logs' | 'analytics'>('stations');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Station Modal state
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<IParkingLot | null>(null);
  const [stationName, setStationName] = useState('');
  const [stationAddress, setStationAddress] = useState('');
  const [stationArea, setStationArea] = useState('PNBS / Krishnalanka');
  const [stationCapacity, setStationCapacity] = useState(30);
  const [stationPrice, setStationPrice] = useState(30);
  const [stationHours, setStationHours] = useState('24/7 Mon-Sun');
  const [stationLat, setStationLat] = useState(16.5074);
  const [stationLng, setStationLng] = useState(80.6277);
  const [stationStatus, setStationStatus] = useState<'available' | 'full' | 'closed'>('available');

  // Operator Modal state
  const [showOpModal, setShowOpModal] = useState(false);
  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [opPhone, setOpPhone] = useState('');
  const [opLotId, setOpLotId] = useState('');

  // Add slot form state
  const [newSlotLotId, setNewSlotLotId] = useState('');
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newSlotFloor, setNewSlotFloor] = useState('Ground Floor');
  const [newSlotPrice, setNewSlotPrice] = useState(30);
  const [slotAddSuccess, setSlotAddSuccess] = useState('');
  const [slotAddError, setSlotAddError] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getAdminDashboard(),
      api.getAdminReservations(),
      api.getAdminUsers(),
      api.getLots(),
      api.getAdminOperators(),
      api.adminGetAuditLogs(50),
      api.getAdminAnalytics(),
    ])
      .then(([dashRes, resvRes, usersRes, lotsRes, opRes, auditRes, analyticsRes]) => {
        if (dashRes?.kpis) setKpis(dashRes.kpis);
        if (resvRes?.reservations) setRecentReservations(resvRes.reservations);
        if (usersRes?.users) setUsersList(usersRes.users);
        if (lotsRes?.lots) {
          setLots(lotsRes.lots);
          if (lotsRes.lots.length > 0 && !newSlotLotId) {
            setNewSlotLotId(lotsRes.lots[0]._id);
            setOpLotId(lotsRes.lots[0]._id);
          }
        }
        if (opRes?.operators) setOperators(opRes.operators);
        if (auditRes?.logs) setAuditLogs(auditRes.logs);
        if (analyticsRes) setAnalyticsData(analyticsRes);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStationVerification = async (lotId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'verified' ? 'unverified' : 'verified';
    try {
      await api.adminVerifyStation(lotId, nextStatus);
      loadData();
    } catch (err: any) {
      console.error('Failed to toggle verification:', err);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/admin/export-csv', '_blank');
  };

  // Station Actions
  const handleOpenNewStation = () => {
    setEditingStation(null);
    setStationName('');
    setStationAddress('Vijayawada, Andhra Pradesh');
    setStationArea('Vijayawada Central');
    setStationCapacity(30);
    setStationPrice(30);
    setStationHours('24/7 Mon-Sun');
    setStationLat(16.5074);
    setStationLng(80.6277);
    setStationStatus('available');
    setShowStationModal(true);
  };

  const handleOpenEditStation = (st: IParkingLot) => {
    setEditingStation(st);
    setStationName(st.name);
    setStationAddress(st.address);
    setStationArea(st.area || 'Vijayawada Central');
    setStationCapacity(st.totalSlots);
    setStationPrice(st.hourlyPrice);
    setStationHours(st.operatingHours);
    setStationLat(st.latitude);
    setStationLng(st.longitude);
    setStationStatus(st.status || 'available');
    setShowStationModal(true);
  };

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: stationName,
        address: stationAddress,
        area: stationArea,
        city: 'Vijayawada',
        latitude: Number(stationLat),
        longitude: Number(stationLng),
        totalSlots: Number(stationCapacity),
        availableSlots: Number(stationCapacity) - 5,
        occupiedSlots: 5,
        hourlyPrice: Number(stationPrice),
        operatingHours: stationHours,
        status: stationStatus,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(stationName + ' Vijayawada')}`,
        vehicleCategories: ['car', 'bike', 'suv', 'ev'],
        amenities: ['CCTV Security', 'Automated Boom Barrier', 'EV Charging'],
      };

      if (editingStation) {
        await api.updateStation(editingStation._id, payload);
      } else {
        await api.createStation(payload);
      }
      setShowStationModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save station:', err);
    }
  };

  const handleDeleteStation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this parking station?')) return;
    try {
      await api.deleteStation(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete station:', err);
    }
  };

  // Operator Actions
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminOperator({
        name: opName,
        email: opEmail,
        password: opPassword,
        phone: opPhone,
        assignedLotId: opLotId,
      });
      setShowOpModal(false);
      setOpName('');
      setOpEmail('');
      setOpPassword('');
      setOpPhone('');
      loadData();
    } catch (err) {
      console.error('Failed to create operator:', err);
    }
  };

  const handleToggleOperatorStatus = async (opId: string, currentStatus: boolean) => {
    try {
      await api.updateOperatorStatus(opId, !currentStatus);
      loadData();
    } catch (err) {
      console.error('Failed to toggle operator status:', err);
    }
  };

  const handleAssignOperatorLot = async (opId: string, lotId: string) => {
    try {
      await api.assignOperatorStation(opId, lotId);
      loadData();
    } catch (err) {
      console.error('Failed to reassign operator:', err);
    }
  };

  // Add Slot
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotAddSuccess('');
    setSlotAddError('');

    if (!newSlotLotId || !newSlotNumber.trim()) {
      setSlotAddError('Facility and slot number are required.');
      return;
    }

    try {
      const res = await api.addSlot({
        lotId: newSlotLotId,
        slotNumber: newSlotNumber.trim().toUpperCase(),
        floor: newSlotFloor,
        hourlyPrice: Number(newSlotPrice),
        vehicleTypes: ['car', 'suv', 'ev'],
      });

      if (res?.slot) {
        setSlotAddSuccess(`Slot ${res.slot.slotNumber} added successfully to facility.`);
        setNewSlotNumber('');
        loadData();
      } else {
        setSlotAddError(res?.error || 'Failed to add slot');
      }
    } catch (err: any) {
      setSlotAddError(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-cyan-500/25 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-600/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <LayoutDashboard className="w-3.5 h-3.5" /> Administrator Command Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Vijayawada Smart Mobility Hub Management
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Monitor citywide parking occupancy, revenue streams, configure multi-level facilities, and manage field operators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-emerald-400 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Commercial SaaS Glassmorphism KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Stations */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Stations</span>
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {lots.length || 7}
          </div>
          <span className="text-[10px] text-cyan-300 font-mono">Vijayawada Hubs</span>
        </div>

        {/* Total Capacity */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Capacity</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {kpis?.totalSlots || lots.reduce((acc, l) => acc + l.totalSlots, 0) || 285}
          </div>
          <span className="text-[10px] text-blue-300 font-mono">Total Bays</span>
        </div>

        {/* Available Slots */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Free Slots</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {kpis?.availableSlots || lots.reduce((acc, l) => acc + (l.availableSlots ?? (l.totalSlots - 5)), 0) || 165}
          </div>
          <span className="text-[10px] text-emerald-300 font-mono">Ready to Book</span>
        </div>

        {/* Occupied Slots */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Occupied</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            {kpis?.occupiedSlots || 120}
          </div>
          <span className="text-[10px] text-amber-300 font-mono">In Park Session</span>
        </div>

        {/* Active Operators */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Operators</span>
            <Wrench className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-2">
            {operators.filter(o => o.isActive).length || 2}
          </div>
          <span className="text-[10px] text-purple-300 font-mono">Active on Field</span>
        </div>

        {/* Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gross Revenue</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            ₹{kpis?.totalRevenue || 190}
          </div>
          <span className="text-[10px] text-cyan-300 font-mono">Digital & Demo Txns</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('stations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'stations'
              ? 'btn-neon-purple shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          20 Stations ({lots.length})
        </button>

        <button
          onClick={() => setActiveTab('operators')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'operators'
              ? 'btn-neon-purple shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Operator Management ({operators.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reservations'
              ? 'btn-neon-purple shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Bookings & Transactions ({recentReservations.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'btn-neon-purple shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          User Accounts ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit-logs'
              ? 'btn-neon-purple shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Audit Logs & Security ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'btn-neon-purple shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          City Distribution & Analytics
        </button>

        <button
          onClick={() => setActiveTab('add-slot')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'add-slot'
              ? 'btn-neon-purple shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Add Parking Slot
        </button>
      </div>

      {/* Tab 1: Parking Stations Management */}
      {activeTab === 'stations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Vijayawada Parking Hubs</h3>
              <p className="text-xs text-slate-400">Add, edit, or configure live parking stations across the city.</p>
            </div>
            <button
              onClick={handleOpenNewStation}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Parking Station</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lots.map(lot => (
              <div
                key={lot._id}
                className="p-5 rounded-2xl glass-card border border-white/10 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-500/30">
                      {lot.area || 'Vijayawada'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lot.status === 'full'
                          ? 'glass-badge-red'
                          : lot.status === 'closed'
                          ? 'glass-badge-amber'
                          : 'glass-badge-green'
                      }`}
                    >
                      {lot.status || 'available'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base leading-snug">{lot.name}</h4>
                  <p className="text-xs text-slate-300 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{lot.address}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/80">
                      <span className="text-[10px] text-slate-400 block">Tariff</span>
                      <span className="font-bold text-white">₹{lot.hourlyPrice}/hr</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80">
                      <span className="text-[10px] text-slate-400 block">Total Capacity</span>
                      <span className="font-bold text-white">{lot.totalSlots} Bays</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigateToSlots(lot._id)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    View Slots
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditStation(lot)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Station"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStation(lot._id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Station"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Operator Management */}
      {activeTab === 'operators' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Parking Operator Accounts</h3>
              <p className="text-xs text-slate-400">Manage field operators, status activation, and station assignments.</p>
            </div>
            <button
              onClick={() => setShowOpModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Operator</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl glass-panel border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Operator Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Assigned Station</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {operators.map(op => (
                  <tr key={op._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                        {op.name.charAt(0)}
                      </div>
                      <span>{op.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{op.email}</td>
                    <td className="py-3 px-4 text-slate-300">{op.phone || '+91 866-242-9900'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={op.assignedLotId || ''}
                        onChange={e => handleAssignOperatorLot(op._id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-cyan-300 cursor-pointer"
                      >
                        <option value="">-- Unassigned --</option>
                        {lots.map(l => (
                          <option key={l._id} value={l._id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          op.isActive !== false ? 'glass-badge-green' : 'glass-badge-red'
                        }`}
                      >
                        {op.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleOperatorStatus(op._id, op.isActive !== false)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          op.isActive !== false
                            ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                        }`}
                      >
                        {op.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Reservations & Transactions */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Live Reservations & Transactions</h3>
            <span className="text-xs text-slate-400">Total: {recentReservations.length}</span>
          </div>

          <div className="overflow-x-auto rounded-2xl glass-panel border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Station / Bay</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Tariff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">QR Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentReservations.map(res => (
                  <tr key={res._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white text-[11px]">
                      #{res._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{res.userName || 'Driver'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{res.userEmail || ''}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{res.lotName || 'Station'}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">Bay: {res.slotNumber || 'P-01'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">₹{res.totalAmount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          res.bookingStatus === 'active'
                            ? 'glass-badge-blue'
                            : res.bookingStatus === 'completed'
                            ? 'glass-badge-green'
                            : 'glass-badge-amber'
                        }`}
                      >
                        {res.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {res.qrToken || 'QR-GENERATED'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: User Accounts */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Registered Users & Drivers</h3>
            <span className="text-xs text-slate-400">Total Users: {usersList.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {usersList.map(u => (
              <div key={u._id} className="p-4 rounded-xl glass-card border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{u.name}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-semibold bg-blue-500/20 text-cyan-300">
                    {u.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                <div className="text-[11px] text-slate-500">
                  Phone: {u.phone || '+91 866-242-9900'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Add Parking Slot */}
      {activeTab === 'add-slot' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            <span>Add Parking Slot to Station</span>
          </h3>

          {slotAddSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{slotAddSuccess}</span>
            </div>
          )}

          {slotAddError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{slotAddError}</span>
            </div>
          )}

          <form onSubmit={handleAddSlot} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Station</label>
              <select
                value={newSlotLotId}
                onChange={e => setNewSlotLotId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
              >
                {lots.map(l => (
                  <option key={l._id} value={l._id} className="bg-slate-900">
                    {l.name} ({l.area})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Slot Identifier</label>
              <input
                type="text"
                placeholder="e.g. PNBS-G21 or TM-B30"
                value={newSlotNumber}
                onChange={e => setNewSlotNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Floor / Tier</label>
                <input
                  type="text"
                  placeholder="e.g. Level 1"
                  value={newSlotFloor}
                  onChange={e => setNewSlotFloor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hourly Price (₹)</label>
                <input
                  type="number"
                  value={newSlotPrice}
                  onChange={e => setNewSlotPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white font-mono"
                  min="10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              Inject New Bay into Station
            </button>
          </form>
        </div>
      )}

      {/* Add / Edit Station Modal */}
      {showStationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 border border-white/10 shadow-2xl relative space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>{editingStation ? 'Edit Station Details' : 'Add Vijayawada Station'}</span>
              </h3>
              <button
                onClick={() => setShowStationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Station Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pandit Nehru Bus Station Multi-Level"
                  value={stationName}
                  onChange={e => setStationName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Address & Landmarks</label>
                <input
                  type="text"
                  placeholder="e.g. NH 65, Krishnalanka, Vijayawada, AP"
                  value={stationAddress}
                  onChange={e => setStationAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Krishnalanka / PNBS"
                    value={stationArea}
                    onChange={e => setStationArea(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 24/7 Mon-Sun"
                    value={stationHours}
                    onChange={e => setStationHours(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Capacity</label>
                  <input
                    type="number"
                    value={stationCapacity}
                    onChange={e => setStationCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                    min="5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tariff (₹/hr)</label>
                  <input
                    type="number"
                    value={stationPrice}
                    onChange={e => setStationPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                    min="10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={stationStatus}
                    onChange={e => setStationStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {editingStation ? 'Update Station' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Operator Modal */}
      {showOpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-white/10 shadow-2xl relative space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Create Operator Account</span>
              </h3>
              <button
                onClick={() => setShowOpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOperator} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Operator Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={opName}
                  onChange={e => setOpName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Login Email</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh.op@parkpulse.io"
                  value={opEmail}
                  onChange={e => setOpEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={opPassword}
                  onChange={e => setOpPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 866-242-9900"
                  value={opPhone}
                  onChange={e => setOpPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Station</label>
                <select
                  value={opLotId}
                  onChange={e => setOpLotId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-white bg-slate-900"
                >
                  {lots.map(l => (
                    <option key={l._id} value={l._id} className="bg-slate-900">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  Create Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
