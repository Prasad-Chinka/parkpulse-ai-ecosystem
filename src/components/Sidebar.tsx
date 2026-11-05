import React, { useState, useEffect } from 'react';
import {
  Car,
  Compass,
  Grid3X3,
  QrCode,
  CreditCard,
  ScanLine,
  LayoutDashboard,
  MapPin,
  Clock,
  LogOut,
  Shield,
  Wrench,
  User,
  ChevronRight,
  X,
  Sparkles,
  Database,
  Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { RoleSwitchModal } from './RoleSwitchModal.tsx';

export type ActiveTab =
  | 'find-parking'
  | 'stations-directory'
  | 'slot-grid'
  | 'user-dashboard'
  | 'my-bookings'
  | 'vehicles'
  | 'payments'
  | 'operator-scanner'
  | 'admin-dashboard'
  | 'home'; // Overview MUST be LAST

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedLotId?: string;
  setSelectedLotId?: (id: string) => void;
  onOpenAuthModal?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [dbInfo, setDbInfo] = useState<{ type: string; isMongo: boolean; count: number }>({
    type: 'loading',
    isMongo: false,
    count: 20,
  });

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<'operator' | 'admin' | 'user'>('operator');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.getSystemStatus()
      .then(res => {
        if (res) {
          setDbInfo({
            type: res.database?.type || 'embedded',
            isMongo: res.database?.isMongoActive || false,
            count: res.counts?.parkingLots || 20,
          });
        }
      })
      .catch(() => {
        setDbInfo({ type: 'embedded', isMongo: false, count: 20 });
      });
  }, []);

  // Main navigation items with OVERVIEW strictly as the LAST item
  const navItems = [
    { id: 'find-parking', label: 'Find Parking & Map', icon: Navigation, role: 'all', badge: 'Live GPS' },
    { id: 'stations-directory', label: '20 Stations Directory', icon: MapPin, role: 'all', badge: 'AP Hub' },
    { id: 'slot-grid', label: 'Interactive Slot Grid', icon: Grid3X3, role: 'all' },
    { id: 'user-dashboard', label: 'Driver Dashboard', icon: User, role: 'user' },
    { id: 'my-bookings', label: 'My Bookings & QR', icon: QrCode, role: 'user' },
    { id: 'vehicles', label: 'My Vehicles', icon: Car, role: 'user' },
    { id: 'payments', label: 'Payment Receipts', icon: CreditCard, role: 'user' },
    { id: 'operator-scanner', label: 'Operator Station', icon: ScanLine, role: 'operator' },
    { id: 'admin-dashboard', label: 'Admin Command', icon: LayoutDashboard, role: 'admin' },
    { id: 'home', label: 'Overview', icon: Compass, role: 'all' }, // STRICT REQUIREMENT: Overview as LAST item
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.role === 'all') return true;
    if (!user) return item.role === 'user';
    if (user.role === 'admin') return true; // Admin can view everything
    if (user.role === 'operator') return item.role === 'operator' || item.role === 'user';
    return item.role === 'user';
  });

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId as ActiveTab);
    setIsMobileOpen(false);
  };

  const openSwitchRole = (r: 'operator' | 'admin' | 'user') => {
    setTargetRole(r);
    setRoleModalOpen(true);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Mobile close */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:neon-glow-purple transition-all">
              P
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                ParkPulse AI
                <span className="text-[9px] font-mono px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  v3
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Find Smart. Park Easy.</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Clock & DB Telemetry */}
        <div className="px-4 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Clock className="w-3 h-3" />
            <span>{currentTime || '12:00:00'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Database className="w-3 h-3 text-purple-400" />
            <span>{dbInfo.count} Stations</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLastOverview = item.id === 'home';

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/90 to-cyan-600/90 text-white shadow-lg shadow-purple-600/20 neon-glow-purple border border-white/20'
                    : isLastOverview
                    ? 'text-slate-300 hover:text-white hover:bg-white/5 border border-dashed border-white/10 mt-3'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isLastOverview ? 'text-cyan-400' : 'text-purple-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && !isActive && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/20">
                    {item.badge}
                  </span>
                )}
                {isLastOverview && !isActive && (
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    Last
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Role Switcher Box */}
        <div className="p-3 mx-3 mb-3 rounded-2xl glass-card neon-border-purple/50 bg-purple-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Role Switcher
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              {user?.role || 'Guest'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
            {user?.role !== 'operator' && (
              <button
                onClick={() => openSwitchRole('operator')}
                className="px-2 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1 transition-colors"
                title="Code: 121826"
              >
                <Wrench className="w-3 h-3" />
                Operator
              </button>
            )}
            {user?.role !== 'admin' && (
              <button
                onClick={() => openSwitchRole('admin')}
                className="px-2 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 flex items-center justify-center gap-1 transition-colors"
                title="Code: 261218"
              >
                <Shield className="w-3 h-3" />
                Admin
              </button>
            )}
            {user && user.role !== 'user' && (
              <button
                onClick={() => openSwitchRole('user')}
                className="col-span-2 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center gap-1 transition-colors"
              >
                <User className="w-3 h-3" />
                Revert to Driver Mode
              </button>
            )}
          </div>
        </div>

        {/* User Footer / Login Action */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal && onOpenAuthModal()}
              className="w-full py-2 text-xs font-bold rounded-xl btn-neon-gradient text-center shadow-md flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Sign In / Demo Access
            </button>
          )}
        </div>
      </aside>

      <RoleSwitchModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        targetRole={targetRole}
        onSuccess={() => {
          if (targetRole === 'admin') setActiveTab('admin-dashboard');
          else if (targetRole === 'operator') setActiveTab('operator-scanner');
          else setActiveTab('user-dashboard');
        }}
      />
    </>
  );
};
