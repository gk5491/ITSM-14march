import { useAuth } from '../contexts/AuthContext';
import { useCompanyBranding } from '../contexts/CompanyBrandingContext';
import { LogOut, User, Home, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface HeaderProps {
  currentRole: string;
  userName: string;
  onProfileClick?: () => void;
}

export default function Header({ currentRole, userName, onProfileClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { branding } = useCompanyBranding();

  function handleSignOut() {
    signOut();
  }

  const normalizedRole = currentRole.toLowerCase().trim();
  console.log('Rendering menu for role:', normalizedRole);

  const roleConfig: Record<string, { gradient: string; badge: string; label: string }> = {
    admin:    { gradient: 'from-red-600 to-rose-600',     badge: 'bg-red-100 text-red-700 border-red-200',       label: 'Administrator' },
    engineer: { gradient: 'from-blue-600 to-indigo-600',  badge: 'bg-blue-100 text-blue-700 border-blue-200',   label: 'Field Engineer' },
    hr:       { gradient: 'from-emerald-600 to-teal-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'HR Manager' },
    client:   { gradient: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Client' },
  };

  const config = roleConfig[normalizedRole] || roleConfig.engineer;

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${config.gradient}`}
                style={branding ? {
                  background: `linear-gradient(to bottom right, ${branding.primary_color}, ${branding.secondary_color})`,
                } : undefined}
              >
                <span className="text-sm font-black">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 leading-none text-sm">{userName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.badge}`}>
                    {config.label}
                  </span>
                  {user?.portalRole && user.portalRole.toLowerCase() !== normalizedRole && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">ITSM: {user.portalRole}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 px-3.5 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200/80 text-xs font-semibold group"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Main Portal</span>
              <ChevronRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
            </button>
            {onProfileClick && (
              <button
                onClick={onProfileClick}
                className="flex items-center gap-2 px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-xs font-semibold"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Profile</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3.5 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-xs font-semibold group"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:text-red-500 transition-colors" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
