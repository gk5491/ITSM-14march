import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getBasePath } from "@/lib/get-base-path";
import { cn } from "@/lib/utils";
import { hasRole, hasAnyRole } from "@/lib/role-utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Headset, 
  Home, 
  TicketCheck, 
  Book, 
  FileText,
  ListChecks, 
  Users, 
  Tags, 
  BarChart, 
  Bug,
  Settings, 
  Menu, 
  X,
  Building2
} from "lucide-react";


interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isMobile = false, isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const basePath = getBasePath();
  const [showLogoFallback, setShowLogoFallback] = useState(false);
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close sidebar on location change in mobile view
  useEffect(() => {
    if (isMobile && isOpen && onClose) {
      onClose();
    }
    // Store current route as referrer when navigating to ticket details
    if (location.startsWith('/tickets/') && !location.startsWith('/tickets/new')) {
      const currentPath = location.split('/tickets/')[0] || '/tickets';
      sessionStorage.setItem('ticketReferrer', currentPath);
    }
  }, [location, isMobile, isOpen, onClose]);

  // Check if route is active
  const isRouteActive = (route: string) => {
    // Special handling for ticket routes to preserve parent section
    if (location.startsWith('/tickets/') && !location.startsWith('/tickets/new')) {
      // For ticket details, check if we came from all-tickets
      const referrer = sessionStorage.getItem('ticketReferrer');
      if (referrer === '/all-tickets' && route === '/all-tickets') {
        return true;
      }
      if (referrer !== '/all-tickets' && route === '/tickets') {
        return true;
      }
      return false;
    }
    
    // Normal route checking
    if (route === "/") {
      return location === "/";
    }
    return location.startsWith(route);
  };

  return (
    <div
      className={cn(
        "bg-white h-full fixed inset-y-0 left-0 z-30 w-64 shadow-lg flex flex-col",
        "md:relative md:translate-x-0",
        isMobile && "transform transition-transform duration-300 ease-in-out",
        isMobile && (isOpen ? "translate-x-0" : "-translate-x-full")
      )}
    >
      {/* Logo & Close Button */}
      <div className="px-4 py-4 bg-primary text-white">
        <Link href="/" className="flex items-center flex-col">
          {!showLogoFallback ? (
            <div className="bg-white rounded-md p-1 mb-2">
              <img
                src="/logo1.png"
                alt="Cybaem Tech Logo"
                className="h-10 w-auto block"
                onError={() => setShowLogoFallback(true)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-md p-1 mb-2 inline-block">
              <Headset size={28} />
            </div>
          )}
          <span className="font-semibold text-lg">IT Helpdesk</span>
        </Link>
        {isMobile && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-primary-foreground/10"
            >
              <X size={20} />
            </Button>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">{user?.name || "Guest"}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role || "Not logged in"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
          Main
        </div>
        <SidebarLink href="/" active={isRouteActive("/")} icon={<Home size={18} />} label="Dashboard" />
        <SidebarLink
          href="/tickets"
          active={isRouteActive("/tickets")}
          icon={<TicketCheck size={18} />}
          label="My Tickets"
        />
        {user?.role === "user" && (
          <SidebarLink
            href="/tickets/new"
            active={isRouteActive("/tickets/new")}
            icon={<TicketCheck size={18} />}
            label="Create Ticket"
          />
        )}
        <SidebarLink
          href="/knowledge-base"
          active={isRouteActive("/knowledge-base")}
          icon={<Book size={18} />}
          label="Knowledge Base"
        />
        <SidebarLink
          href="/documentation"
          active={isRouteActive("/documentation")}
          icon={<FileText size={18} />}
          label="Documentation"
        />
        <SidebarLink
          href="/site-engg"
          active={isRouteActive("/site-engg")}
          icon={<Building2 size={18} />}
          label="Site-Engg"
        />


        {/* All Tickets Section (Admin only) */}
        {hasRole(user?.role, "admin") && (
          <>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pb-1 pt-4">
              Support
            </div>
            <SidebarLink
              href="/all-tickets"
              active={isRouteActive("/all-tickets")}
              icon={<ListChecks size={18} />}
              label="All Tickets"
            />
            
          </>
        )}

        {/* Admin/Agent Section (Users tab) */}

        {hasAnyRole(user?.role, ["admin", "agent"]) && (
          <>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pb-1 pt-4">
              Administration
            </div>
            <SidebarLink
              href="/admin/users"
              active={isRouteActive("/admin/users")}
              icon={<Users size={18} />}
              label="Users"
            />
            {hasRole(user?.role, "admin") && (
              <>
                <SidebarLink
                  href="/admin/categories"
                  active={isRouteActive("/admin/categories")}
                  icon={<Tags size={18} />}
                  label="Categories"
                />
                <SidebarLink
                  href="/admin/reports"
                  active={isRouteActive("/admin/reports")}
                  icon={<BarChart size={18} />}
                  label="Reports"
                />
              </>
            )}
          </>
        )}

        {/* Bug Review visible to all roles */}
        {user && hasAnyRole(user?.role, ["admin", "agent", "user"]) && (
          <SidebarLink
            href="/bug-reports"
            active={isRouteActive("/bug-reports")}
            icon={<Bug size={18} />}
            label="Bug Review"
          />
        )}

        {/* Personal Section */}
        <>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pb-1 pt-4">
            Personal
          </div>
          <SidebarLink
            href="/settings"
            active={isRouteActive("/settings")}
            icon={<Settings size={18} />}
            label="Settings"
          />
        </>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

function SidebarLink({ href, label, icon, active }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors cursor-pointer",
          active
            ? "bg-primary text-white"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <span className="mr-2">{icon}</span>
        {label}
      </div>
    </Link>
  );
}
