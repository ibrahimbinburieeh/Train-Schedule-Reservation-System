// Reports page (Admin only)
// Summary stats + simple SVG bar charts (no external library).
// Charts: Booking Status, Revenue by Month, Train Utilization.

import React from "react";
import { useGetReportSummary, useGetMonthlyReport } from "@workspace/api-client-react";

function useJson<T>(path: string) {
  const [data, setData] = React.useState<T | null>(null);
  React.useEffect(() => {
    fetch(`/api${path}`).then(r => r.json()).then(setData).catch(() => {});
  }, [path]);
  return data;
}

// Simple SVG bar chart — no external library needed
function BarChart({ data, color = "#547A95", height = 120 }: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return <p style={{ color: "#7a95a8", fontSize: "0.88rem" }}>No data to display.</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(48, Math.floor(480 / data.length) - 8);
  const svgW = data.length * (barW + 10);
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(svgW, 300)} height={height + 36} style={{ display: "block" }}>
        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d.value / max) * height));
          const x = i * (barW + 10) + 4;
          const y = height - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx={2} />
              <text x={x + barW / 2} y={height + 13} textAnchor="middle" fontSize={10} fill="#547A95">
                {d.label.length > 8 ? d.label.substring(0, 7) + "…" : d.label}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#2C3947" fontWeight="600">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Two-bar side-by-side chart for booking status
function StatusChart({ confirmed, cancelled }: { confirmed: number; cancelled: number }) {
  const max = Math.max(confirmed, cancelled, 1);
  const h = 100;
  const bw = 60;
  return (
    <svg width={220} height={h + 40} style={{ display: "block" }}>
      {/* Confirmed bar */}
      <rect x={20} y={h - Math.round((confirmed / max) * h)} width={bw} height={Math.round((confirmed / max) * h)} fill="#547A95" rx={2} />
      <text x={50} y={h + 16} textAnchor="middle" fontSize={11} fill="#547A95">Confirmed</text>
      <text x={50} y={h - Math.round((confirmed / max) * h) - 5} textAnchor="middle" fontSize={12} fill="#2C3947" fontWeight="700">{confirmed}</text>
      {/* Cancelled bar */}
      <rect x={110} y={h - Math.round((cancelled / max) * h)} width={bw} height={Math.round((cancelled / max) * h)} fill="#f87171" rx={2} />
      <text x={140} y={h + 16} textAnchor="middle" fontSize={11} fill="#991b1b">Cancelled</text>
      <text x={140} y={h - Math.round((cancelled / max) * h) - 5} textAnchor="middle" fontSize={12} fill="#2C3947" fontWeight="700">{cancelled}</text>
    </svg>
  );
}

