import { create } from 'zustand';
import type { User, ThemeMode, Language, ConnectionStatus, CommandLevel } from '../types';

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

  // Command room context
  activeCommandLevel: CommandLevel;
  activeCommandLabel: string;

  // Debug panel
  debugPanelVisible: boolean;

  // Notification count
  notificationCount: number;

  // Online responders count
  onlineResponders: number;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (v: boolean) => void;
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

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'USR-001',
    name: 'Adv. Priya Menon',
    email: 'priya.menon@ndma.gov.in',
    role: 'national_admin',
    commandLevel: 'national',
    avatarInitials: 'PM',
    status: 'active',
    lastActive: 'now',
  },
  isAuthenticated: false,
  theme: 'dark',
  language: 'en',
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  connectionStatus: 'connected',
  connectionBannerVisible: false,
  activeCommandLevel: 'national',
  activeCommandLabel: 'National Command',
  debugPanelVisible: false,
  notificationCount: 5,
  onlineResponders: 47,

  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthenticated: (v) => set({ isAuthenticated: v }),
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
    set({ connectionStatus: s });
    if (s === 'disconnected' || s === 'reconnecting') {
      set({ connectionBannerVisible: true });
    } else {
      // hide after delay
      setTimeout(() => set({ connectionBannerVisible: false }), 3000);
    }
  },
  setDebugPanelVisible: (v) => set({ debugPanelVisible: v }),
  setNotificationCount: (n) => set({ notificationCount: n }),
  logout: () => set({ isAuthenticated: false, currentUser: null }),
}));
