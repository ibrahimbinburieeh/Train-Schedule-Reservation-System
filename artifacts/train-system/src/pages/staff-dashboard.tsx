import { Link } from "wouter";
import { useListReservations } from "@workspace/api-client-react";

export default function StaffDashboard() {
  const { data: reservations, isLoading } = useListReservations();

  if (isLoading) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading dashboard...</div>;

  const recentReservations = reservations?.slice(0, 5) ?? [];
  const confirmedCount = reservations?.filter((r: any) => r.status === "confirmed").length ?? 0;
  const cancelledCount = reservations?.filter((r: any) => r.status === "cancelled").length ?? 0;

  return (
    <div>
      <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Staff Dashboard</h1>
      <p style={{ color: "#547A95", fontSize: "0.88rem", marginBottom: "1.5rem" }}>Manage passenger registrations and reservations.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Reservations", value: reservations?.length ?? 0 },
          { label: "Confirmed", value: confirmedCount },
          { label: "Cancelled", value: cancelledCount },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#ffffff",
              border: "1px solid #b8c8d4",
              borderRadius: "6px",
              padding: "1rem 1.1rem",
              boxShadow: "0 1px 4px rgba(44,57,71,0.08)",
            }}
            data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}
          >
            <div style={{ color: "#547A95", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.3rem" }}>{s.label}</div>
            <div style={{ color: "#2C3947", fontSize: "1.5rem", fontWeight: "bold" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ color: "#2C3947", fontSize: "1.05rem", fontWeight: "bold", marginBottom: "0.75rem" }}>Quick Links</h2>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <Link
          href="/passengers"
          style={{ background: "#547A95", color: "#ffffff", border: "1px solid #3f6278", borderRadius: "5px", padding: "0.5rem 1.1rem", fontWeight: "600", textDecoration: "none", fontSize: "0.9rem" }}
          data-testid="link-passengers"
        >
          Register Passenger
        </Link>
        <Link
          href="/reservations"
          style={{ background: "#547A95", color: "#ffffff", border: "1px solid #3f6278", borderRadius: "5px", padding: "0.5rem 1.1rem", fontWeight: "600", textDecoration: "none", fontSize: "0.9rem" }}
          data-testid="link-reservations"
        >
          Create Reservation
        </Link>
        <Link
          href="/history"
          style={{ background: "#547A95", color: "#ffffff", border: "1px solid #3f6278", borderRadius: "5px", padding: "0.5rem 1.1rem", fontWeight: "600", textDecoration: "none", fontSize: "0.9rem" }}
          data-testid="link-history"
        >
          Booking History
        </Link>
      </div>

      <h2 style={{ color: "#2C3947", fontSize: "1.05rem", fontWeight: "bold", marginBottom: "0.75rem" }}>Recent Reservations</h2>
      <div style={{ background: "#ffffff", border: "1px solid #b8c8d4", borderRadius: "6px", overflow: "hidden", boxShadow: "0 1px 4px rgba(44,57,71,0.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#2C3947", color: "#ffffff" }}>
              <th style={{ padding: "0.6rem 0.85rem", textAlign: "left", fontWeight: "600" }}>ID</th>
              <th style={{ padding: "0.6rem 0.85rem", textAlign: "left", fontWeight: "600" }}>Passenger</th>
              <th style={{ padding: "0.6rem 0.85rem", textAlign: "left", fontWeight: "600" }}>Train</th>
              <th style={{ padding: "0.6rem 0.85rem", textAlign: "left", fontWeight: "600" }}>Date</th>
              <th style={{ padding: "0.6rem 0.85rem", textAlign: "left", fontWeight: "600" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentReservations.map((r: any, i: number) => (
              <tr key={r.reservationId} style={{ background: i % 2 === 0 ? "#f8fafc" : "#ffffff", borderBottom: "1px solid #dde8ef" }}>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{r.reservationId}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{r.passengerName}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{r.trainName}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{r.date}</td>
                <td style={{ padding: "0.55rem 0.85rem" }}>
                  <span style={{
                    padding: "0.15rem 0.55rem",
                    borderRadius: "3px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    background: r.status === "confirmed" ? "#dcfce7" : "#fee2e2",
                    color: r.status === "confirmed" ? "#166534" : "#991b1b",
                    border: `1px solid ${r.status === "confirmed" ? "#86efac" : "#fca5a5"}`,
                  }}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {recentReservations.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "1.2rem", textAlign: "center", color: "#7a95a8" }}>No recent reservations</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
