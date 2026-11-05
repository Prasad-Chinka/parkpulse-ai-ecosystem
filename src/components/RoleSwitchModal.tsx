import React, { useState } from 'react';
import { Shield, KeyRound, Lock, AlertCircle, CheckCircle2, X, Sparkles, User, Wrench } from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'operator' | 'admin' | 'user';
  onSuccess?: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  onSuccess,
}) => {
  const { user, login } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  if (!isOpen) return null;

  const isDemotingToUser = targetRole === 'user';
  const roleTitle = targetRole === 'admin' ? 'Administrator' : targetRole === 'operator' ? 'Station Operator' : 'Driver / User';
  const demoCodeHint = targetRole === 'admin' ? '261218' : targetRole === 'operator' ? '121826' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await api.verifyRoleSwitch({
        targetRole,
        accessCode: isDemotingToUser ? undefined : accessCode.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Authorization failed. Invalid security code.');
        if (res.remainingAttempts !== undefined) {
          setRemainingAttempts(res.remainingAttempts);
        }
        if (res.locked) {
          setIsLocked(true);
        }
        return;
      }

      // Update auth session with newly generated JWT token
      if (res.token && res.user) {
        localStorage.setItem('parkpulse_token', res.token);
        // Refresh local session
        login(res.token, res.user);
      }

      setSuccessMessage(res.message || `Privileges authorized! Switched to ${roleTitle}.`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during role verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillDemoCode = () => {
    if (demoCodeHint) {
      setAccessCode(demoCodeHint);
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-panel neon-border-purple shadow-2xl">
        {/* Glow orb */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-600/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${targetRole === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : targetRole === 'operator' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'}`}>
            {targetRole === 'admin' ? <Shield className="w-6 h-6" /> : targetRole === 'operator' ? <Wrench className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Elevate to {roleTitle}
              <span className="text-xs px-2 py-0.5 rounded font-mono uppercase bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Secure
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              {isDemotingToUser
                ? 'Revert to standard Driver / Vehicle Owner privileges.'
                : 'Backend-authorized cryptographic elevation with audit log tracking.'}
            </p>
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              {remainingAttempts !== null && remainingAttempts > 0 && !isLocked && (
                <p className="mt-1 text-slate-300">
                  {remainingAttempts} attempt(s) remaining before temporary 5-minute security lockout.
                </p>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isDemotingToUser ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  {roleTitle} Access Password
                </label>
                {demoCodeHint && (
                  <button
                    type="button"
                    onClick={handleAutofillDemoCode}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Fill Demo Code ({demoCodeHint})
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  disabled={loading || isLocked}
                  placeholder={`Enter ${roleTitle} security code...`}
                  className="w-full px-4 py-2.5 text-sm rounded-xl glass-input placeholder-slate-400 font-mono tracking-wider focus:neon-border-purple disabled:opacity-50"
                  autoFocus
                />
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>

              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Stored in environment variables (never exposed)</span>
                <span className="font-mono text-purple-400">Rate limited</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              Confirm reverting from <strong>{user?.role?.toUpperCase()}</strong> back to standard Driver role. You can re-elevate anytime with your security access code.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-300 rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!isDemotingToUser && !accessCode.trim()) || isLocked}
              className="px-5 py-2 text-xs font-bold rounded-xl btn-neon-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Cryptographic Claim...
                </>
              ) : isDemotingToUser ? (
                'Confirm Switch to Driver'
              ) : (
                `Authorize & Switch to ${roleTitle}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