export default function Reports() {
  const { data: summary, isLoading } = useGetReportSummary();
  const { data: monthly } = useGetMonthlyReport();
  const daily = useJson<{ date: string; totalBookings: number; confirmedBookings: number; cancelledBookings: number; revenue: number }>("/reports/daily");
  const weekly = useJson<{ date: string; bookings: number; revenue: number }[]>("/reports/weekly");
  const trends = useJson<{ month: string; confirmed: number; cancelled: number }[]>("/reports/trends");
  const utilization = useJson<{ scheduleId: number; trainName: string; route: string; date: string; seatCapacity: number; bookedSeats: number; availableSeats: number; utilizationPct: number }[]>("/reports/utilization");
  const occupancy = useJson<{ totalSeats: number; bookedSeats: number; availableSeats: number; occupancyPct: number }>("/reports/occupancy");

  if (isLoading) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading reports...</div>;

  const sectionTitle = (text: string) => (
    <h2 style={{ color: "#2C3947", fontSize: "1.05rem", fontWeight: "bold", margin: "2rem 0 0.75rem", borderBottom: "1px solid #c8d8e4", paddingBottom: "0.4rem" }}>{text}</h2>
  );

  const tdS: React.CSSProperties = { padding: "0.55rem 0.85rem", color: "#2C3947", fontSize: "0.88rem" };
  const thS: React.CSSProperties = { padding: "0.65rem 0.85rem", textAlign: "left", fontWeight: "600", fontSize: "0.88rem" };
  const tableHead = (cols: string[]) => (
    <thead><tr style={{ background: "#2C3947", color: "#fff" }}>{cols.map(c => <th key={c} style={thS}>{c}</th>)}</tr></thead>
  );

  return (
    <div>
      <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Reports</h1>
      <p style={{ color: "#547A95", fontSize: "0.88rem" }}>System-wide statistics and booking analysis.</p>

      {/* Summary */}
      {sectionTitle("Summary Statistics")}
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Total Revenue", `SAR ${(summary?.totalRevenue ?? 0).toFixed(2)}`, true],
              ["Total Reservations", summary?.totalReservations ?? 0, false],
              ["Confirmed Bookings", summary?.confirmedReservations ?? 0, false],
              ["Cancelled Bookings", summary?.cancelledReservations ?? 0, false],
              ["Total Trains Registered", summary?.totalTrains ?? 0, false],
              ["Total Passengers Registered", summary?.totalPassengers ?? 0, false],
            ].map(([label, val, bold], i) => (
              <tr key={String(label)} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                <th style={{ ...tdS, fontWeight: "600", width: "40%" }}>{label}</th>
                <td style={{ ...tdS, color: bold ? "#547A95" : "#2C3947", fontWeight: bold ? "700" : "400", fontSize: bold ? "1rem" : "0.88rem" }}>{String(val)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart: Booking Status */}
      {sectionTitle("Booking Status Chart")}
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "1.25rem" }}>
        <p style={{ color: "#7a95a8", fontSize: "0.82rem", marginBottom: "0.75rem" }}>Confirmed vs Cancelled reservations</p>
        <StatusChart
          confirmed={summary?.confirmedReservations ?? 0}
          cancelled={summary?.cancelledReservations ?? 0}
        />
      </div>

      {/* Daily Booking Report */}
      {sectionTitle("Daily Booking Report")}
      {daily ? (
        <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[["Date", daily.date], ["Total Bookings Today", daily.totalBookings], ["Confirmed", daily.confirmedBookings], ["Cancelled", daily.cancelledBookings], ["Revenue Today", `SAR ${daily.revenue.toFixed(2)}`]].map(([l, v], i) => (
                <tr key={String(l)} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                  <th style={{ ...tdS, fontWeight: "600", width: "40%" }}>{l}</th>
                  <td style={tdS}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p style={{ color: "#7a95a8", fontSize: "0.88rem" }}>Loading...</p>}

      {/* Weekly Booking Report */}
      {sectionTitle("Weekly Booking Report (Last 7 Days)")}
      {weekly ? (
        <>
          <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "1.25rem", marginBottom: "0.75rem" }}>
            <p style={{ color: "#7a95a8", fontSize: "0.82rem", marginBottom: "0.75rem" }}>Bookings per day</p>
            <BarChart data={weekly.map(d => ({ label: d.date.substring(5), value: d.bookings }))} />
          </div>
          <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              {tableHead(["Date", "Bookings", "Revenue (SAR)"])}
              <tbody>
                {weekly.map((d, i) => (
                  <tr key={d.date} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                    <td style={tdS}>{d.date}</td>
                    <td style={tdS}>{d.bookings}</td>
                    <td style={tdS}>SAR {d.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <p style={{ color: "#7a95a8", fontSize: "0.88rem" }}>Loading...</p>}

      {/* Monthly Booking Report */}
      {sectionTitle("Monthly Booking Data")}
      {monthly && monthly.length > 0 ? (
        <>
          <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "1.25rem", marginBottom: "0.75rem" }}>
            <p style={{ color: "#7a95a8", fontSize: "0.82rem", marginBottom: "0.75rem" }}>Revenue by month (SAR)</p>
            <BarChart data={monthly.map(m => ({ label: m.month, value: Math.round(m.revenue) }))} color="#2C3947" />
          </div>
          <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              {tableHead(["Month", "Total Bookings", "Revenue (SAR)"])}
              <tbody>
                {monthly.map((m, i) => (
                  <tr key={m.month} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                    <td style={{ ...tdS, fontWeight: "600" }}>{m.month}</td>
                    <td style={tdS}>{m.bookings}</td>
                    <td style={tdS}>SAR {m.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <p style={{ color: "#7a95a8", fontSize: "0.88rem" }}>No monthly data available.</p>}

      {/* Reservation Trends */}
      {sectionTitle("Reservation Trends")}
      {trends && trends.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {tableHead(["Month", "Confirmed", "Cancelled"])}
            <tbody>
              {trends.map((t, i) => (
                <tr key={t.month} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                  <td style={{ ...tdS, fontWeight: "600" }}>{t.month}</td>
                  <td style={{ ...tdS, color: "#166534", fontWeight: "600" }}>{t.confirmed}</td>
                  <td style={{ ...tdS, color: "#991b1b", fontWeight: "600" }}>{t.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p style={{ color: "#7a95a8", fontSize: "0.88rem" }}>No trend data available.</p>}

      {/* Train Utilization */}
      {sectionTitle("Train Utilization")}
      {utilization && utilization.length > 0 ? (
        <>
          <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "1.25rem", marginBottom: "0.75rem" }}>
            <p style={{ color: "#7a95a8", fontSize: "0.82rem", marginBottom: "0.75rem" }}>Utilization % per schedule</p>
            <BarChart data={utilization.map(u => ({ label: `#${u.scheduleId}`, value: u.utilizationPct }))} color="#547A95" />
          </div>
          <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              {tableHead(["Train", "Route", "Date", "Capacity", "Booked", "Available", "Utilization"])}
              <tbody>
                {utilization.map((u, i) => (
                  <tr key={u.scheduleId} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                    <td style={{ ...tdS, fontWeight: "500" }}>{u.trainName}</td>
                    <td style={tdS}>{u.route}</td>
                    <td style={tdS}>{u.date}</td>
                    <td style={tdS}>{u.seatCapacity}</td>
                    <td style={tdS}>{u.bookedSeats}</td>
                    <td style={{ ...tdS, color: u.availableSeats > 0 ? "#166534" : "#991b1b", fontWeight: "600" }}>{u.availableSeats}</td>
                    <td style={tdS}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, background: "#e8edf2", borderRadius: "3px", height: "8px", overflow: "hidden" }}>
                          <div style={{ width: `${u.utilizationPct}%`, background: u.utilizationPct > 80 ? "#991b1b" : "#547A95", height: "100%" }} />
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#2C3947", minWidth: "36px" }}>{u.utilizationPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <p style={{ color: "#7a95a8", fontSize: "0.88rem" }}>No schedule data.</p>}

      {/* Seat Occupancy */}
      {sectionTitle("Overall Seat Occupancy")}
      {occupancy ? (
        <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden", marginBottom: "2rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[["Total Seats (All Schedules)", occupancy.totalSeats], ["Booked Seats", occupancy.bookedSeats], ["Available Seats", occupancy.availableSeats], ["Occupancy Rate", `${occupancy.occupancyPct}%`]].map(([l, v], i) => (
                <tr key={String(l)} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                  <th style={{ ...tdS, fontWeight: "600", width: "40%" }}>{l}</th>
                  <td style={tdS}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p style={{ color: "#7a95a8", fontSize: "0.88rem" }}>Loading...</p>}
    </div>
  );
}
