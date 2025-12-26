
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StudentManager } from './components/crm/StudentManager';
import { AiTools } from './components/ai/AiTools';
import { Operations } from './components/ops/Operations';
import { Partners } from './components/partners/Partners';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { TestPrepHub } from './components/testprep/TestPrepHub';
import { Settings } from './components/settings/Settings';
import { ActivityLogs } from './components/activity/ActivityLogs';
import { LoginPage } from './components/auth/LoginPage';
import { PublicLeadForm } from './components/leads/PublicLeadForm';
import { StudentPortal } from './components/portal/StudentPortal';
import { ActivationGate } from './components/auth/ActivationGate';
import { getCurrentUser, initAuthListener } from './services/authService';
import { User } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      
      if (params.get('mode') === 'public-form') {
          setActiveTab('public-form');
          setLoading(false);
          return;
      }

      if (params.get('mode') === 'onboarding') {
          setUser(null);
          setLoading(false);
          return;
      }

      const unsubscribe = initAuthListener((fetchedUser) => {
          setUser(fetchedUser);
          setLoading(false);
      });

      return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Operations onTabChange={setActiveTab} />;
      case 'students':
        return <StudentManager />;
      case 'ai-tools':
        return <AiTools />;
      case 'partners':
        return <Partners />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'test-prep':
        return <TestPrepHub />;
      case 'activity':
        return <ActivityLogs />;
      case 'settings':
        return <Settings onOpenPublicForm={() => setActiveTab('public-form')} />;
      case 'public-form':
        return <PublicLeadForm onClose={user ? () => setActiveTab('settings') : undefined} />;
      default:
        return <Operations onTabChange={setActiveTab} />;
    }
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  // Auth Guard
  if (activeTab === 'public-form') return renderContent();
  if (!user) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  
  // Student Portal Guard
  if (user.role === 'Student') return <StudentPortal studentId={user.id} />;

  // Manual Payment Verification Gate
  if (user.paymentStatus !== 'paid') {
      return <ActivationGate status={user.paymentStatus as any || 'pending'} agencyName={user.name} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="ml-64 flex-1 p-0 h-screen overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}
