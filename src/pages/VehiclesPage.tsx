import React, { useState, useEffect } from 'react';
import {
  Car,
  Bike,
  Zap,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.ts';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadVehicles = () => {
    setLoading(true);
    api.getVehicles()
      .then(res => {
        if (res?.vehicles) setVehicles(res.vehicles);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!registrationNumber || !brand || !model || !color) {
      setError('Please fill in all vehicle registration fields.');
      return;
    }

    try {
      const res = await api.addVehicle({
        registrationNumber: registrationNumber.trim().toUpperCase(),
        vehicleType,
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim(),
      });

      if (res?.vehicle) {
        setMessage(`Vehicle ${res.vehicle.registrationNumber} registered successfully.`);
        setRegistrationNumber('');
        setBrand('');
        setModel('');
        setColor('');
        setShowAddForm(false);
        loadVehicles();
      } else {
        setError(res?.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    const res = await api.deleteVehicle(id);
    if (res?.message) {
      setVehicles(prev => prev.filter(v => v._id !== id));
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'ev': return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'bike': return <Bike className="w-5 h-5 text-amber-400" />;
      case 'suv': return <Truck className="w-5 h-5 text-purple-400" />;
      default: return <Car className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Car className="w-3.5 h-3.5" /> Fleet & Vehicle Management
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">My Registered Vehicles</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your registered automobiles for automated bay compatibility and frictionless gate access.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" /> {showAddForm ? 'Cancel Form' : 'Register Vehicle'}
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Vehicle Form Modal/Panel */}
      {showAddForm && (
        <div className="p-6 rounded-2xl glass-panel border border-sky-500/30 space-y-4">
          <h3 className="text-base font-bold text-white">Add New Vehicle</h3>
          <form onSubmit={handleCreateVehicle} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. KA-01-AB-1234"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Vehicle Classification</label>
                <select
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                >
                  <option value="car">Car (Sedan / Hatchback)</option>
                  <option value="suv">SUV / MUV / Compact Truck</option>
                  <option value="bike">Two Wheeler (Motorcycle / Scooter)</option>
                  <option value="ev">Electric Vehicle (EV Charging Enabled)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Brand / Make</label>
                <input
                  type="text"
                  placeholder="e.g. Honda, Tesla, Hyundai"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Model</label>
                <input
                  type="text"
                  placeholder="e.g. Civic, Model 3, Creta"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">Vehicle Color</label>
                <input
                  type="text"
                  placeholder="e.g. Obsidian Blue, Pearl White, Silver"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles Grid */}
      {loading ? (
        <div className="p-16 rounded-2xl glass-panel text-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading registered fleet...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-16 rounded-2xl glass-panel text-center space-y-3">
          <Car className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Vehicles Registered</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add your vehicle details to unlock instantaneous slot allocation and one-tap reservation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map(v => (
            <div
              key={v._id}
              className="p-5 rounded-2xl glass-card border border-white/10 flex items-start justify-between relative overflow-hidden"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center shrink-0">
                  {getVehicleIcon(v.vehicleType)}
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-base font-bold text-white tracking-wide">
                    {v.registrationNumber}
                  </span>
                  <p className="text-xs font-semibold text-slate-300">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Color: <span className="text-slate-300">{v.color}</span> · Type:{' '}
                    <span className="uppercase text-sky-400 font-mono font-semibold">{v.vehicleType}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDeleteVehicle(v._id)}
                className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                title="Remove Vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
