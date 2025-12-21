
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, GraduationCap, BrainCircuit, Users, BookOpen, PieChart, Activity, Loader2, LogOut, Menu, X, Magnet } from 'lucide-react';
import { fetchSettings } from '../services/storageService';
import { getCurrentUser, logout } from '../services/authService';
import { AgencySettings, User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Mobile menu state

  useEffect(() => {
    const load = async () => {
        try {
            const s = await fetchSettings();
            setSettings(s);
            setUser(getCurrentUser());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [activeTab]);

  // Listen for mobile menu toggle events
  useEffect(() => {
      const handleToggle = () => setIsOpen(prev => !prev);
      window.addEventListener('toggle-sidebar', handleToggle);
      return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const plan = settings?.subscription?.plan || 'Free';
  const isFree = plan === 'Free';
  const userRole = user?.role || 'Viewer';
  
  const menuItems = [
    { id: 'dashboard', label: 'Operations', icon: LayoutDashboard, roles: ['Owner', 'Counsellor', 'Viewer'] },
    { id: 'students', label: 'Students (CRM)', icon: GraduationCap, roles: ['Owner', 'Counsellor', 'Viewer'] },
    { id: 'ai-tools', label: 'AI Tools Suite', icon: BrainCircuit, locked: isFree, roles: ['Owner', 'Counsellor'] },
    { id: 'test-prep', label: 'Test Prep Hub', icon: BookOpen, roles: ['Owner', 'Counsellor', 'Viewer'] },
    { id: 'partners', label: 'Partners', icon: Users, roles: ['Owner', 'Counsellor'] },
    { id: 'analytics', label: 'Executive Dashboard', icon: PieChart, roles: ['Owner'] },
    { id: 'activity', label: 'Audit Trail', icon: Activity, roles: ['Owner'] },
  ];

  if (loading) {
      return (
        <div className="md:w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 hidden md:flex items-center justify-center shadow-2xl z-50">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
        </div>
      );
  }

  // Mobile Overlay
  const Overlay = () => (
      isOpen ? (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          ></div>
      ) : null
  );

  return (
    <>
    <Overlay />
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Abroad Genius
            </h1>
            <div className="flex items-center mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    plan === 'Pro' ? 'bg-indigo-50 text-white' : 
                    plan === 'Enterprise' ? 'bg-purple-500 text-white' : 
                    'bg-slate-700 text-slate-300'
                }`}>
                    {plan}
                </span>
            </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
        </button>
      </div>
      
      {/* User Profile Snippet */}
      <div className="px-6 py-4 bg-slate-800/50 flex items-center space-x-3 border-b border-slate-800">
         <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
            {user?.name.charAt(0) || 'U'}
         </div>
         <div className="flex-1 min-w-0">
             <p className="text-sm font-bold truncate">{user?.name}</p>
             <p className="text-[10px] text-slate-400 uppercase">{user?.role}</p>
         </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isLocked = item.locked;
          if (!item.roles.includes(userRole)) return null;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                  if (isLocked) {
                      alert("Upgrade to Pro to access AI Tools!");
                      return;
                  }
                  setActiveTab(item.id);
                  setIsOpen(false); // Close on mobile select
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
              {isLocked && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">LOCKED</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button 
            onClick={() => { setActiveTab('settings'); setIsOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="font-medium text-sm">Settings</span>
        </button>

        <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/10 transition-all"
        >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sign Out</span>
        </button>
        
        <div className="mt-4 text-center border-t border-slate-800 pt-3">
            <span className="text-[10px] text-slate-600 font-mono block">v3.0-I3-STABLE</span>
            <span className="text-[8px] text-slate-700 block mt-1">© 2025 GTSDevs. Property of SMM84.</span>
        </div>
    </div>
    </div>
    </>
  );
};
