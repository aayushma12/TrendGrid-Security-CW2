"use client";

import { FormEvent, useState } from "react";
import { updateOwnProfile } from "@/lib/api/users";
import { formatAuthError, useAuth } from "@/lib/auth-context";

const errorBox: React.CSSProperties = { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 13 };

/**
 * Self-service "edit my profile" — only firstName/lastName/phoneNumber are
 * ever sent (PATCH /users/me), which is itself allowlisted server-side to
 * those exact fields, so there's no way for this form to touch role/isActive/email.
 */
export function EditProfileForm() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setBusy(true);
    try {
      await updateOwnProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nx-form-card">
      <h3>Account Details</h3>
      <form onSubmit={onSubmit}>
        <div className="nx-form-grid">
          <div className="nx-field">
            <label htmlFor="profile-first">First name</label>
            <input
              id="profile-first"
              className="nx-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="nx-field">
            <label htmlFor="profile-last">Last name</label>
            <input
              id="profile-last"
              className="nx-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="nx-field is-full">
            <label>Email</label>
            <input className="nx-input" value={user.email} disabled />
          </div>
          <div className="nx-field is-full">
            <label htmlFor="profile-phone">Phone</label>
            <input
              id="profile-phone"
              className="nx-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Not set"
            />
          </div>
        </div>

        {error && <div style={{ ...errorBox, marginTop: 12 }} role="alert">{error}</div>}
        {success && <div style={{ ...okBox, marginTop: 12 }} role="status">Profile updated.</div>}

        <button type="submit" className="nx-btn nx-btn-dark" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
      <p className="nx-free-ship" style={{ marginTop: 12 }}>
        Email can&apos;t be changed here — contact support if you need to update it.
      </p>
    </div>
  );
}
