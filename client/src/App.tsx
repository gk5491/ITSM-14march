import { Switch, Route, Router, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { SessionWarningDialog } from "@/components/common/session-warning-dialog";
import { useState, useCallback } from "react";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import TicketsPage from "@/pages/tickets-page";
import TicketDetailPage from "@/pages/ticket-detail-page";
import TicketCreatePage from "@/pages/ticket-create-page";
import TicketEditPage from "@/pages/ticket-edit-page";
import KnowledgeBasePage from "@/pages/knowledge-base-page";
import AllTicketsPage from "@/pages/all-tickets-page";
import DocumentationPage from "@/pages/documentation-page";
import SettingsPage from "@/pages/settings-page";
import ReportsPage from "@/pages/admin/reports-page";
import UsersPage from "@/pages/admin/users-page";
import CategoriesPage from "@/pages/admin/categories-page";
import BugReportsPage from "@/pages/bug-reports-page";
import SiteEnggApp from "./site-engg/SiteEnggApp";


// Session timeout wrapper component
function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleWarning = useCallback(() => {
    console.log('[Session Timeout] Warning: 1 minute until auto-logout');
  }, []);

  const handleLogout = useCallback(() => {
    console.log('[Session Timeout] Auto-logout triggered - clearing session and redirecting');
    
    // Immediately clear all query cache
    queryClient.clear();
    
    // Attempt to call logout API (fire and forget - don't wait for it)
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        console.log('[Session Timeout] Logout API called, redirecting to login');
      },
      onError: (error) => {
        console.error('[Session Timeout] Logout API error (still redirecting):', error);
      },
    });
    
    // Force redirect immediately - don't wait for mutation
    // This ensures logout happens even if API call fails
    setTimeout(() => {
      setLocation('/auth');
    }, 100);
  }, [logoutMutation, setLocation]);

  const { isWarningShown, extendSession } = useSessionTimeout({
    onWarning: handleWarning,
    onLogout: handleLogout,
    isAuthenticated: !!user,
    warningTime: 60000, // 1 minute warning
    logoutTime: 600000, // 10 minutes timeout
  });

  const handleStayLoggedIn = useCallback(() => {
    console.log('[Session Timeout] User clicked Stay Logged In - extending session');
    extendSession();
  }, [extendSession]);

  return (
    <>
      {children}
      <SessionWarningDialog
        open={isWarningShown}
        onStayLoggedIn={handleStayLoggedIn}
      />
    </>
  );
}

function Routes() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/tickets" component={TicketsPage} />
      <ProtectedRoute path="/tickets/new" component={TicketCreatePage} requiredRole={["user", "admin", "agent"]} />
      <ProtectedRoute path="/tickets/:id/edit" component={TicketEditPage} />
      <ProtectedRoute path="/tickets/:id" component={TicketDetailPage} />
      <ProtectedRoute path="/knowledge-base" component={KnowledgeBasePage} />
      <ProtectedRoute path="/documentation" component={DocumentationPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute
        path="/all-tickets"
        component={AllTicketsPage}
        requiredRole={["admin"]}
      />
      <ProtectedRoute
        path="/admin/reports"
        component={ReportsPage}
        requiredRole={["admin"]}
      />
      <ProtectedRoute
        path="/bug-reports"
        component={BugReportsPage}
        requiredRole={["admin"]}
      />
      <ProtectedRoute
        path="/admin/users"
        component={UsersPage}
        requiredRole={["admin"]}
      />
      <ProtectedRoute
        path="/admin/categories"
        component={CategoriesPage}
        requiredRole={["admin"]}
      />
      <ProtectedRoute
        path="/site-engg"
        component={SiteEnggApp}
        requiredRole={["admin", "agent", "user"]}
      />

      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
 
function App() {
  // For production deployment in /itsm_app/ subdirectory
  // In development, BASE_URL is "/" so basePath will be empty
  // In production with base: "/itsm_app/", basePath will be "/itsm_app"
  const rawBase = import.meta.env.BASE_URL || '/';
  const basePath = rawBase === '/' ? '' : rawBase.replace(/\/$/, '');

  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionTimeoutProvider>
          <Router base={basePath}>
            <Routes />
            <Toaster />
          </Router>
        </SessionTimeoutProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
 
export default App;
 
 