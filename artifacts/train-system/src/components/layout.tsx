import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { TrainLogo } from "@/components/train-logo";

const NAV_BASE: React.CSSProperties = {
  display: "block", padding: "0.5rem 0.9rem", borderRadius: "4px",
  color: "#c0d0dc", textDecoration: "none", fontSize: "0.88rem", marginBottom: "2px",
};
const NAV_ACTIVE: React.CSSProperties = {
  ...NAV_BASE, background: "#547A95", color: "#fff", fontWeight: "600",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <Link href={href} style={location === href ? NAV_ACTIVE : NAV_BASE}>{children}</Link>
  );
}

function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.68rem", color: "#7a95a8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", marginTop: "1rem", marginBottom: "0.4rem", paddingLeft: "0.9rem" }}>
      {children}
    </div>
  );
}

function roleLabel(role: string): string {
  if (role === "super_administrator") return "Super Admin";
  if (role === "admin") return "Admin";
  return "Staff";
}

function roleBadgeColor(role: string): string {
  if (role === "super_administrator") return "#b45309";
  if (role === "admin") return "#547A95";
  return "#3a5a6e";
}

const isAdminRole = (role: string) => role === "admin" || role === "super_administrator";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch { }
    logout();
  };

  if (!user) return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#E8EDF2" }}>
      <header style={{ background: "#2C3947", color: "#fff", padding: "0.7rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid #547A95" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <TrainLogo size={32} />
          <div style={{ fontWeight: "bold", fontSize: "0.98rem" }}>Train Schedule &amp; Reservation System</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "0.84rem", color: "#b8ccdc" }}>
            <span style={{ color: "#fff", fontWeight: "600" }}>{user.name}</span>
            <span style={{
              marginLeft: "0.5rem",
              background: roleBadgeColor(user.role),
              borderRadius: "3px",
              padding: "0.1rem 0.45rem",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {roleLabel(user.role)}
            </span>
          </div>
          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid #547A95", borderRadius: "4px", color: "#b8ccdc", padding: "0.3rem 0.8rem", cursor: "pointer", fontSize: "0.84rem" }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        <aside style={{ width: "210px", minWidth: "210px", background: "#2C3947", padding: "1rem 0.75rem", borderRight: "2px solid #3a4d5e" }}>
          {isAdminRole(user.role) ? (
            <>
              <NavLabel>Overview</NavLabel>
              <NavLink href="/admin">Dashboard</NavLink>
              <NavLabel>Management</NavLabel>
              <NavLink href="/schedules">Train Schedules</NavLink>
              <NavLink href="/schedule-history">Schedule History</NavLink>
              <NavLink href="/users">User Management</NavLink>
              <NavLabel>Analytics</NavLabel>
              <NavLink href="/reports">Reports</NavLink>
            </>
          ) : (
            <>
              <NavLabel>Overview</NavLabel>
              <NavLink href="/staff">Dashboard</NavLink>
              <NavLabel>Operations</NavLabel>
              <NavLink href="/passengers">Passenger Registration</NavLink>
              <NavLink href="/reservations">Reservations</NavLink>
              <NavLink href="/history">Booking History</NavLink>
            </>
          )}
        </aside>

        <main style={{ flex: 1, padding: "1.75rem 2rem", background: "#E8EDF2", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
