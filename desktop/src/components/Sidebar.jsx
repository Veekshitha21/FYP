import React from 'react';
import {
  LayoutDashboard,
  Eye,
  Sliders,
  Mic,
  Keyboard,
  Sparkles,
  Settings,
  HelpCircle,
  Camera,
  Activity,
  ShieldAlert,
  Power
} from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';

export const Sidebar = () => {
  const { currentPage, setCurrentPage, systemStatus, triggerEmergencyStop, resumeEmergencyStop } = useMotionEase();

  const navigationGroups = [
    {
      category: 'CONTROL',
      items: [
        { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
        { id: 'studio', label: 'Live Control Studio', icon: Activity },
      ]
    },
    {
      category: 'CALIBRATION',
      items: [
        { id: 'calibration', label: 'Eye Calibration', icon: Eye },
        { id: 'gestures', label: 'Gesture Settings', icon: Sliders },
      ]
    },
    {
      category: 'INPUT MODALITIES',
      items: [
        { id: 'voice', label: 'Voice Control', icon: Mic },
        { id: 'keyboard', label: 'Virtual Keyboard', icon: Keyboard },
        { id: 'slm', label: 'AI Predictive Text', icon: Sparkles },
      ]
    },
    {
      category: 'PREFERENCES',
      items: [
        { id: 'setup', label: 'Device Setup', icon: Camera },
        { id: 'settings', label: 'Accessibility', icon: Settings },
        { id: 'tutorial', label: 'Tutorial & Guide', icon: HelpCircle },
      ]
    }
  ];

  return (
    <aside className="w-[250px] min-w-[250px] h-screen bg-bg-secondary border-r border-border-color flex flex-col justify-between select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="h-[72px] px-6 flex items-center gap-3 border-b border-border-color/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-txt-primary tracking-tight font-display">MotionEase</h1>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">AI Hands-Free</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-3.5 space-y-5 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navigationGroups.map((group) => (
            <div key={group.category} className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-txt-muted uppercase tracking-wider">
                {group.category}
              </span>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-accent-primary/15 text-cyan-300 font-semibold border border-accent-primary/30 shadow-sm'
                          : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-hover'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-accent-secondary' : 'text-txt-muted'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Stop Safety Footer */}
      <div className="p-3.5 border-t border-border-color/60 bg-surface-primary/40">
        {systemStatus.emergency_stop ? (
          <button
            onClick={resumeEmergencyStop}
            className="w-full h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all"
          >
            <Power className="w-4 h-4" />
            Resume Control
          </button>
        ) : (
          <button
            onClick={triggerEmergencyStop}
            className="w-full h-11 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-red-500/25 transition-all active:scale-98"
            title="Emergency Pause: Instantly locks all computer control actions"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            Emergency Stop
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
