// Reservations page (Staff only)
// Create a new reservation for a passenger on a schedule.
// Validates seat availability before confirming.
// Shows a booking confirmation popup after successful booking, including ticket number.

import React, { useState } from "react";
import {
  useListPassengers,
  useListSchedules,
  useCreateReservation,
  getListSchedulesQueryKey,
  getListReservationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

function BookingConfirmation({
  booking,
  onClose,
}: {
  booking: {
    reservationId: number;
    passengerName: string;
    trainName: string;
    origin: string;
    destination: string;
    date: string;
    seatNumber: number;
    status: string;
    ticketPrice: number;
    ticketNumber?: string;
    ticketIssuedAt?: string;
  };
  onClose: () => void;
}) {
  const rows: [string, string][] = [
    ["Reservation ID", `#${booking.reservationId}`],
    ...(booking.ticketNumber ? [["Ticket Number", booking.ticketNumber] as [string, string]] : []),
    ["Passenger Name", booking.passengerName],
    ["Train", booking.trainName],
    ["Route", `${booking.origin} → ${booking.destination}`],
    ["Date", booking.date],
    ["Seat Number", String(booking.seatNumber)],
    ["Ticket Price", `SAR ${booking.ticketPrice.toFixed(2)}`],
    ["Status", booking.status.toUpperCase()],
  ];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(44,57,71,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", border: "2px solid #547A95", borderRadius: "6px",
        width: "100%", maxWidth: "460px", padding: "2rem", boxShadow: "0 4px 20px rgba(44,57,71,0.2)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
            <span style={{ color: "#166534", fontSize: "1.4rem" }}>✓</span>
          </div>
          <h2 style={{ color: "#2C3947", fontSize: "1.15rem", fontWeight: "bold", margin: 0 }}>Booking Confirmed</h2>
          <p style={{ color: "#547A95", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>Your reservation and ticket have been successfully created.</p>
        </div>

        {/* Ticket number highlight */}
        {booking.ticketNumber && (
          <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "4px", padding: "0.65rem 1rem", marginBottom: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "#547A95", fontWeight: "600", marginBottom: "0.15rem" }}>TICKET NUMBER</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#2C3947", letterSpacing: "0.04em" }}>{booking.ticketNumber}</div>
          </div>
        )}

        {/* Booking details */}
        <div style={{ border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden", marginBottom: "1.25rem" }}>
          {rows.map(([label, val], i) => (
            <div key={String(label)} style={{
              display: "flex", justifyContent: "space-between",
              padding: "0.55rem 0.85rem",
              background: i % 2 === 0 ? "#f8fafc" : "#fff",
              borderBottom: i < rows.length - 1 ? "1px solid #dde8ef" : "none",
              fontSize: "0.88rem",
            }}>
              <span style={{ color: "#547A95", fontWeight: "600" }}>{String(label)}</span>
              <span style={{
                color: label === "Status" ? "#166534" : label === "Ticket Number" ? "#1e40af" : "#2C3947",
                fontWeight: label === "Status" || label === "Ticket Number" ? "700" : "500",
              }}>
                {String(val)}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{ width: "100%", background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "4px", padding: "0.65rem", fontWeight: "600", cursor: "pointer", fontSize: "0.95rem" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function Reservations() {
  const queryClient = useQueryClient();
  const { data: passengers, isLoading: loadingPassengers } = useListPassengers();
  const { data: schedules, isLoading: loadingSchedules } = useListSchedules();
  const createMutation = useCreateReservation();

  const [passengerId, setPassengerId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  const selectedSchedule = schedules?.find(s => s.scheduleId.toString() === scheduleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedSchedule && selectedSchedule.availableSeats <= 0) {
      setError("No seats available for this schedule.");
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        data: {
          passengerId: parseInt(passengerId),
          scheduleId: parseInt(scheduleId),
        }
      });
      setConfirmedBooking(res);
      setPassengerId("");
      setScheduleId("");
      queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create reservation.");
    }
  };

  if (loadingPassengers || loadingSchedules) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading...</div>;

  return (
    <div>
      {confirmedBooking && (
        <BookingConfirmation
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

      <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Create Reservation</h1>
      <p style={{ color: "#547A95", fontSize: "0.88rem", marginBottom: "1.5rem" }}>Select a passenger and a schedule to book a seat.</p>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "4px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#991b1b", fontWeight: "600", fontSize: "0.9rem" }}>
          {error}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "1.5rem", maxWidth: "560px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Passenger select */}
          <div>
            <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "6px" }}>Select Passenger</Label>
            <select
              required
              style={{ width: "100%", border: "1px solid #b8c8d4", background: "#fff", padding: "0.5rem", color: "#2C3947", borderRadius: "3px", fontSize: "0.9rem" }}
              value={passengerId}
              onChange={e => setPassengerId(e.target.value)}
            >
              <option value="">-- Choose Passenger --</option>
              {passengers?.map(p => (
                <option key={p.passengerId} value={p.passengerId}>
                  {p.fullName} — ID: {p.identificationNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule select */}
          <div>
            <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "6px" }}>Select Schedule</Label>
            <select
              required
              style={{ width: "100%", border: "1px solid #b8c8d4", background: "#fff", padding: "0.5rem", color: "#2C3947", borderRadius: "3px", fontSize: "0.9rem" }}
              value={scheduleId}
              onChange={e => { setScheduleId(e.target.value); setError(null); }}
            >
              <option value="">-- Choose Schedule --</option>
              {schedules?.map(s => (
                <option key={s.scheduleId} value={s.scheduleId} disabled={s.availableSeats <= 0}>
                  {s.date} | {s.trainName} | {s.origin} → {s.destination} — SAR {s.ticketPrice.toFixed(2)} {s.availableSeats <= 0 ? "(Full)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Seat availability info */}
          {selectedSchedule && (
            <div style={{
              background: selectedSchedule.availableSeats > 0 ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${selectedSchedule.availableSeats > 0 ? "#86efac" : "#fca5a5"}`,
              borderRadius: "4px",
              padding: "0.75rem 1rem",
              fontSize: "0.88rem",
            }}>
              <div style={{ color: "#2C3947", fontWeight: "600", marginBottom: "0.25rem" }}>Schedule Details</div>
              <div style={{ color: "#547A95" }}>Route: {selectedSchedule.origin} → {selectedSchedule.destination}</div>
              <div style={{ color: "#547A95" }}>Date: {selectedSchedule.date} | Time: {selectedSchedule.departureTime} – {selectedSchedule.arrivalTime}</div>
              <div style={{ marginTop: "0.35rem", fontWeight: "700", color: selectedSchedule.availableSeats > 0 ? "#166534" : "#991b1b" }}>
                Available Seats: {selectedSchedule.availableSeats}
                {selectedSchedule.availableSeats <= 0 && " — No seats available for this schedule."}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending || (!!selectedSchedule && selectedSchedule.availableSeats <= 0)}
            style={{
              background: createMutation.isPending || (!!selectedSchedule && selectedSchedule.availableSeats <= 0) ? "#aaa" : "#547A95",
              color: "#fff", border: "none", borderRadius: "4px",
              padding: "0.75rem", fontWeight: "700", cursor: createMutation.isPending ? "wait" : "pointer",
              fontSize: "1rem",
            }}
          >
            {createMutation.isPending ? "Processing..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
