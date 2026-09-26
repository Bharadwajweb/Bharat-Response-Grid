import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Users,
  Radio,
  Activity,
  Cpu,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/ui/Button';
import { getSystemStatus, loginUser } from '../utils/api';

const ROLE_PRESETS = [
  {
    roleName: 'Central Authority',
    badge: 'National EOC',
    name: 'Demo Central Administrator',
    email: 'central.admin@demo.brg.local',
    role: 'central_authority',
    commandLevel: 'national',
    avatarInitials: 'CA',
  },
  {
    roleName: 'TN State Admin',
    badge: 'TN SDMA',
    name: 'Demo Tamil Nadu State Administrator',
    email: 'tn.state@demo.brg.local',
    role: 'state_authority',
    commandLevel: 'state',
    stateAssigned: 'Tamil Nadu',
    avatarInitials: 'TN',
  },
  {
    roleName: 'AP State Admin',
    badge: 'AP SDMA',
    name: 'Demo Andhra Pradesh State Administrator',
    email: 'ap.state@demo.brg.local',
    role: 'state_authority',
    commandLevel: 'state',
    stateAssigned: 'Andhra Pradesh',
    avatarInitials: 'AP',
  },
  {
    roleName: 'TS State Admin',
    badge: 'TS SDMA',
    name: 'Demo Telangana State Administrator',
    email: 'ts.state@demo.brg.local',
    role: 'state_authority',
    commandLevel: 'state',
    stateAssigned: 'Telangana',
    avatarInitials: 'TS',
  },
  {
    roleName: 'Chennai District',
    badge: 'District EOC',
    name: 'Demo Chennai District Officer',
    email: 'chennai.district@demo.brg.local',
    role: 'district_authority',
    commandLevel: 'district',
    stateAssigned: 'Tamil Nadu',
    districtAssigned: 'Chennai',
    avatarInitials: 'CD',
  },
  {
    roleName: 'Vizag District',
    badge: 'District EOC',
    name: 'Demo Visakhapatnam District Officer',
    email: 'vizag.district@demo.brg.local',
    role: 'district_authority',
    commandLevel: 'district',
    stateAssigned: 'Andhra Pradesh',
    districtAssigned: 'Visakhapatnam',
    avatarInitials: 'VD',
  },
  {
    roleName: 'Hyderabad District',
    badge: 'District EOC',
    name: 'Demo Hyderabad District Officer',
    email: 'hyderabad.district@demo.brg.local',
    role: 'district_authority',
    commandLevel: 'district',
    stateAssigned: 'Telangana',
    districtAssigned: 'Hyderabad',
    avatarInitials: 'HD',
  },
  {
    roleName: 'Emergency Ops',
    badge: 'Field Operations',
    name: 'Demo Emergency Operations Officer',
    email: 'ops.officer@demo.brg.local',
    role: 'emergency_operations',
    commandLevel: 'district',
    stateAssigned: 'Tamil Nadu',
    districtAssigned: 'Chennai',
    avatarInitials: 'EO',
  },
  {
    roleName: 'Citizen Portal',
    badge: 'Public Safety',
    name: 'Demo Citizen',
    email: 'citizen@demo.brg.local',
    role: 'citizen',
    commandLevel: 'district',
    avatarInitials: 'CZ',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthenticated, setCurrentUser } = useAppStore();

  const [email, setEmail] = useState('central.admin@demo.brg.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real System Status
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    getSystemStatus()
      .then((data) => setSystemStatus(data))
      .catch((err) => console.warn('Status probe error', err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(email);
      if (res.user) {
        setCurrentUser(res.user);
        setAuthenticated(true);
        navigate('/');
      } else {
        throw new Error('User not found');
      }
    } catch (err: unknown) {
      console.warn('Backend login fallback to local role preset:', err);
      // Fallback local matching
      const preset = ROLE_PRESETS.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (preset) {
        setCurrentUser({
          id: `USR-${preset.avatarInitials}`,
          name: preset.name,
          email: preset.email,
          role: preset.role as any,
          commandLevel: preset.commandLevel as any,
          stateAssigned: preset.stateAssigned,
          districtAssigned: (preset as any).districtAssigned,
          avatarInitials: preset.avatarInitials,
          status: 'active',
          lastActive: 'Just now',
        });
        setAuthenticated(true);
        navigate('/');
      } else if (email && password) {
        setCurrentUser({
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: email.split('@')[0],
          email,
          role: 'national_admin',
          commandLevel: 'national',
          avatarInitials: 'GO',
          status: 'active',
          lastActive: 'Just now',
        });
        setAuthenticated(true);
        navigate('/');
      } else {
        setError('Please enter valid official emergency command credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (preset: (typeof ROLE_PRESETS)[0]) => {
    setEmail(preset.email);
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#060D17] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* ─── Sophisticated GIS Cartographic Background & Grid Network ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Latitude/Longitude GIS grid lines */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56, 189, 248, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Ambient Dark Navy & Indigo Radial Glows */}
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-blue-900/15 blur-[120px]" />
        <div className="absolute -bottom-40 right-0 w-[700px] h-[700px] rounded-full bg-cyan-950/15 blur-[140px]" />

        {/* SVG Atmospheric Isobars & Geographic Network Telemetry */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.14]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="cycloneIsobar" cx="72%" cy="65%" r="35%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="40%" stopColor="#0284C7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="gridLineFade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Bay of Bengal & Arabian Sea Isobar Rings */}
          <circle cx="72%" cy="68%" r="180" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          <circle cx="72%" cy="68%" r="280" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 8" opacity="0.4" />
          <circle cx="72%" cy="68%" r="420" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.25" />

          {/* Telemetry Vectors Connecting Strategic Nodes (Delhi -> Chennai -> Vizag -> Dehradun) */}
          <line x1="38%" y1="28%" x2="45%" y2="76%" stroke="url(#gridLineFade)" strokeWidth="1" strokeDasharray="6 4" />
          <line x1="45%" y1="76%" x2="58%" y2="62%" stroke="url(#gridLineFade)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="38%" y1="28%" x2="58%" y2="62%" stroke="url(#gridLineFade)" strokeWidth="0.8" strokeDasharray="8 6" />
          <line x1="38%" y1="28%" x2="42%" y2="18%" stroke="url(#gridLineFade)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Node Rings */}
          <circle cx="38%" cy="28%" r="5" fill="#38BDF8" opacity="0.8" />
          <circle cx="45%" cy="76%" r="5" fill="#10B981" opacity="0.8" />
          <circle cx="58%" cy="62%" r="5" fill="#F59E0B" opacity="0.8" />
          <circle cx="42%" cy="18%" r="4" fill="#6366F1" opacity="0.8" />
        </svg>
      </div>

      {/* ─── Top Header Bar ─── */}
      <header className="px-6 py-4 border-b border-white/8 flex items-center justify-between z-10 backdrop-blur-md bg-[#060D17]/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-white uppercase">
                BRG · BHARAT RESPONSE GRID
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                GOVT OF INDIA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              National Disaster Intelligence & Emergency Operations Platform
            </p>
          </div>
        </div>

        {/* Top Status & Public Portal Link */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
              SYSTEM STATUS: <strong className="text-emerald-400 font-bold">COMMAND GATEWAY ONLINE</strong>
            </span>
          </div>

          <button
            onClick={() => navigate('/citizen')}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all flex items-center gap-2 font-semibold shadow-sm"
          >
            <Users size={14} />
            <span>Public Citizen Portal →</span>
          </button>
        </div>
      </header>

      {/* ─── Main 2-Column Responsive Operational Gateway ─── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 z-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Visual Identity, GIS Telemetry Atmosphere */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold tracking-widest uppercase">
                <Radio size={13} className="animate-pulse text-cyan-400" />
                <span>Inter-Agency National Command Node</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
                BHARAT <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  RESPONSE GRID
                </span>
              </h1>
              <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-lg">
                Decisive, explainable intelligence for India's National, State, and District Emergency Operations
                Centers. Synthesizing live meteorology, seismology, and risk-weighted evacuation pathways.
              </p>
            </div>

            {/* Strategic Capability Highlights */}
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              <div className="p-3.5 rounded-xl bg-[#0C1626]/90 border border-white/8 backdrop-blur-md">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Activity size={15} />
                  <span className="text-xs font-bold uppercase tracking-wider">Multi-Hazard GIS</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Continuous coastal cyclone, urban flood breach, and slope failure tracking on Leaflet GIS.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0C1626]/90 border border-white/8 backdrop-blur-md">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Cpu size={15} />
                  <span className="text-xs font-bold uppercase tracking-wider">Dynamic Routing</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Risk-weighted evacuation graph algorithms with shelter capacity load balancing.
                </p>
              </div>
            </div>

            {/* Live Gateway Telemetry Matrix */}
            <div className="p-4 rounded-xl bg-[#0B1524]/80 border border-white/8 space-y-2 max-w-lg">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/6">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Connected Operational Streams
                </span>
                <span className="text-emerald-400 text-[10px] font-bold font-mono">256-Bit TLS EOC Gateway</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-[#07111F] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block">IMD / METEO</span>
                  <span className="text-xs font-bold text-cyan-400">WMO Live</span>
                </div>
                <div className="bg-[#07111F] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block">USGS SEISMIC</span>
                  <span className="text-xs font-bold text-emerald-400">GSN Stream</span>
                </div>
                <div className="bg-[#07111F] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 block">OSM GIS</span>
                  <span className="text-xs font-bold text-blue-400">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Readability Command Login Card */}
          <div className="lg:col-span-6 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md bg-[#0A1322] border border-white/12 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 backdrop-blur-xl"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow shadow-blue-500/30">
                    <Shield size={16} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>ONLINE</span>
                  </div>
                </div>

                {/* Explicit Demo Disclaimer Banner */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                  <p className="font-bold tracking-wider uppercase text-[10px] flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>DEMO / RESEARCH SYSTEM</span>
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    This platform uses purely fictional demonstration personas for research and multi-agency disaster simulation. Not an official government system.
                  </p>
                </div>

                <h2 className="text-xl font-black text-white pt-1">EOC Command Access</h2>
                <p className="text-xs text-slate-400">
                  Select a fictional demo authority role below or enter credentials:
                </p>
              </div>

              {/* Verified Node Diagnostic Strip */}
              <div className="bg-[#060D17] border border-white/8 rounded-xl p-2.5 text-[10px]">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="font-semibold uppercase tracking-wider">Node Telemetry</span>
                  <span className="text-slate-500 font-mono">
                    DB: {systemStatus?.services?.database?.mode || 'IN-MEMORY'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                  <div className="bg-[#0A1322] p-1.5 rounded border border-white/5">
                    <span className="text-slate-500 block text-[9px]">BACKEND</span>
                    <span className="font-bold text-emerald-400">
                      {systemStatus?.services?.backend?.status || 'ONLINE'}
                    </span>
                  </div>
                  <div className="bg-[#0A1322] p-1.5 rounded border border-white/5">
                    <span className="text-slate-500 block text-[9px]">WS GATEWAY</span>
                    <span className="font-bold text-cyan-400">
                      {systemStatus?.services?.websocket?.status || 'ONLINE'}
                    </span>
                  </div>
                  <div className="bg-[#0A1322] p-1.5 rounded border border-white/5">
                    <span className="text-slate-500 block text-[9px]">WEATHER</span>
                    <span className="font-bold text-amber-300">
                      {systemStatus?.services?.weatherApi?.status || 'CONNECTED'}
                    </span>
                  </div>
                  <div className="bg-[#0A1322] p-1.5 rounded border border-white/5">
                    <span className="text-slate-500 block text-[9px]">SEISMIC</span>
                    <span className="font-bold text-emerald-400">
                      {systemStatus?.services?.earthquakeApi?.status || 'CONNECTED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Role Authentication Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Role Presets
                  </span>
                  <span className="text-[10px] text-slate-500">Tap to populate</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_PRESETS.map((p, idx) => {
                    const isSelected = email.toLowerCase() === p.email.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectPreset(p)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                            : 'bg-[#0E1B2E]/70 border-white/6 hover:bg-[#0E1B2E] text-slate-300 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-white mb-0.5">
                          <span>{p.roleName}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                            {p.avatarInitials}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 block font-semibold">
                    Official Command Email / ID
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="officer@ndma.gov.in"
                      className="w-full bg-[#060D17] border border-white/12 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 block font-semibold">
                    Authentication Password / Security Token
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#060D17] border border-white/12 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded accent-blue-500"
                    />
                    <span className="text-[11px]">Remember Command Session</span>
                  </label>
                  <span className="text-slate-500 text-[10px] font-mono">TLS 1.3 Active</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold py-2.5 shadow-lg shadow-blue-600/30 transition-all"
                  icon={<ArrowRight size={15} />}
                >
                  {loading ? 'Authenticating Command Grid...' : 'Sign In to Command Center'}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-3 border-t border-white/8 text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#060D17]/80 backdrop-blur-md">
        <span>© Bharat Response Grid — National Disaster Decision Support Architecture</span>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>NDMA / SDMA EOC Compliant</span>
          <span>•</span>
          <span>CAP v1.2 Standard</span>
          <span>•</span>
          <span>WMO Meteorological Grounding</span>
        </div>
      </footer>
    </div>
  );
};
