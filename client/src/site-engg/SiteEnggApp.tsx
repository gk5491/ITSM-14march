import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyBrandingProvider } from './contexts/CompanyBrandingContext';
import Header from './components/Header';
import ProfileEditor from './components/ProfileEditor';
import { Monitor, Smartphone } from 'lucide-react';
import EngineerDashboard from './components/dashboards/EngineerDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HRDashboard from './components/dashboards/HRDashboard';
import ClientDashboard from './components/dashboards/ClientDashboard';
import MobileEngineerDashboard from './components/mobile/MobileEngineerDashboard';
import MobileHRDashboard from './components/mobile/MobileHRDashboard';
import MobileAdminDashboard from './components/mobile/MobileAdminDashboard';
import MobileClientDashboard from './components/mobile/MobileClientDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');
  const [multiRoleViewMode, setMultiRoleViewMode] = useState<'admin' | 'hr' | 'engineer'>('admin');
  const [showProfile, setShowProfile] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center text-red-600">Please log in through the main portal.</div>;
  }

  const roleStr = Array.isArray(user.role) ? user.role.join(',') : String(user.role || '');
  const normalizedRole = roleStr.toLowerCase();

  const isRohanOrShivam = user.email.toLowerCase() === 'rohan@cybaemtech.com' || user.email.toLowerCase() === 'shivam.jagtap@cybaemtech.com';

  // For privileged users with multiple roles, override their effective role based on their custom toggle
  const effectiveRole = (isRohanOrShivam ? multiRoleViewMode : normalizedRole) || '';

  // Unified routing variables
  const isHR = effectiveRole.includes('hr');
  const isAdmin = effectiveRole.includes('admin');
  const isClient = effectiveRole.includes('client');
  const isEngineer = effectiveRole.includes('engineer');
  const isPrivileged = isHR || isAdmin;

  const renderDashboard = () => {
    // If mobile view is active
    if (viewMode === 'mobile') {
        if (isAdmin)      return <MobileAdminDashboard />;
        if (isEngineer)   return <MobileEngineerDashboard />;
        if (isHR)         return <MobileHRDashboard />;
        if (isClient)     return <MobileClientDashboard />;
    }

    // Default Web Dashboards (Source of Truth)
    if (isAdmin) return <AdminDashboard />;
    if (isEngineer) return <EngineerDashboard />;
    if (isHR) return <HRDashboard />;
    if (isClient) return <ClientDashboard />;
    
    // Default fallback
    return <EngineerDashboard />;
  };

  return (
    <div className="min-h-screen relative">
      <Header
        currentRole={user.role}
        userName={user.name || 'User'}
        onProfileClick={() => setShowProfile(true)}
      />

      {/* View toggle: visible for engineers, admins, and HR */}
      {(isEngineer || isPrivileged || isClient) && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-full shadow-lg border border-slate-200 p-2 flex gap-2">
            <button
              onClick={() => setViewMode('web')}
              className={`p-3 rounded-full transition-all ${
                viewMode === 'web'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Web View"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-3 rounded-full transition-all ${
                viewMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>
          {isRohanOrShivam && (
            <div className="bg-white mt-3 rounded-full shadow-lg border border-slate-200 p-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setMultiRoleViewMode('admin')}
                  className={`flex-1 py-1.5 px-3 rounded-full text-[10px] font-black uppercase transition-all ${
                    multiRoleViewMode === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setMultiRoleViewMode('hr')}
                  className={`flex-1 py-1.5 px-3 rounded-full text-[10px] font-black uppercase transition-all ${
                    multiRoleViewMode === 'hr' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  HR
                </button>
              </div>
              <button
                onClick={() => setMultiRoleViewMode('engineer')}
                className={`w-full py-1.5 px-3 rounded-full text-[10px] font-black uppercase transition-all ${
                  multiRoleViewMode === 'engineer' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Engineer
              </button>
            </div>
          )}
        </div>
      )}

      <main className="min-h-[calc(100vh-4rem)]">
        {showProfile ? (
          <div className="p-6">
            <ProfileEditor onClose={() => setShowProfile(false)} />
          </div>
        ) : (
          renderDashboard()
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyBrandingProvider>
        <AppContent />
      </CompanyBrandingProvider>
    </AuthProvider>
  );
}

export default App;
