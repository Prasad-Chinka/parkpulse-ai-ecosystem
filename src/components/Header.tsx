import React, { useState, useRef, useEffect } from 'react';
import {
  User, LogOut, Settings, Shield, Wrench,
  ChevronDown, ExternalLink, QrCode, Sparkles, CheckCircle2,
  Database, Bell, Car, Menu, CreditCard, Moon, Sun,
  Compass, MapPin, KeyRound, MapPinOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { ActiveTab } from './Sidebar.tsx';
import { RoleSwitchModal } from './RoleSwitchModal.tsx';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuthModal: (isRegister?: boolean) => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onToggleMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [locationSettingsOpen, setLocationSettingsOpen] = useState(false);
  const [locationPermGranted, setLocationPermGranted] = useState<boolean | null>(null);

  // Role Switching Modal State
  const [roleSwitchModalOpen, setRoleSwitchModalOpen] = useState(false);
  const [targetRoleToSwitch, setTargetRoleToSwitch] = useState<'operator' | 'admin' | 'user'>('operator');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setLocationPermGranted(result.state === 'granted');
        result.onchange = () => {
          setLocationPermGranted(result.state === 'granted');
        };
      }).catch(() => {
        // ignore
      });
    }
  }, []);

  const openRoleSwitch = (role: 'operator' | 'admin' | 'user') => {
    setTargetRoleToSwitch(role);
    setRoleSwitchModalOpen(true);
    setDropdownOpen(false);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', badge: 'bg-purple-900/60 text-purple-300 border-purple-500/50', icon: Shield };
      case 'operator':
        return { label: 'Station Operator', badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/50', icon: Wrench };
      default:
        return { label: 'Driver / User', badge: 'bg-slate-800 text-slate-300 border-slate-700', icon: User };
    }
  };

  const roleMeta = getRoleBadge(user?.role);
  const RoleIcon = roleMeta.icon;

  return (
    <>
      <header className="sticky top-0 z-30 px-4 sm:px-6 py-2.5 glass-nav flex items-center justify-between transition-colors">
        {/* Left Side: Mobile Menu Button & Brand with Tagline */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 lg:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:neon-glow-purple transition-all">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  ParkPulse AI
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  NEON
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 hidden sm:block">
                Find Smart. Park Easy.
              </p>
            </div>
          </div>

          {/* Top Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'home' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('find-parking')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'find-parking' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              Find Parking
            </button>
            <button
              onClick={() => setActiveTab('stations-directory')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'stations-directory' ? 'text-pink-400 bg-pink-500/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              Parking Stations
              <span className="text-[10px] px-1 rounded-full bg-pink-500/20 text-pink-300 font-mono">20</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('home');
                setTimeout(() => {
                  const el = document.getElementById('how-it-works-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                setActiveTab('home');
                setTimeout(() => {
                  const el = document.getElementById('contact-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Contact
            </button>
          </nav>
        </div>

        {/* Right Side: Theme Switcher & User Account */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'neon-city' ? 'Switch to Professional Light' : 'Switch to Neon City Dark'}
            className="p-2 rounded-xl text-slate-300 hover:text-white glass-card hover:border-purple-500/50 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            {theme === 'neon-city' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline text-[11px] text-amber-300">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline text-[11px] text-purple-300">Neon</span>
              </>
            )}
          </button>

          {/* User Logged In vs Logged Out */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl glass-card hover:border-purple-500/50 transition-all select-none"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    {user.name}
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono uppercase ${roleMeta.badge}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {user.email}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel neon-border-purple shadow-2xl py-2 z-50 animate-fadeIn divide-y divide-white/10">
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-300 font-mono">
                      <RoleIcon className="w-3.5 h-3.5" />
                      Role: {roleMeta.label}
                    </div>
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      onClick={() => {
                        setActiveTab(user.role === 'admin' ? 'admin-dashboard' : user.role === 'operator' ? 'operator-scanner' : 'user-dashboard');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-purple-400" />
                      My Profile & Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('vehicles');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <Car className="w-4 h-4 text-cyan-400" />
                      My Vehicles
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('my-bookings');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-pink-400" />
                      My Bookings & QR Passes
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('payments');
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Payment History & Receipts
                    </button>
                    <button
                      onClick={() => {
                        setLocationSettingsOpen(true);
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-amber-400" />
                      Location Settings
                    </button>
                  </div>

                  {/* Role Elevation Menu */}
                  <div className="py-1 text-xs">
                    <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Privileged Roles
                    </div>
                    {user.role !== 'operator' && (
                      <button
                        onClick={() => openRoleSwitch('operator')}
                        className="w-full px-4 py-2 text-left text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Wrench className="w-3.5 h-3.5" />
                          Switch to Operator
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30">
                          121826
                        </span>
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => openRoleSwitch('admin')}
                        className="w-full px-4 py-2 text-left text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Shield className="w-3.5 h-3.5" />
                          Switch to Admin
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/30">
                          261218
                        </span>
                      </button>
                    )}
                    {user.role !== 'user' && (
                      <button
                        onClick={() => openRoleSwitch('user')}
                        className="w-full px-4 py-2 text-left text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        Revert to Driver Mode
                      </button>
                    )}
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white rounded-xl glass-card hover:border-purple-500/50 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuthModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl btn-neon-gradient transition-all shadow-md"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Role Switch Security Modal */}
      <RoleSwitchModal
        isOpen={roleSwitchModalOpen}
        onClose={() => setRoleSwitchModalOpen(false)}
        targetRole={targetRoleToSwitch}
        onSuccess={() => {
          if (targetRoleToSwitch === 'admin') setActiveTab('admin-dashboard');
          else if (targetRoleToSwitch === 'operator') setActiveTab('operator-scanner');
          else setActiveTab('user-dashboard');
        }}
      />

      {/* Location Settings Modal */}
      {locationSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-panel neon-border-cyan shadow-2xl">
            <button
              onClick={() => setLocationSettingsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Location Intelligence Settings</h3>
                <p className="text-xs text-slate-300">Privacy-compliant GPS & distance sorting</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Browser Geolocation Permission:</span>
                  <span className={`px-2 py-0.5 rounded font-mono uppercase text-[10px] ${locationPermGranted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'}`}>
                    {locationPermGranted ? 'Active / Granted' : 'Manual / Not Granted'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ParkPulse AI uses HTML5 geolocation strictly in the foreground to calculate distance to nearby Vijayawada, Guntur, and Tenali parking stations. We never track your location in the background.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                <strong>Privacy Policy:</strong> Real coordinates are never shared with unrelated users. Operators only receive approximate arrival radius for confirmed bookings.
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => setLocationSettingsOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl btn-neon-cyan"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
