// Passenger Management page
// Staff & Admin: can add, edit, and delete passengers.
// Delete flow:
//   - No reservations  → simple confirmation modal → delete
//   - Has reservations → warning modal with cascade option

import React, { useState } from "react";
import {
  useListPassengers, useCreatePassenger, useUpdatePassenger, getListPassengersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

// ── Modals ────────────────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  passenger,
  onConfirm,
  onCancel,
  loading,
}: {
  passenger: { passengerId: number; fullName: string };
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,57,71,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "6px", padding: "1.75rem", maxWidth: "400px", width: "90%" }}>
        <h3 style={{ color: "#2C3947", fontWeight: "bold", marginBottom: "0.5rem" }}>Delete Passenger</h3>
        <p style={{ color: "#4a6070", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
          Are you sure you want to delete <strong>{passenger.fullName}</strong>?
        </p>
        <p style={{ color: "#991b1b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>This action cannot be undone.</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onCancel} disabled={loading} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ background: "#991b1b", color: "#fff", border: "none", borderRadius: "4px", padding: "0.45rem 1rem", fontWeight: "600", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ForceDeleteModal({
  passenger,
  reservationCount,
  onConfirm,
  onCancel,
  loading,
}: {
  passenger: { passengerId: number; fullName: string };
  reservationCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,57,71,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "2px solid #f97316", borderRadius: "6px", padding: "1.75rem", maxWidth: "440px", width: "90%" }}>
        {/* Warning icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
          </div>
          <h3 style={{ color: "#2C3947", fontWeight: "bold", margin: 0 }}>Passenger Has Reservations</h3>
        </div>

        <p style={{ color: "#4a6070", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          <strong>{passenger.fullName}</strong> has <strong>{reservationCount}</strong> existing reservation{reservationCount !== 1 ? "s" : ""}.
        </p>
        <p style={{ color: "#4a6070", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Do you want to delete the passenger and all related reservations?
        </p>

        <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "4px", padding: "0.65rem 0.85rem", marginBottom: "1.25rem", fontSize: "0.85rem", color: "#9a3412" }}>
          This will permanently delete the passenger, all their reservations, and associated tickets. Seat availability will be restored for confirmed bookings.
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onCancel} disabled={loading} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ background: "#c2410c", color: "#fff", border: "none", borderRadius: "4px", padding: "0.45rem 1.1rem", fontWeight: "600", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1, fontSize: "0.9rem" }}>
            {loading ? "Deleting…" : "Delete Passenger and Reservations"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type DeleteTarget = { passengerId: number; fullName: string };

export default function Passengers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  const queryClient = useQueryClient();
  const { data: passengers, isLoading } = useListPassengers();
  const createMutation = useCreatePassenger();
  const updateMutation = useUpdatePassenger();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal state machine
  const [confirmTarget, setConfirmTarget] = useState<DeleteTarget | null>(null);   // simple confirmation
  const [forceTarget, setForceTarget] = useState<{ passenger: DeleteTarget; reservationCount: number } | null>(null); // has-reservations warning
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({ fullName: "", phoneNumber: "", identificationNumber: "", email: "" });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenForm = (passenger: any = null) => {
    setFormMsg(null);
    if (passenger) {
      setEditingId(passenger.passengerId);
      setFormData({ fullName: passenger.fullName, phoneNumber: passenger.phoneNumber, identificationNumber: passenger.identificationNumber, email: passenger.email || "" });
    } else {
      setEditingId(null);
      setFormData({ fullName: "", phoneNumber: "", identificationNumber: "", email: "" });
    }
    setIsFormOpen(true);
  };

  const validate = (): string | null => {
    if (!formData.fullName || !formData.phoneNumber || !formData.identificationNumber) return "Please fill all required fields.";
    if (formData.phoneNumber.trim().length < 7) return "Phone number is required and must be valid.";
    if (formData.identificationNumber.replace(/\D/g, "").length !== 10) return "National ID must be exactly 10 digits.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    const err = validate();
    if (err) { setFormMsg({ type: "error", text: err }); return; }
    const payload = { fullName: formData.fullName, phoneNumber: formData.phoneNumber, identificationNumber: formData.identificationNumber, email: formData.email || undefined };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ passengerId: editingId, data: payload });
        showToast("Passenger updated successfully.");
      } else {
        await createMutation.mutateAsync({ data: payload });
        showToast("Passenger registered successfully.");
      }
      queryClient.invalidateQueries({ queryKey: getListPassengersQueryKey() });
      setIsFormOpen(false);
    } catch (err: any) {
      setFormMsg({ type: "error", text: err?.response?.data?.error || "Failed to save passenger." });
    }
  };

  // Step 1: user clicked Delete → try a normal (non-force) DELETE
  const handleDeleteAttempt = async () => {
    if (!confirmTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`/api/passengers/${confirmTarget.passengerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (res.ok) {
        // No reservations — deleted cleanly
        showToast("Passenger deleted successfully.");
        queryClient.invalidateQueries({ queryKey: getListPassengersQueryKey() });
        setConfirmTarget(null);
      } else if (res.status === 409 && body.hasReservations) {
        // Has reservations — close simple modal, open warning modal
        setConfirmTarget(null);
        setForceTarget({ passenger: { passengerId: confirmTarget.passengerId, fullName: confirmTarget.fullName }, reservationCount: body.reservationCount });
      } else {
        showToast(body.error ?? "Failed to delete passenger.", "error");
        setConfirmTarget(null);
      }
    } catch {
      showToast("Failed to delete passenger.", "error");
      setConfirmTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Step 2 (optional): user confirmed force delete
  const handleForceDelete = async () => {
    if (!forceTarget) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`/api/passengers/${forceTarget.passenger.passengerId}?force=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (res.ok) {
        showToast("Passenger and related reservations deleted successfully.");
        queryClient.invalidateQueries({ queryKey: getListPassengersQueryKey() });
        setForceTarget(null);
      } else {
        showToast(body.error ?? "Failed to delete passenger.", "error");
        setForceTarget(null);
      }
    } catch {
      showToast("Failed to delete passenger.", "error");
      setForceTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = passengers?.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return p.fullName.toLowerCase().includes(term) || p.phoneNumber.includes(term) || p.identificationNumber.includes(term);
  }) ?? [];

  if (isLoading) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading...</div>;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 900,
          background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
          border: `1px solid ${toast.type === "success" ? "#86efac" : "#fca5a5"}`,
          borderRadius: "4px", padding: "0.75rem 1.25rem",
          color: toast.type === "success" ? "#166534" : "#991b1b", fontWeight: "600",
        }}>
          {toast.text}
        </div>
      )}

      {/* Simple confirmation modal (no reservations) */}
      {confirmTarget && (
        <ConfirmDeleteModal
          passenger={confirmTarget}
          onConfirm={handleDeleteAttempt}
          onCancel={() => { if (!deleteLoading) setConfirmTarget(null); }}
          loading={deleteLoading}
        />
      )}

      {/* Force-delete warning modal (has reservations) */}
      {forceTarget && (
        <ForceDeleteModal
          passenger={forceTarget.passenger}
          reservationCount={forceTarget.reservationCount}
          onConfirm={handleForceDelete}
          onCancel={() => { if (!deleteLoading) setForceTarget(null); }}
          loading={deleteLoading}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid #c8d8e4", paddingBottom: "0.75rem" }}>
        <div>
          <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", margin: 0 }}>Passenger Management</h1>
          <p style={{ color: "#547A95", fontSize: "0.85rem", marginTop: "0.2rem" }}>Register, edit, and manage passenger records.</p>
        </div>
        {(isStaff || isAdmin) && (
          <button
            onClick={() => handleOpenForm()}
            style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "4px", padding: "0.45rem 1rem", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}
          >
            + Register Passenger
          </button>
        )}
      </div>

      {/* Registration / Edit form */}
      {isFormOpen && (
        <div style={{ border: "1px solid #b8c8d4", background: "#f0f5f8", padding: "1.25rem", marginBottom: "1.5rem", borderRadius: "4px" }}>
          <h2 style={{ color: "#2C3947", fontWeight: "bold", marginBottom: "1rem" }}>{editingId ? "Edit" : "Register"} Passenger</h2>
          {formMsg && (
            <div style={{ background: formMsg.type === "success" ? "#dcfce7" : "#fee2e2", border: `1px solid ${formMsg.type === "success" ? "#86efac" : "#fca5a5"}`, borderRadius: "4px", padding: "0.6rem 0.85rem", marginBottom: "1rem", color: formMsg.type === "success" ? "#166534" : "#991b1b", fontWeight: "600", fontSize: "0.88rem" }}>
              {formMsg.text}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Full Name <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g. Mohammed Al-Harbi" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Phone Number <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="text" required value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+966 5X XXX XXXX" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>National ID Number <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="text" required value={formData.identificationNumber} onChange={e => setFormData({ ...formData, identificationNumber: e.target.value })} placeholder="10-digit Saudi National ID" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
                <p style={{ color: "#7a95a8", fontSize: "0.78rem", marginTop: "3px" }}>Must be exactly 10 digits</p>
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Email (Optional)</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="example@email.com" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
              <button type="button" onClick={() => { setIsFormOpen(false); setFormMsg(null); }} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "3px", padding: "0.45rem 1.1rem", fontWeight: "600", cursor: "pointer" }}>
                {editingId ? "Update Passenger" : "Save Passenger"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <Input
          type="text"
          placeholder="Search by name, phone, or ID number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: "420px", borderColor: "#b8c8d4", borderRadius: "3px" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#2C3947", color: "#fff" }}>
              {["ID", "Full Name", "Phone", "National ID", "Email", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.65rem 0.85rem", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.passengerId} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{p.passengerId}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947", fontWeight: "500" }}>{p.fullName}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{p.phoneNumber}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{p.identificationNumber}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{p.email || "—"}</td>
                <td style={{ padding: "0.55rem 0.85rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {/* Edit — staff and admin */}
                    {(isStaff || isAdmin) && (
                      <button
                        onClick={() => handleOpenForm(p)}
                        style={{ background: "#e8f0f5", border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.2rem 0.65rem", color: "#2C3947", cursor: "pointer", fontSize: "0.82rem" }}
                      >
                        Edit
                      </button>
                    )}
                    {/* Delete — staff and admin */}
                    {(isStaff || isAdmin) && (
                      <button
                        onClick={() => setConfirmTarget({ passengerId: p.passengerId, fullName: p.fullName })}
                        style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "3px", padding: "0.2rem 0.65rem", color: "#991b1b", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "#7a95a8" }}>
                {searchTerm ? "No passengers match your search." : "No passengers found."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {searchTerm && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#7a95a8" }}>
          Showing {filtered.length} of {passengers?.length ?? 0} passengers
        </p>
      )}
    </div>
  );
}
