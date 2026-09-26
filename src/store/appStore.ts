import { create } from 'zustand';
import type { User, ThemeMode, Language, ConnectionStatus, CommandLevel, JurisdictionScope } from '../types';
import { JURISDICTION_PRESETS } from '../data/mockData';
import { brgSocket } from '../utils/socket';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;

  // Theme
  theme: ThemeMode;

  // Language
  language: Language;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;

  // Connection
  connectionStatus: ConnectionStatus;
  connectionBannerVisible: boolean;
  webSocketStatus: 'LIVE' | 'CONNECTION DEGRADED' | 'OFFLINE';

  // Command room context & Jurisdiction
  activeCommandLevel: CommandLevel;
  activeCommandLabel: string;
  activeJurisdiction: JurisdictionScope;

  // Debug panel
  debugPanelVisible: boolean;

  // Notification count
  notificationCount: number;

  // Online responders count
  onlineResponders: number;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (v: boolean) => void;
  setJurisdiction: (j: JurisdictionScope) => void;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (l: Language) => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setSidebarMobileOpen: (v: boolean) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  setDebugPanelVisible: (v: boolean) => void;
  setNotificationCount: (n: number) => void;
  logout: () => void;
}

const defaultJurisdiction = JURISDICTION_PRESETS[0];

export const useAppStore = create<AppState>((set, get) => {
  // Bind real socket connection listener once
  if (typeof window !== 'undefined') {
    brgSocket.on('connection:status', (data: { status: string }) => {
      const isLive = data.status === 'connected';
      set({
        connectionStatus: isLive ? 'connected' : 'disconnected',
        webSocketStatus: isLive ? 'LIVE' : 'OFFLINE',
      });
    });
  }

  const initialSocketLive = brgSocket.connected;

  return {
    currentUser: {
      id: 'DEMO-CENTRAL',
      name: 'Demo Central Administrator',
      email: 'central.admin@demo.brg.local',
      role: 'central_authority',
      commandLevel: 'national',
      avatarInitials: 'CA',
      status: 'active',
      lastActive: 'now',
    },
    isAuthenticated: false,
    theme: 'dark',
    language: 'en',
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    connectionStatus: initialSocketLive ? 'connected' : 'connected',
    webSocketStatus: initialSocketLive ? 'LIVE' : 'CONNECTION DEGRADED',
    connectionBannerVisible: false,
    activeCommandLevel: 'national',
    activeCommandLabel: 'National Command',
    activeJurisdiction: defaultJurisdiction,
    debugPanelVisible: false,
    notificationCount: 3,
    onlineResponders: 48,

    setCurrentUser: (user) => {
      set({ currentUser: user });
      if (user) {
        // Automatically align jurisdiction with user's assignment
        if (user.districtAssigned) {
          const match = JURISDICTION_PRESETS.find(
            (p) => p.district?.toLowerCase() === user.districtAssigned?.toLowerCase()
          );
          if (match) set({ activeJurisdiction: match });
        } else if (user.stateAssigned) {
          const match = JURISDICTION_PRESETS.find(
            (p) => p.state?.toLowerCase() === user.stateAssigned?.toLowerCase() && p.level === 'state'
          );
          if (match) set({ activeJurisdiction: match });
        } else if (user.role === 'citizen') {
          const citizenScope = JURISDICTION_PRESETS.find((p) => p.level === 'citizen');
          if (citizenScope) set({ activeJurisdiction: citizenScope });
        } else if (user.role === 'emergency_operations' || user.role === 'responder') {
          const opsScope = JURISDICTION_PRESETS.find((p) => p.level === 'operational_area');
          if (opsScope) set({ activeJurisdiction: opsScope });
        } else {
          set({ activeJurisdiction: defaultJurisdiction });
        }
      }
    },
    setAuthenticated: (v) => set({ isAuthenticated: v }),
    setJurisdiction: (j) => {
      set({
        activeJurisdiction: j,
        activeCommandLabel: j.shortLabel,
        activeCommandLevel: j.level === 'central' ? 'national' : (j.level as any),
      });
    },
    setTheme: (t) => {
      set({ theme: t });
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    },
    toggleTheme: () => {
      const current = get().theme;
      get().setTheme(current === 'dark' ? 'light' : 'dark');
    },
    setLanguage: (l) => set({ language: l }),
    setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
    setConnectionStatus: (s) => {
      const wsStatus = s === 'connected' ? 'LIVE' : s === 'reconnecting' ? 'CONNECTION DEGRADED' : 'OFFLINE';
      set({ connectionStatus: s, webSocketStatus: wsStatus });
      if (s === 'disconnected' || s === 'reconnecting') {
        set({ connectionBannerVisible: true });
      } else {
        setTimeout(() => set({ connectionBannerVisible: false }), 3000);
      }
    },
    setDebugPanelVisible: (v) => set({ debugPanelVisible: v }),
    setNotificationCount: (n) => set({ notificationCount: n }),
    logout: () => set({ isAuthenticated: false, currentUser: null }),
  };
});
