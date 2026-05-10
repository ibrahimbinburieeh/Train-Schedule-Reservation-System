import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

interface SystemUser {
  userId: number;
  name: string;
  email: string;
  role: string;
}

function roleLabel(role: string): string {
  if (role === "super_administrator") return "Super Administrator";
  if (role === "admin") return "Administrator";
  return "Staff";
}

function roleBadgeStyle(role: string): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: "3px", padding: "0.15rem 0.5rem", fontSize: "0.78rem",
    fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  };
  if (role === "super_administrator") return { ...base, background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" };
  if (role === "admin") return { ...base, background: "#eff6ff", border: "1px solid #93c5fd", color: "#1e3a5f" };
  return { ...base, background: "#e8f0f5", border: "1px solid #b8c8d4", color: "#2C3947" };
}

function DeleteUserModal({ userName, onConfirm, onCancel }: {
  userName: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(44,57,71,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "6px", padding: "1.75rem", maxWidth: "400px", width: "90%" }}>
        <h3 style={{ color: "#2C3947", fontWeight: "bold", marginBottom: "0.5rem" }}>Delete User</h3>
        <p style={{ color: "#4a6070", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Are you sure you want to delete this user?</p>
        <p style={{ color: "#991b1b", fontWeight: "600", fontSize: "0.88rem", marginBottom: "1.25rem" }}>{userName}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: "#991b1b", color: "#fff", border: "none", borderRadius: "4px", padding: "0.45rem 1rem", fontWeight: "600", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, onSave, onCancel }: {
  user: SystemUser;
  onSave: (id: number, data: { name: string; email: string; password: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setLoading(true);
    try {
      await onSave(user.userId, { name: name.trim(), email: email.trim(), password: password.trim() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(44,57,71,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "6px", padding: "1.75rem", maxWidth: "460px", width: "90%" }}>
        <h3 style={{ color: "#2C3947", fontWeight: "bold", marginBottom: "0.25rem" }}>Edit User</h3>
        <p style={{ color: "#547A95", fontSize: "0.85rem", marginBottom: "1.25rem" }}>{user.name}</p>
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "4px", padding: "0.6rem 0.85rem", marginBottom: "1rem", color: "#991b1b", fontWeight: "600", fontSize: "0.88rem" }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", fontSize: "0.88rem", marginBottom: "4px" }}>Full Name <span style={{ color: "#991b1b" }}>*</span></label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", fontSize: "0.88rem", marginBottom: "4px" }}>Email <span style={{ color: "#991b1b" }}>*</span></label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@train.com" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", fontSize: "0.88rem", marginBottom: "4px" }}>New Password <span style={{ color: "#7a95a8", fontWeight: "400" }}>(leave blank to keep current)</span></label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={onCancel} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", padding: "0.45rem 1rem", color: "#2C3947", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "4px", padding: "0.45rem 1.1rem", fontWeight: "600", cursor: "pointer" }}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_administrator";
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<string>("staff");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [editInfoTarget, setEditInfoTarget] = useState<SystemUser | null>(null);

  const authHeader = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token") || ""}`,
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users", { headers: authHeader() });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newUser.name || !newUser.email || !newUser.password) {
      setFormError("Please fill all required fields.");
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || "Failed to create user."); return; }
    setShowForm(false);
    setNewUser({ name: "", email: "", password: "", role: "staff" });
    await fetchUsers();
    showToast("User created successfully.");
  };

  const handleSaveRole = async (userId: number) => {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify({ role: editingRole }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Failed to update role.", "error"); return; }
    setEditingId(null);
    await fetchUsers();
    showToast("Role updated successfully.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/users/${deleteTarget.id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Failed to delete user.", "error"); setDeleteTarget(null); return; }
    setDeleteTarget(null);
    await fetchUsers();
    showToast("User deleted successfully.");
  };

  const handleEditInfo = async (userId: number, data: { name: string; email: string; password: string }) => {
    const body: Record<string, string> = { name: data.name, email: data.email };
    if (data.password) body["password"] = data.password;
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to save changes.");
    setEditInfoTarget(null);
    await fetchUsers();
    showToast("User updated successfully.");
  };

  const canEditUser = (u: SystemUser) => {
    if (u.role === "super_administrator") return false;
    if (isSuperAdmin) return true;
    return false;
  };

  const canEditInfo = (u: SystemUser) => {
    if (u.role === "super_administrator") return false;
    if (isSuperAdmin) return true;
    if (isAdmin && u.role === "staff") return true;
    return false;
  };

  const canDeleteUser = (u: SystemUser) => {
    if (u.role === "super_administrator") return false;
    if (isSuperAdmin) return true;
    if (isAdmin && u.role === "staff") return true;
    return false;
  };

  if (loading) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading users...</div>;

  return (
    <div>
      {deleteTarget && <DeleteUserModal userName={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {editInfoTarget && <EditUserModal user={editInfoTarget} onSave={handleEditInfo} onCancel={() => setEditInfoTarget(null)} />}

      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", borderRadius: "4px",
          padding: "0.75rem 1.25rem", fontWeight: "600", zIndex: 900,
          background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          color: toast.type === "error" ? "#991b1b" : "#166534",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid #c8d8e4", paddingBottom: "0.75rem" }}>
        <div>
          <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", margin: 0 }}>User Management</h1>
          <p style={{ color: "#547A95", fontSize: "0.88rem", marginTop: "0.2rem" }}>
            {isSuperAdmin ? "Manage all system user accounts and roles." : "Manage Staff accounts."}
          </p>
        </div>
        {(isSuperAdmin || isAdmin) && (
          <button
            onClick={() => { setShowForm(!showForm); setFormError(null); setNewUser({ name: "", email: "", password: "", role: "staff" }); }}
            style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "4px", padding: "0.45rem 1rem", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}
          >
            {showForm ? "Cancel" : (isSuperAdmin ? "+ Add User" : "+ Add Staff")}
          </button>
        )}
      </div>

      {isAdmin && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px", padding: "0.65rem 1rem", marginBottom: "1.25rem", color: "#1e3a5f", fontSize: "0.88rem" }}>
          Administrators can view all accounts, but can only add or delete <strong>Staff</strong> accounts.
        </div>
      )}

      {showForm && (
        <div style={{ border: "1px solid #b8c8d4", background: "#f0f5f8", padding: "1.25rem", marginBottom: "1.5rem", borderRadius: "4px" }}>
          <h2 style={{ color: "#2C3947", fontWeight: "bold", marginBottom: "1rem" }}>
            {isSuperAdmin ? "Add New User" : "Add New Staff Member"}
          </h2>
          {formError && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "4px", padding: "0.6rem 0.85rem", marginBottom: "1rem", color: "#991b1b", fontWeight: "600", fontSize: "0.88rem" }}>
              {formError}
            </div>
          )}
          <form onSubmit={handleAddUser}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Full Name <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full Name" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Email <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@train.com" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              <div>
                <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Password <span style={{ color: "#991b1b" }}>*</span></Label>
                <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" style={{ borderColor: "#b8c8d4", borderRadius: "3px" }} />
              </div>
              {isSuperAdmin && (
                <div>
                  <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Role <span style={{ color: "#991b1b" }}>*</span></Label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ width: "100%", border: "1px solid #b8c8d4", background: "#fff", padding: "0.45rem", color: "#2C3947", borderRadius: "3px" }}>
                    <option value="admin">Administrator</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              )}
              {isAdmin && (
                <div>
                  <Label style={{ fontWeight: "600", color: "#2C3947", display: "block", marginBottom: "4px" }}>Role</Label>
                  <div style={{ border: "1px solid #b8c8d4", background: "#f8fafc", padding: "0.45rem", color: "#547A95", borderRadius: "3px", fontSize: "0.9rem" }}>
                    Staff (fixed)
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="submit" style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "3px", padding: "0.45rem 1.1rem", fontWeight: "600", cursor: "pointer" }}>
                Save User
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#2C3947", color: "#fff" }}>
              {["ID", "Name", "Email", "Role", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.65rem 0.85rem", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.userId} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{u.userId}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947", fontWeight: "500" }}>{u.name}</td>
                <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{u.email}</td>
                <td style={{ padding: "0.55rem 0.85rem" }}>
                  {editingId === u.userId ? (
                    <select value={editingRole} onChange={e => setEditingRole(e.target.value)}
                      style={{ border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.2rem 0.4rem", color: "#2C3947", background: "#fff" }}>
                      <option value="admin">Administrator</option>
                      <option value="staff">Staff</option>
                    </select>
                  ) : (
                    <span style={roleBadgeStyle(u.role)}>{roleLabel(u.role)}</span>
                  )}
                </td>
                <td style={{ padding: "0.55rem 0.85rem" }}>
                  {u.role === "super_administrator" ? (
                    <span style={{ color: "#92400e", fontSize: "0.8rem", fontStyle: "italic" }}>Protected</span>
                  ) : isAdmin && u.role === "admin" ? (
                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>View only</span>
                  ) : (
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {editingId === u.userId ? (
                        <>
                          <button onClick={() => handleSaveRole(u.userId)} style={{ background: "#547A95", color: "#fff", border: "1px solid #3f6278", borderRadius: "3px", padding: "0.2rem 0.65rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" }}>Save</button>
                          <button onClick={() => setEditingId(null)} style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.2rem 0.65rem", color: "#2C3947", cursor: "pointer", fontSize: "0.82rem" }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {canEditInfo(u) && (
                            <button onClick={() => setEditInfoTarget(u)}
                              style={{ background: "#e8f0f5", border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.2rem 0.65rem", color: "#2C3947", cursor: "pointer", fontSize: "0.82rem" }}>
                              Edit
                            </button>
                          )}
                          {canEditUser(u) && (
                            <button onClick={() => { setEditingId(u.userId); setEditingRole(u.role); }}
                              style={{ background: "#e8f0f5", border: "1px solid #b8c8d4", borderRadius: "3px", padding: "0.2rem 0.65rem", color: "#2C3947", cursor: "pointer", fontSize: "0.82rem" }}>
                              Edit Role
                            </button>
                          )}
                          {canDeleteUser(u) && (
                            <button onClick={() => setDeleteTarget({ id: u.userId, name: u.name })}
                              style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "3px", padding: "0.2rem 0.65rem", color: "#991b1b", cursor: "pointer", fontSize: "0.82rem" }}>
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "#7a95a8" }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
