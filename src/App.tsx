import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
const CommandOverviewPage = React.lazy(() => import('./pages/CommandOverviewPage').then((module) => ({ default: module.CommandOverviewPage })));
const IncidentManagementPage = React.lazy(() => import('./pages/IncidentManagementPage').then((module) => ({ default: module.IncidentManagementPage })));
const EmergencyOperationsPage = React.lazy(() => import('./pages/EmergencyOperationsPage').then((module) => ({ default: module.EmergencyOperationsPage })));
const MapsTrackingPage = React.lazy(() => import('./pages/MapsTrackingPage').then((module) => ({ default: module.MapsTrackingPage })));
const WeatherIntelligencePage = React.lazy(() => import('./pages/WeatherIntelligencePage').then((module) => ({ default: module.WeatherIntelligencePage })));
const ThreatSimulationPage = React.lazy(() => import('./pages/ThreatSimulationPage').then((module) => ({ default: module.ThreatSimulationPage })));
const DecisionSupportPage = React.lazy(() => import('./pages/DecisionSupportPage').then((module) => ({ default: module.DecisionSupportPage })));
const EarthquakeIntelligencePage = React.lazy(() => import('./pages/EarthquakeIntelligencePage').then((module) => ({ default: module.EarthquakeIntelligencePage })));
const ResearchEvaluationPage = React.lazy(() => import('./pages/ResearchEvaluationPage').then((module) => ({ default: module.ResearchEvaluationPage })));
const SystemStatusPage = React.lazy(() => import('./pages/SystemStatusPage').then((module) => ({ default: module.SystemStatusPage })));
const ResourceManagementPage = React.lazy(() => import('./pages/ResourceManagementPage').then((module) => ({ default: module.ResourceManagementPage })));
const CommunicationsPage = React.lazy(() => import('./pages/CommunicationsPage').then((module) => ({ default: module.CommunicationsPage })));
const AnalyticsCenterPage = React.lazy(() => import('./pages/AnalyticsCenterPage').then((module) => ({ default: module.AnalyticsCenterPage })));
const CitizenPortalPage = React.lazy(() => import('./pages/CitizenPortalPage').then((module) => ({ default: module.CitizenPortalPage })));
const UserManagementPage = React.lazy(() => import('./pages/UserManagementPage').then((module) => ({ default: module.UserManagementPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
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
          <div><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Command Level</p><p className="font-semibold text-slate-100 capitalize mt-1">{currentUser?.commandLevel}</p></div>
          <div><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status</p><p className="font-semibold text-emerald-400 capitalize mt-1">{currentUser?.status}</p></div>
          <div><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">State Assigned</p><p className="font-semibold text-slate-100 mt-1">{currentUser?.stateAssigned || '—'}</p></div>
          <div><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Last Active</p><p className="font-semibold text-slate-100 mt-1">{currentUser?.lastActive}</p></div>
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

const RouteLoadingFallback: React.FC = () => (
  <div className="grid min-h-[50vh] place-items-center text-sm text-slate-400" role="status" aria-live="polite">
    <span className="rounded-lg border border-white/10 bg-[#0D1828] px-4 py-2">Loading command page…</span>
  </div>
);

function App() {
  const { theme } = useAppStore();

  // Apply theme class on body
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <BrowserRouter>
      <React.Suspense fallback={<RouteLoadingFallback />}>
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
          <Route path="decision-support" element={<DecisionSupportPage />} />
          <Route path="risk-intelligence" element={<DecisionSupportPage />} />
          <Route path="incidents" element={<IncidentManagementPage />} />
          <Route path="operations" element={<EmergencyOperationsPage />} />
          <Route path="maps" element={<MapsTrackingPage />} />
          <Route path="evacuation" element={<MapsTrackingPage />} />
          <Route path="weather" element={<WeatherIntelligencePage />} />
          <Route path="earthquakes" element={<EarthquakeIntelligencePage />} />
          <Route path="simulation" element={<ThreatSimulationPage />} />
          <Route path="disaster-replay" element={<ThreatSimulationPage />} />
          <Route path="shelters" element={<ResourceManagementPage />} />
          <Route path="resources" element={<ResourceManagementPage />} />
          <Route path="teams" element={<EmergencyOperationsPage />} />
          <Route path="hospitals" element={<EmergencyOperationsPage />} />
          <Route path="alerts" element={<CommunicationsPage />} />
          <Route path="communications" element={<CommunicationsPage />} />
          <Route path="citizen-reports" element={<IncidentManagementPage />} />
          <Route path="analytics" element={<AnalyticsCenterPage />} />
          <Route path="research" element={<ResearchEvaluationPage />} />
          <Route path="system-status" element={<SystemStatusPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default App;
