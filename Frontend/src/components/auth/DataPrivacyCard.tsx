"use client";

import { useRef, useState } from "react";
import { exportMyData, importMyData, type UpdateOwnProfileInput } from "@/lib/api/users";
import { formatAuthError, useAuth } from "@/lib/auth-context";

const card: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", background: "#fff" };
const btnSecondary: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#111827",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const errorBox: React.CSSProperties = { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 13 };

/** Only these three fields are ever sent to /users/me/import — anything else
 *  in an uploaded file (id, email, role, orders, ...) is dropped here on the
 *  client for a friendly round-trip with the export file, AND independently
 *  rejected by the server's strict validator if someone skips the UI and
 *  posts directly. */
function extractSafeProfileFields(raw: unknown): UpdateOwnProfileInput {
  const src = (raw && typeof raw === "object" && "profile" in raw ? (raw as { profile: unknown }).profile : raw) as
    | Record<string, unknown>
    | null
    | undefined;
  if (!src || typeof src !== "object") return {};
  return {
    firstName: typeof src.firstName === "string" ? src.firstName : undefined,
    lastName: typeof src.lastName === "string" ? src.lastName : undefined,
    phoneNumber: typeof src.phoneNumber === "string" ? src.phoneNumber : undefined,
  };
}

/** GDPR-style "download my data" export + "restore profile backup" import. */
export function DataPrivacyCard() {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onExport() {
    setError(null);
    setSuccess(null);
    setExporting(true);
    try {
      const res = await exportMyData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trendgrid-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess("Your data export has downloaded.");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setExporting(false);
    }
  }

  function onImportClick() {
    setError(null);
    setSuccess(null);
    fileInputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setSuccess(null);
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON.");
      }
      const profile = extractSafeProfileFields(parsed);
      if (!profile.firstName && !profile.lastName && !profile.phoneNumber) {
        throw new Error("No recognizable profile fields (firstName/lastName/phoneNumber) found in that file.");
      }
      await importMyData(profile);
      await refreshUser();
      setSuccess("Profile restored from backup.");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 6px" }}>Your data</h3>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
        Download a copy of everything tied to your account, or restore your profile from a previous backup.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" style={btnSecondary} onClick={onExport} disabled={exporting}>
          {exporting ? "Preparing…" : "Download my data"}
        </button>
        <button type="button" style={btnSecondary} onClick={onImportClick} disabled={importing}>
          {importing ? "Restoring…" : "Restore profile backup"}
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={onFileSelected} />
      </div>
      {error && <div style={{ ...errorBox, marginTop: 12 }} role="alert">{error}</div>}
      {success && <div style={{ ...okBox, marginTop: 12 }} role="status">{success}</div>}
    </div>
  );
}
