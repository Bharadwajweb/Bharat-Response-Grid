import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { ConnectionBanner } from '../ui/Overlay';
import { useAppStore } from '../../store/appStore';

export const AppShell: React.FC = () => {
  const { connectionStatus, connectionBannerVisible, setConnectionStatus } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden bg-[#07111F]">
      {/* Connection banner */}
      <ConnectionBanner
        status={connectionStatus}
        visible={connectionBannerVisible}
        onDismiss={() => setConnectionStatus('connected')}
      />

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar drawer */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
