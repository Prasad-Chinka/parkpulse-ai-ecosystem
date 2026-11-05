import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield, User, Wrench, AlertCircle, CheckCircle2, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  onClose: () => void;
  defaultRole?: 'user' | 'admin' | 'operator';
  initialRegisterMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, defaultRole = 'user', initialRegisterMode = false }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(initialRegisterMode);
  const [activeTab, setActiveTab] = useState<'user' | 'operator' | 'admin'>(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemoCreds = (selectedRole: 'user' | 'operator' | 'admin') => {
    setActiveTab(selectedRole);
    setIsRegister(false);
    setError('');
    if (selectedRole === 'admin') {
      setEmail('admin@parkpulse.demo');
      setPassword('Admin@12345');
    } else if (selectedRole === 'operator') {
      setEmail('operator@parkpulse.demo');
      setPassword('Operator@12345');
    } else {
      setEmail('driver@parkpulse.demo');
      setPassword('User@12345');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register(name, email, password, phone, activeTab);
        if (!res.success) setError(res.error || 'Registration failed');
        else onClose();
      } else {
        const res = await login(email, password);
        if (!res.success) setError(res.error || 'Login failed');
        else onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">
                {isRegister ? 'Create an Account' : 'Sign In to ParkPulse'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">ParkPulse AI Intelligent Parking Platform</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DEMO ACCESS SECTION (Prominently displayed) */}
        <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              DEMO ACCESS
            </span>
            <span className="text-[10px] bg-blue-200/70 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              Quick 1-Click
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {/* Admin Demo */}
            <button
              type="button"
              onClick={() => fillDemoCreds('admin')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                activeTab === 'admin' && !isRegister
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Shield className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'admin' && !isRegister ? 'text-white' : 'text-purple-600'}`} />
                <div className="truncate">
                  <span className="font-bold">Admin:</span> <span className="font-mono text-[11px]">admin@parkpulse.demo</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono shrink-0 ml-1 ${activeTab === 'admin' && !isRegister ? 'text-blue-100' : 'text-slate-500'}`}>
                Admin@12345
              </span>
            </button>

            {/* Operator Demo */}
            <button
              type="button"
              onClick={() => fillDemoCreds('operator')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                activeTab === 'operator' && !isRegister
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Wrench className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'operator' && !isRegister ? 'text-white' : 'text-amber-600'}`} />
                <div className="truncate">
                  <span className="font-bold">Operator:</span> <span className="font-mono text-[11px]">operator@parkpulse.demo</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono shrink-0 ml-1 ${activeTab === 'operator' && !isRegister ? 'text-blue-100' : 'text-slate-500'}`}>
                Operator@12345
              </span>
            </button>

            {/* Driver Demo */}
            <button
              type="button"
              onClick={() => fillDemoCreds('user')}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                activeTab === 'user' && !isRegister
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'user' && !isRegister ? 'text-white' : 'text-blue-600'}`} />
                <div className="truncate">
                  <span className="font-bold">Driver:</span> <span className="font-mono text-[11px]">driver@parkpulse.demo</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono shrink-0 ml-1 ${activeTab === 'user' && !isRegister ? 'text-blue-100' : 'text-slate-500'}`}>
                User@12345
              </span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. admin@parkpulse.demo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
                <select
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="user">Driver / Standard User</option>
                  <option value="operator">Station Operator</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+91 866-242-9900"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Complete Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            {isRegister ? 'Already registered? Sign In' : "Don't have an account? Sign Up here"}
          </button>
        </div>
      </div>
    </div>
  );
};
