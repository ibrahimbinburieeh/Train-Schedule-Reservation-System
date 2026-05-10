import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import StaffDashboard from "@/pages/staff-dashboard";
import Schedules from "@/pages/schedules";
import ScheduleHistory from "@/pages/schedule-history";
import Passengers from "@/pages/passengers";
import Reservations from "@/pages/reservations";
import Reports from "@/pages/reports";
import History from "@/pages/history";
import Users from "@/pages/users";

const queryClient = new QueryClient();

const ADMIN_ROLES = ["admin", "super_administrator"];

function getHomePath(role: string): string {
  if (role === "staff") return "/staff";
  return "/admin";
}

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) setLocation("/");
    else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role))
      setLocation(getHomePath(user.role));
  }, [user, isLoading, setLocation, allowedRoles]);

  if (isLoading) return <div style={{ padding: "2rem", color: "#2C3947" }}>Loading...</div>;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  return <Layout><Component /></Layout>;
}

function Router() {
  const { user } = useAuth();

  const adminDash = <ProtectedRoute component={AdminDashboard} allowedRoles={ADMIN_ROLES} />;
  const staffDash = <ProtectedRoute component={StaffDashboard} allowedRoles={["staff"]} />;

  function rootRedirect() {
    if (!user) return <Login />;
    return user.role === "staff" ? staffDash : adminDash;
  }

  return (
    <Switch>
      <Route path="/">{rootRedirect()}</Route>

      <Route path="/admin">{adminDash}</Route>
      <Route path="/schedules"><ProtectedRoute component={Schedules} allowedRoles={ADMIN_ROLES} /></Route>
      <Route path="/schedule-history"><ProtectedRoute component={ScheduleHistory} allowedRoles={ADMIN_ROLES} /></Route>
      <Route path="/reports"><ProtectedRoute component={Reports} allowedRoles={ADMIN_ROLES} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} allowedRoles={ADMIN_ROLES} /></Route>

      <Route path="/staff">{staffDash}</Route>
      <Route path="/passengers"><ProtectedRoute component={Passengers} allowedRoles={["staff"]} /></Route>
      <Route path="/reservations"><ProtectedRoute component={Reservations} allowedRoles={["staff"]} /></Route>
      <Route path="/history"><ProtectedRoute component={History} allowedRoles={["staff"]} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
