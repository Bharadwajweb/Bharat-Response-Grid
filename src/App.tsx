import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { useAppStore } from './store/appStore';
import './i18n';

// Profile page (simple)
const ProfilePage: React.FC = () => {
  const { currentUser } = useAppStore();
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-100 mb-6">My Profile</h1>
      <div className="bg-[#0D1828] border border-white/8 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl font-bold text-blue-400">
            {currentUser?.avatarInitials || '??'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{currentUser?.name || 'Unknown'}</h2>
            <p className="text-sm text-slate-500">{currentUser?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25 capitalize">
              {currentUser?.role?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-slate-600 uppercase tracking-wider">Command Level</p><p className="font-medium text-slate-200 capitalize mt-1">{currentUser?.commandLevel}</p></div>
          <div><p className="text-xs text-slate-600 uppercase tracking-wider">Status</p><p className="font-medium text-green-400 capitalize mt-1">{currentUser?.status}</p></div>
          <div><p className="text-xs text-slate-600 uppercase tracking-wider">State</p><p className="font-medium text-slate-200 mt-1">{currentUser?.stateAssigned || '—'}</p></div>
          <div><p className="text-xs text-slate-600 uppercase tracking-wider">Last Active</p><p className="font-medium text-slate-200 mt-1">{currentUser?.lastActive}</p></div>
        </div>
      </div>
    </div>
  );
};

// Auth Guard
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const { theme } = useAppStore();

  // Apply theme class on body
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/citizen" element={<CitizenPortalPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
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
          <Route path="risk-analysis" element={<DecisionSupportPage />} />
          <Route path="evacuation" element={<DecisionSupportPage />} />
          <Route path="earthquake-intelligence" element={<MapsTrackingPage />} />
          <Route path="live-map" element={<MapsTrackingPage />} />
          <Route path="weather-intelligence" element={<WeatherIntelligencePage />} />
          <Route path="disaster-simulation" element={<ThreatSimulationPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
