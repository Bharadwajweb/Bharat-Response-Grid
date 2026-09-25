import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Wifi, Lock, Mail, AlertCircle, ArrowRight, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';

const AUTHORIZED_OFFICERS = [
  { name: 'NDMA Director (National)', email: 'director@ndma.gov.in', password: 'admin', role: 'national_admin', initials: 'ND', commandLevel: 'national', stateAssigned: undefined },
  { name: 'AP SDMA Officer (State)', email: 'officer@apsdma.ap.gov.in', password: 'admin', role: 'state_admin', initials: 'AP', commandLevel: 'state', stateAssigned: 'Andhra Pradesh' },
  { name: 'Vizag Collector (District)', email: 'collector@vizag.ap.gov.in', password: 'admin', role: 'district_admin', initials: 'VC', commandLevel: 'district', stateAssigned: 'Andhra Pradesh', districtAssigned: 'Visakhapatnam' },
  { name: 'NDRF 10th Bn Commandant', email: 'commandant@ndrf.gov.in', password: 'admin', role: 'responder', initials: 'NC', commandLevel: 'state', stateAssigned: 'Andhra Pradesh' },
];

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuthenticated, setCurrentUser } = useAppStore();

  const [email, setEmail] = useState('director@ndma.gov.in');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const account = AUTHORIZED_OFFICERS.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (account) {
      setCurrentUser({
        id: `USR-${account.initials}`,
        name: account.name,
        email: account.email,
        role: account.role as any,
        commandLevel: account.commandLevel as any,
        stateAssigned: account.stateAssigned,
        districtAssigned: (account as any).districtAssigned,
        avatarInitials: account.initials,
        status: 'active',
        lastActive: 'now',
      });
      setAuthenticated(true);
      navigate('/');
    } else if (email && password) {
      // Allow general government officer login
      const namePart = email.split('@')[0].replace('.', ' ');
      setCurrentUser({
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
        email,
        role: email.includes('director') ? 'national_admin' : 'state_admin',
        commandLevel: email.includes('district') ? 'district' : 'national',
        avatarInitials: namePart.substring(0, 2).toUpperCase(),
        status: 'active',
        lastActive: 'now',
      });
      setAuthenticated(true);
      navigate('/');
    } else {
      setError('Please provide valid official credentials.');
    }
    setLoading(false);
  };

  const handleQuickLogin = (account: typeof AUTHORIZED_OFFICERS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Background gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/25 mb-5 shadow-xl shadow-blue-500/10">
            <Shield size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('auth.title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5 tracking-widest uppercase">{t('auth.subtitle')}</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0D1828] border border-white/8 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Status bar */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/8 border-b border-green-500/15">
            <Wifi size={12} className="text-green-400" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">{t('auth.status')}</span>
          </div>

          <form onSubmit={handleLogin} className="px-6 py-6 space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Mail size={11} /> {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#132238] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 px-3 py-2.5 transition-all"
                placeholder="official@gov.in"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Lock size={11} /> {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#132238] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 px-3 py-2.5 pr-10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Forgot */}
            <div className="flex justify-end">
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">{t('auth.forgot')}</button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.login')}
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-slate-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Citizen button */}
            <button
              type="button"
              onClick={() => navigate('/citizen')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/8 text-slate-300 text-sm font-medium border border-white/10 transition-all"
            >
              <Users size={14} />
              {t('auth.citizen')}
            </button>
          </form>
        </motion.div>

        {/* Authorized Command Profiles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <p className="text-xs text-center text-slate-500 mb-2 uppercase tracking-wider font-semibold">
            Authorized Command Profiles (Fast Access)
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {AUTHORIZED_OFFICERS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleQuickLogin(acc)}
                className="text-xs px-3 py-1.5 rounded-md bg-white/5 border border-white/8 text-slate-300 hover:text-white hover:bg-white/10 hover:border-blue-500/40 transition-all"
              >
                {acc.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-700 mt-6">
          National Disaster Management Authority · Government of India
        </p>
      </div>
    </div>
  );
};
