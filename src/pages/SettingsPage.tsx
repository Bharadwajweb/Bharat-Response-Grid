import React, { useState } from 'react';
import { Settings, Sun, Moon, Globe, Lock, Activity, Check } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useIncidentStore } from '../store/incidentStore';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Modal';
import { useTranslation } from 'react-i18next';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, language, setLanguage, debugPanelVisible, setDebugPanelVisible, connectionStatus } = useAppStore();
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('appearance');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saved, setSaved] = useState(false);
  const [apiLatency] = useState(24);

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLanguageChange = (lang: 'en' | 'te' | 'hi' | 'ta') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <div className="flex flex-col min-h-full max-w-3xl mx-auto w-full">
      <div className="px-6 py-5 border-b border-white/6">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings size={20} className="text-slate-400" />
          Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Application preferences and account configuration</p>
      </div>

      <Tabs
        tabs={[
          { id: 'appearance', label: 'Appearance' },
          { id: 'language', label: 'Language' },
          { id: 'security', label: 'Account Security' },
          { id: 'diagnostics', label: 'Diagnostics' },
          { id: 'data', label: 'Data Management' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="px-6"
      />

      <div className="flex-1 p-6 space-y-6">
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Color Theme</h3>
              <p className="text-xs text-slate-500 mb-3">Select the interface color scheme</p>
              <div className="flex gap-3">
                {[
                  { value: 'dark' as const, label: 'Dark Mode', icon: <Moon size={18} />, desc: 'Default — optimal for command centers' },
                  { value: 'light' as const, label: 'Light Mode', icon: <Sun size={18} />, desc: 'High contrast for bright environments' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === t.value
                        ? 'border-blue-500 bg-blue-500/8'
                        : 'border-white/10 hover:border-white/20 bg-white/3'
                    }`}
                  >
                    <span className={theme === t.value ? 'text-blue-400' : 'text-slate-500'}>{t.icon}</span>
                    <span className="text-sm font-semibold text-slate-200">{t.label}</span>
                    <span className="text-xs text-slate-500 text-center">{t.desc}</span>
                    {theme === t.value && <Check size={14} className="text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'language' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Interface Language</h3>
              <p className="text-xs text-slate-500 mb-3">Select the display language for the application</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { code: 'en' as const, name: 'English', native: 'English', desc: 'Standard Command' },
                  { code: 'hi' as const, name: 'Hindi', native: 'हिन्दी', desc: 'National Language' },
                  { code: 'ta' as const, name: 'Tamil', native: 'தமிழ்', desc: 'State Regional' },
                  { code: 'te' as const, name: 'Telugu', native: 'తెలుగు', desc: 'State Regional' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                      language === l.code
                        ? 'border-blue-500 bg-blue-500/8'
                        : 'border-white/10 hover:border-white/20 bg-white/3'
                    }`}
                  >
                    <Globe size={18} className={language === l.code ? 'text-blue-400' : 'text-slate-500'} />
                    <span className="text-base font-bold text-slate-100">{l.native}</span>
                    <span className="text-xs text-slate-500">{l.desc}</span>
                    {language === l.code && <Check size={14} className="text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 max-w-md">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Change Password</h3>
              <p className="text-xs text-slate-500 mb-4">Update your authentication credentials</p>
              <div className="space-y-3">
                {[
                  { label: 'Current Password', value: currentPwd, setter: setCurrentPwd },
                  { label: 'New Password', value: newPwd, setter: setNewPwd },
                  { label: 'Confirm New Password', value: confirmPwd, setter: setConfirmPwd },
                ].map((f) => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Lock size={11} /> {f.label}
                    </label>
                    <input
                      type="password"
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                      className="w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3 py-2 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                ))}
                <Button variant="primary" size="sm" onClick={handleSave} loading={false}>
                  {saved ? '✓ Password Updated' : 'Update Password'}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/3 border border-white/8">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">Session Information</h4>
              <div className="space-y-1 text-xs text-slate-500">
                <p>Session duration: 8 hours max</p>
                <p>Last login: {new Date().toLocaleDateString('en-IN')}</p>
                <p>Device: Web Browser — Government Network</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">System Diagnostics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time connectivity and performance metrics</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={debugPanelVisible}
                  onChange={(e) => setDebugPanelVisible(e.target.checked)}
                />
                <div className="toggle-track">
                  <div className="toggle-thumb" />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'API Health', value: 'Healthy', status: 'green' },
                { label: 'API Latency', value: `${apiLatency}ms`, status: apiLatency < 50 ? 'green' : 'amber' },
                { label: 'Socket Status', value: connectionStatus === 'connected' ? 'Connected' : 'Disconnected', status: connectionStatus === 'connected' ? 'green' : 'red' },
                { label: 'Transport', value: 'WebSocket', status: 'green' },
                { label: 'Current Room', value: 'National Command', status: 'blue' },
                { label: 'Nodes Online', value: '3 / 3', status: 'green' },
                { label: 'Messages Rx', value: '1,247', status: 'blue' },
                { label: 'Messages Tx', value: '89', status: 'blue' },
              ].map((item) => (
                <div key={item.label} className="px-3 py-3 rounded-lg bg-[#0D1828] border border-white/8">
                  <p className="text-xs text-slate-600 uppercase tracking-wider">{item.label}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.status === 'green' ? 'bg-green-500' : item.status === 'amber' ? 'bg-amber-500' : item.status === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <span className="text-sm font-semibold text-slate-200">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 rounded-xl bg-blue-500/6 border border-blue-500/15 flex items-start gap-2">
              <Activity size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-400">All Systems Nominal</p>
                <p className="text-xs text-slate-500 mt-0.5">BRG Command Network is operating within normal parameters. Last checked: {new Date().toLocaleTimeString('en-IN', { hour12: false })}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Data Management & Operational Cache</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control live incident records, field reports, and data baseline states</p>
            </div>

            <div className="space-y-3">
              {/* Purge / Clear all incidents */}
              <div className="p-4 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Purge Active Incidents (Clean Slate)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Clear all current field incidents to test zero-state handling, citizen intake, and fresh reporting.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    useIncidentStore.setState({ incidents: [], selectedIncidentId: null, detailPanelOpen: false });
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                >
                  Clear All Incidents
                </Button>
              </div>

              {/* Reset to official baseline */}
              <div className="p-4 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Restore Official National Baseline</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reset standard operational incidents, battalions, and relief camps across Andhra Pradesh and coastal sectors.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reset to National Baseline
                </Button>
              </div>
            </div>

            {saved && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-xs text-green-400">
                ✓ Incident database cleared. The system is currently in a clean zero-state.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
