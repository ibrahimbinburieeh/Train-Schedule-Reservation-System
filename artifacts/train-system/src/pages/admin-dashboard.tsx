// Admin Dashboard — summary stats and quick links.

import { Link } from "wouter";
import { useGetReportSummary } from "@workspace/api-client-react";

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetReportSummary();

  if (isLoading) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading dashboard...</div>;

  const stats = [
    { label: "Total Trains", value: summary?.totalTrains ?? 0 },
    { label: "Total Schedules", value: summary?.totalSchedules ?? 0 },
    { label: "Total Passengers", value: summary?.totalPassengers ?? 0 },
    { label: "Total Reservations", value: summary?.totalReservations ?? 0 },
    { label: "Confirmed", value: summary?.confirmedReservations ?? 0 },
    { label: "Cancelled", value: summary?.cancelledReservations ?? 0 },
    { label: "Total Revenue", value: `SAR ${(summary?.totalRevenue ?? 0).toFixed(2)}` },
  ];

  const linkStyle = { background: "#547A95", color: "#ffffff", border: "1px solid #3f6278", borderRadius: "5px", padding: "0.5rem 1.1rem", fontWeight: "600", textDecoration: "none", fontSize: "0.9rem" };

  return (
    <div>
      <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Admin Dashboard</h1>
      <p style={{ color: "#547A95", fontSize: "0.88rem", marginBottom: "1.5rem" }}>Overview of the train reservation system.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #b8c8d4", borderRadius: "6px", padding: "1rem 1.1rem", boxShadow: "0 1px 4px rgba(44,57,71,0.08)" }}
            data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
            <div style={{ color: "#547A95", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.3rem" }}>{s.label}</div>
            <div style={{ color: "#2C3947", fontSize: "1.5rem", fontWeight: "bold" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ color: "#2C3947", fontSize: "1.05rem", fontWeight: "bold", marginBottom: "0.75rem" }}>Quick Links</h2>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/schedules" style={linkStyle} data-testid="link-schedules">Manage Schedules</Link>
        <Link href="/schedule-history" style={linkStyle}>Schedule History</Link>
        <Link href="/users" style={linkStyle}>User Management</Link>
        <Link href="/reports" style={linkStyle} data-testid="link-reports">View Reports</Link>
      </div>
    </div>
  );
}
