// Schedule History Log page (Admin only)
// Shows a full audit log of every create / update / delete action on schedules.

import React, { useState, useEffect } from "react";

interface LogEntry {
  logId: number;
  scheduleId: number;
  trainName: string;
  action: "Created" | "Updated" | "Deleted";
  updatedBy: string;
  timestamp: string;
}

const actionColor = (action: string) => {
  if (action === "Created") return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
  if (action === "Updated") return { bg: "#e0f2fe", border: "#7dd3fc", text: "#0369a1" };
  return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
};

export default function ScheduleHistory() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedules/history")
      .then(r => r.json())
      .then(d => { setLogs(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "1rem", color: "#2C3947" }}>Loading history...</div>;

  return (
    <div>
      <div style={{ marginBottom: "1.25rem", borderBottom: "1px solid #c8d8e4", paddingBottom: "0.75rem" }}>
        <h1 style={{ color: "#2C3947", fontSize: "1.4rem", fontWeight: "bold", margin: 0 }}>Schedule History Log</h1>
        <p style={{ color: "#547A95", fontSize: "0.88rem", marginTop: "0.25rem" }}>
          Full audit trail of all schedule changes (newest first).
        </p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #b8c8d4", borderRadius: "4px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#2C3947", color: "#fff" }}>
              {["Log ID", "Schedule ID", "Train Name", "Action", "Updated By", "Date / Time"].map(h => (
                <th key={h} style={{ padding: "0.65rem 0.85rem", textAlign: "left", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const colors = actionColor(log.action);
              return (
                <tr key={log.logId} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff", borderBottom: "1px solid #dde8ef" }}>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#7a95a8" }}>#{log.logId}</td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>#{log.scheduleId}</td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947", fontWeight: "500" }}>{log.trainName}</td>
                  <td style={{ padding: "0.55rem 0.85rem" }}>
                    <span style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "3px", padding: "0.15rem 0.5rem", fontWeight: "700", fontSize: "0.82rem" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#2C3947" }}>{log.updatedBy}</td>
                  <td style={{ padding: "0.55rem 0.85rem", color: "#547A95", fontSize: "0.85rem" }}>{log.timestamp}</td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "#7a95a8" }}>No history records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
