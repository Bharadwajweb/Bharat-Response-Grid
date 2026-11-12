import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { CommandOverviewPage } from './pages/CommandOverviewPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
import { EmergencyOperationsPage } from './pages/EmergencyOperationsPage';
import { MapsTrackingPage } from './pages/MapsTrackingPage';
import { WeatherIntelligencePage } from './pages/WeatherIntelligencePage';
import { ThreatSimulationPage } from './pages/ThreatSimulationPage';
import { ResourceManagementPage } from './pages/ResourceManagementPage';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { AnalyticsCenterPage } from './pages/AnalyticsCenterPage';
import { CitizenPortalPage } from './pages/CitizenPortalPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { DecisionSupportPage } from './pages/DecisionSupportPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { useAppStore } from './store/appStore';
import './i18n';

const ProfilePage: React.FC = () => {
  const { currentUser } = useAppStore();
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-bold text-slate-100">My Profile</h1>
      <div className="space-y-4 rounded-xl border border-white/8 bg-[#0D1828] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15 text-xl font-bold text-cyan-300">{currentUser?.avatarInitials || '—'}</div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{currentUser?.name || 'Unknown'}</h2>
            <p className="text-sm text-slate-500">{currentUser?.email}</p>
            <span className="mt-1 inline-block rounded border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold capitalize text-cyan-300">{currentUser?.role?.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs uppercase tracking-wider text-slate-600">Command Level</p><p className="mt-1 font-medium capitalize text-slate-200">{currentUser?.commandLevel}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-600">Account Status</p><p className="mt-1 font-medium capitalize text-slate-200">{currentUser?.status}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-600">State Scope</p><p className="mt-1 font-medium text-slate-200">{currentUser?.stateAssigned || '—'}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-600">Last Active</p><p className="mt-1 font-medium text-slate-200">{currentUser?.lastActive}</p></div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { theme } = useAppStore();
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/citizen" element={<CitizenPortalPage />} />
        <Route path="/" element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route index element={<CommandOverviewPage />} />
          <Route path="incidents" element={<IncidentManagementPage />} />
          <Route path="operations" element={<EmergencyOperationsPage />} />
          <Route path="maps" element={<MapsTrackingPage />} />
          <Route path="weather" element={<WeatherIntelligencePage />} />
          <Route path="simulation" element={<ThreatSimulationPage />} />
          <Route path="resources" element={<ResourceManagementPage />} />
          <Route path="communications" element={<CommunicationsPage />} />
          <Route path="analytics" element={<AnalyticsCenterPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="data-sources" element={<DataSourcesPage />} />
          <Route path="risk-analysis" element={<DecisionSupportPage />} />
          <Route path="evacuation" element={<DecisionSupportPage />} />
          <Route path="earthquake-intelligence" element={<MapsTrackingPage />} />
          <Route path="live-map" element={<MapsTrackingPage />} />
          <Route path="weather-intelligence" element={<WeatherIntelligencePage />} />
          <Route path="disaster-simulation" element={<ThreatSimulationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
