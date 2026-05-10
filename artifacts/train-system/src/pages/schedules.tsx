// Schedules page (Admin only)
// Create, edit, delete schedules with validation.
// Custom delete confirmation modal replaces browser alert.

import React, { useState } from "react";
import {
  useListSchedules, useCreateSchedule, useUpdateSchedule,
  useDeleteSchedule, useListTrains, getListSchedulesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Simple reusable modal for delete confirmation
function DeleteModal({ scheduleName, onConfirm, onCancel }: {
  scheduleName: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(44,57,71,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "6px", padding: "1.75rem", maxWidth: "400px", width: "90%" }}>
        <h3 style={{ color: "#2C3947", fontSize: "1.05rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Delete Schedule</h3>
        <p style={{ color: "#4a6070", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Are you sure you want to delete this schedule?</p>
        <p style={{ color: "#991b1b", fontSize: "0.85rem", fontWeight: "600", marginBottom: "1.25rem" }}>{scheduleName}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: "#991b1b", color: "#fff", border: "none", borderRadius: "4px", padding: "0.45rem 1rem", fontWeight: "600", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function Schedules() {
  const queryClient = useQueryClient();
  const { data: schedules, isLoading: loadingSchedules } = useListSchedules();
  const { data: trains, isLoading: loadingTrains } = useListTrains();
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    trainId: "", origin: "", destination: "",
    departureTime: "", arrivalTime: "", date: "",
    ticketPrice: "", seatCapacity: "",
  });

  const handleOpenForm = (schedule: any = null) => {
    setFormMsg(null);
    if (schedule) {
      setEditingId(schedule.scheduleId);
      setFormData({
        trainId: schedule.trainId.toString(), origin: schedule.origin,
        destination: schedule.destination, departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime, date: schedule.date,
        ticketPrice: schedule.ticketPrice.toString(),
        seatCapacity: schedule.seatCapacity?.toString() ?? "",
      });
    } else {
      setEditingId(null);
      setFormData({ trainId: "", origin: "", destination: "", departureTime: "", arrivalTime: "", date: "", ticketPrice: "", seatCapacity: "" });
    }
    setIsFormOpen(true);
  };

  // Validate form before submission
  const validate = (): string | null => {
    if (!formData.trainId || !formData.origin || !formData.destination || !formData.date || !formData.departureTime || !formData.arrivalTime || !formData.ticketPrice) {
      return "Please fill all required fields.";
    }
    if (formData.arrivalTime <= formData.departureTime) {
      return "Arrival time must be after departure time.";
    }
    if (formData.seatCapacity && parseInt(formData.seatCapacity) <= 0) {
      return "Seat capacity must be greater than 0.";
    }
    if (parseFloat(formData.ticketPrice) < 0) {
      return "Ticket price cannot be negative.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormMsg({ type: "error", text: err }); return; }

    const payload: any = {
      trainId: parseInt(formData.trainId), origin: formData.origin,
      destination: formData.destination, departureTime: formData.departureTime,
      arrivalTime: formData.arrivalTime, date: formData.date,
      ticketPrice: parseFloat(formData.ticketPrice),
    };
    if (formData.seatCapacity) payload.seatCapacity = parseInt(formData.seatCapacity);

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ scheduleId: editingId, data: payload });
        setFormMsg({ type: "success", text: "Schedule updated successfully." });
      } else {
        await createMutation.mutateAsync({ data: payload });
        setFormMsg({ type: "success", text: "Schedule saved successfully." });
      }
      queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
      setTimeout(() => { setIsFormOpen(false); setFormMsg(null); }, 1200);
    } catch {
      setFormMsg({ type: "error", text: "Failed to save schedule. Please try again." });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ scheduleId: deleteTarget.id });
      queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
      setDeleteMsg("Schedule deleted successfully.");
      setTimeout(() => setDeleteMsg(null), 3000);
    } catch {
      setDeleteMsg("Failed to delete schedule.");
    }
    setDeleteTarget(null);
  };

  if (loadingSchedules || loadingTrains) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading...</div>;

  const btn = (label: string, onClick: () => void, style?: React.CSSProperties) => (
    <button onClick={onClick} style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "4px", padding: "0.45rem 1rem", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem", ...style }}>{label}</button>
  );

  return (
    <div>
      {deleteTarget && (
        <DeleteModal
          scheduleName={`Schedule #${deleteTarget.id} — ${deleteTarget.name}`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #c8d8e4", paddingBottom: "0.75rem" }}>
        <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold" }}>Train Schedules</h1>
        {btn("+ Add Schedule", () => handleOpenForm())}
      </div>

      {deleteMsg && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "4px", padding: "0.65rem 1rem", marginBottom: "1rem", color: "#166534", fontWeight: "600", fontSize: "0.9rem" }}>
          {deleteMsg}
        </div>
      )}

      {/* Create / Edit form */}
      {isFormOpen && (
        <div style={{ border: "1px solid #b8c8d4", background: "#f0f5f8", padding: "1.25rem", marginBottom: "1.5rem", borderRadius: "4px" }}>
          <h2 style={{ color: "#2C3947", fontWeight: "bold", marginBottom: "1rem" }}>{editingId ? "Edit" : "Create"} Schedule</h2>

          {formMsg && (
            <div style={{ background: formMsg.type === "success" ? "#dcfce7" : "#fee2e2", border: `1px solid ${formMsg.type === "success" ? "#86efac" : "#fca5a5"}`, borderRadius: "4px", padding: "0.6rem 0.85rem", marginBottom: "1rem", color: formMsg.type === "success" ? "#166534" : "#991b1b", fontWeight: "600", fontSize: "0.88rem" }}>
              {formMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Train <span style={{ color: "#991b1b" }}>*</span></Label>
                <select required style={{ width: "100%", border: "1px solid #b8c8d4", background: "#fff", padding: "0.45rem", color: "#2C3947", borderRadius: "3px" }}
                  value={formData.trainId} onChange={e => setFormData({ ...formData, trainId: e.target.value })}>
                  <option value="">Select Train...</option>
                  {trains?.map(t => <option key={t.trainId} value={t.trainId}>{t.trainName}</option>)}
                </select>
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Date <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Origin Station <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="text" required value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} placeholder="e.g. KAFD" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Destination Station <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="text" required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="e.g. STC" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Departure Time <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="time" required value={formData.departureTime} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Arrival Time <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="time" required value={formData.arrivalTime} onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })} style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Ticket Price (SAR) <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="number" step="0.01" required value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} placeholder="4.00" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Seat Capacity</Label>
                <Input type="number" value={formData.seatCapacity} onChange={e => setFormData({ ...formData, seatCapacity: e.target.value })} placeholder="Uses train default if empty" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
              <button type="button" onClick={() => { setIsFormOpen(false); setFormMsg(null); }} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "3px", padding: "0.45rem 1.1rem", fontWeight: "600", cursor: "pointer" }}>
                {editingId ? "Update Schedule" : "Save Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules table */}
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#2C3947", color: "#fff" }}>
              {["ID", "Train", "Route", "Date & Time", "Capacity", "Available", "Price (SAR)", "Last Updated", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.65rem 0.75rem", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules?.map((s, i) => (
              <tr key={s.scheduleId} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                <td style={{ padding: "0.55rem 0.75rem", color: "#2C3947" }}>{s.scheduleId}</td>
                <td style={{ padding: "0.55rem 0.75rem", color: "#2C3947", fontWeight: "500" }}>{s.trainName}</td>
                <td style={{ padding: "0.55rem 0.75rem", color: "#2C3947" }}>{s.origin} → {s.destination}</td>
                <td style={{ padding: "0.55rem 0.75rem", color: "#2C3947" }}>
                  {s.date}<br /><span style={{ color: "#547A95", fontSize: "0.82rem" }}>{s.departureTime} – {s.arrivalTime}</span>
                </td>
                <td style={{ padding: "0.55rem 0.75rem", color: "#2C3947" }}>{(s as any).seatCapacity ?? "—"}</td>
                <td style={{ padding: "0.55rem 0.75rem", fontWeight: "600", color: s.availableSeats > 0 ? "#166534" : "#991b1b" }}>{s.availableSeats}</td>
                <td style={{ padding: "0.55rem 0.75rem", color: "#2C3947" }}>SAR {s.ticketPrice.toFixed(2)}</td>
                <td style={{ padding: "0.55rem 0.75rem", color: "#547A95", fontSize: "0.82rem" }}>{(s as any).updatedAt ?? "—"}</td>
                <td style={{ padding: "0.55rem 0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => handleOpenForm(s)} style={{ background: "#e8f0f5", border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.2rem 0.6rem", color: "#2C3947", cursor: "pointer", fontSize: "0.82rem" }}>Edit</button>
                    <button onClick={() => setDeleteTarget({ id: s.scheduleId, name: `${s.trainName} — ${s.origin} → ${s.destination}` })} style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "3px", padding: "0.2rem 0.6rem", color: "#991b1b", cursor: "pointer", fontSize: "0.82rem" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {schedules?.length === 0 && (
              <tr><td colSpan={9} style={{ padding: "1.5rem", textAlign: "center", color: "#7a95a8" }}>No schedules found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
