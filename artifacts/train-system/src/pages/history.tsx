// Booking History page (Staff only)
// View, search, and cancel reservations.
// Shows ticket number for each booking.

import React, { useState } from "react";
import {
  useListReservations, useCancelReservation,
  getListReservationsQueryKey, getListSchedulesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

function CancelModal({ reservationId, onConfirm, onCancel }: {
  reservationId: number; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(44,57,71,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "6px", padding: "1.75rem", maxWidth: "400px", width: "90%" }}>
        <h3 style={{ color: "#2C3947", fontWeight: "bold", marginBottom: "0.5rem" }}>Cancel Reservation</h3>
        <p style={{ color: "#4a6070", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Are you sure you want to cancel Reservation <strong>#{reservationId}</strong>?</p>
        <p style={{ color: "#991b1b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>The seat will be returned to the available pool and the ticket will be voided.</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>Keep Booking</button>
          <button onClick={onConfirm} style={{ background: "#991b1b", color: "#fff", border: "none", borderRadius: "4px", padding: "0.45rem 1rem", fontWeight: "600", cursor: "pointer" }}>Cancel Booking</button>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const queryClient = useQueryClient();
  const { data: reservations, isLoading } = useListReservations();
  const cancelMutation = useCancelReservation();

  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCancelConfirm = async () => {
    if (cancelTarget === null) return;
    try {
      await cancelMutation.mutateAsync({ reservationId: cancelTarget });
      queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
      showToast("Reservation cancelled and ticket voided successfully.");
    } catch {
      showToast("Failed to cancel reservation.");
    }
    setCancelTarget(null);
  };

  const filtered = reservations?.filter(r => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      r.passengerName.toLowerCase().includes(term) ||
      r.trainName.toLowerCase().includes(term) ||
      r.status.toLowerCase().includes(term) ||
      r.date.includes(term) ||
      ((r as any).ticketNumber ?? "").toLowerCase().includes(term)
    );
  }) ?? [];

  if (isLoading) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading...</div>;

  return (
    <div>
      {cancelTarget !== null && (
        <CancelModal reservationId={cancelTarget} onConfirm={handleCancelConfirm} onCancel={() => setCancelTarget(null)} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: "#dcfce7", border: "1px solid #86efac", borderRadius: "4px", padding: "0.75rem 1.25rem", color: "#166534", fontWeight: "600", zIndex: 900 }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: "1.25rem", borderBottom: "1px solid #c8d8e4", paddingBottom: "0.75rem" }}>
        <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", margin: 0 }}>Booking History</h1>
        <p style={{ color: "#547A95", fontSize: "0.88rem", marginTop: "0.2rem" }}>View and manage all reservations and their tickets.</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <Input
          type="text"
          placeholder="Search by passenger, train, ticket number, status, or date..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: "480px", borderColor: "#b8c8d4", borderRadius: "3px" }}
        />
      </div>

      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#2C3947", color: "#fff" }}>
              {["ID", "Ticket No.", "Passenger", "Train & Route", "Date", "Seat", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.65rem 0.85rem", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const ticketNumber = (r as any).ticketNumber as string | undefined;
              const ticketStatus = (r as any).ticketStatus as string | undefined;
              return (
                <tr key={r.reservationId} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>#{r.reservationId}</td>
                  <td style={{ padding: "0.55rem 0.85rem" }}>
                    {ticketNumber ? (
                      <span style={{
                        fontFamily: "monospace", fontSize: "0.8rem", fontWeight: "700",
                        color: ticketStatus === "cancelled" ? "#991b1b" : "#1e40af",
                        background: ticketStatus === "cancelled" ? "#fee2e2" : "#EFF6FF",
                        border: `1px solid ${ticketStatus === "cancelled" ? "#fca5a5" : "#93C5FD"}`,
                        borderRadius: "3px", padding: "0.1rem 0.35rem",
                      }}>
                        {ticketNumber}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947", fontWeight: "500" }}>{r.passengerName}</td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>
                    {r.trainName}<br /><span style={{ color: "#547A95", fontSize: "0.82rem" }}>{r.origin} → {r.destination}</span>
                  </td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{r.date}</td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{r.seatNumber}</td>
                  <td style={{ padding: "0.55rem 0.85rem" }}>
                    <span style={{ padding: "0.15rem 0.55rem", borderRadius: "3px", fontSize: "0.8rem", fontWeight: "700", background: r.status === "confirmed" ? "#dcfce7" : "#fee2e2", color: r.status === "confirmed" ? "#166534" : "#991b1b", border: `1px solid ${r.status === "confirmed" ? "#86efac" : "#fca5a5"}` }}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "0.55rem 0.85rem" }}>
                    {r.status === "confirmed" && (
                      <button onClick={() => setCancelTarget(r.reservationId)} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "3px", padding: "0.2rem 0.65rem", color: "#991b1b", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" }}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "1.5rem", textAlign: "center", color: "#7a95a8" }}>
                {searchTerm ? "No reservations match your search." : "No reservations found."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {searchTerm && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#7a95a8" }}>
          Showing {filtered.length} of {reservations?.length ?? 0} reservations
        </p>
      )}
    </div>
  );
}
