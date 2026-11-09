import React from 'react';
import { MotionEaseProvider, useMotionEase } from './context/MotionEaseContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import NotificationToast from './components/NotificationToast';

// 11 Application Pages
import LandingPage from './pages/LandingPage';
import DeviceSetupPage from './pages/DeviceSetupPage';
import DashboardPage from './pages/DashboardPage';
import ControlStudioPage from './pages/ControlStudioPage';
import CalibrationPage from './pages/CalibrationPage';
import GestureSettingsPage from './pages/GestureSettingsPage';
import VoiceControlPage from './pages/VoiceControlPage';
import VirtualKeyboardPage from './pages/VirtualKeyboardPage';
import SLMConfigPage from './pages/SLMConfigPage';
import AccessibilitySettingsPage from './pages/AccessibilitySettingsPage';
import TutorialPage from './pages/TutorialPage';

const AppContent = () => {
  const { currentPage, toasts } = useMotionEase();

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'setup':
        return <DeviceSetupPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'studio':
        return <ControlStudioPage />;
      case 'calibration':
        return <CalibrationPage />;
      case 'gestures':
        return <GestureSettingsPage />;
      case 'voice':
        return <VoiceControlPage />;
      case 'keyboard':
        return <VirtualKeyboardPage />;
      case 'slm':
        return <SLMConfigPage />;
      case 'settings':
        return <AccessibilitySettingsPage />;
      case 'tutorial':
        return <TutorialPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary text-txt-primary">
      {/* Fixed Left Sidebar (250px) */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar (72px) */}
        <Topbar />

        {/* Scrollable Viewport (padding: 28px) */}
        <main className="flex-1 overflow-y-auto p-7 bg-bg-primary">
          {renderPage()}
        </main>
      </div>

      {/* Global Toast Alerts */}
      <NotificationToast toasts={toasts} />
    </div>
  );
};

export const App = () => {
  return (
    <MotionEaseProvider>
      <AppContent />
    </MotionEaseProvider>
  );
};

export default App;
