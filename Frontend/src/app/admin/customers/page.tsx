"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  uploadUserAvatar,
} from "@/lib/api/users";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { UserDto, UserRole } from "@/lib/api/types";
import { Badge, Toggle, Toast, useConfirmDialog, useToast } from "@/components/admin/ui";
import { PasswordStrengthMeter, passwordMeetsPolicy } from "@/components/auth/PasswordStrengthMeter";

const ROLES: UserRole[] = ["USER", "EDITOR", "ADMIN"];
const ROLE_TONE: Record<UserRole, string> = { ADMIN: "purple", EDITOR: "blue", USER: "slate" };
const FILTERS: Array<UserRole | "all"> = ["all", ...ROLES];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

interface Draft {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
}

const BLANK: Draft = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "USER",
  isActive: true,
};

function mapUser(u: UserDto): Draft {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber ?? "",
    password: "",
    role: u.role,
    isActive: u.isActive,
    avatarUrl: u.avatarUrl,
  };
}

export default function CustomersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers({ limit: 100 });
      setUsers(res.data);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: users.length };
    for (const r of ROLES) m[r] = users.filter((u) => u.role === r).length;
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (!q ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phoneNumber ?? "").toLowerCase().includes(q)),
    );
  }, [users, roleFilter, query]);

  async function toggleActive(u: UserDto, v: boolean) {
    const prev = users;
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, isActive: v } : x)));
    try {
      const res = await updateUser(u.id, { isActive: v });
      setUsers((list) => list.map((x) => (x.id === u.id ? res.data : x)));
      showToast(v ? `${u.firstName} activated` : `${u.firstName} deactivated`);
    } catch (err) {
      setUsers(prev);
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  async function remove(u: UserDto) {
    if (me && u.id === me.id) {
      showToast("You can't delete your own account.");
      return;
    }
    if (
      !(await confirm({
        message: `Delete ${u.firstName} ${u.lastName}? This cannot be undone.`,
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      showToast(`${u.firstName} ${u.lastName} deleted`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  async function save(d: Draft) {
    setSaving(true);
    try {
      if (d.id) {
        const res = await updateUser(d.id, {
          firstName: d.firstName,
          lastName: d.lastName,
          phoneNumber: d.phoneNumber || undefined,
          role: d.role,
          isActive: d.isActive,
        });
        setUsers((prev) => prev.map((u) => (u.id === d.id ? res.data : u)));
        showToast(`${d.firstName} ${d.lastName} updated`);
      } else {
        const res = await createUser({
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          phoneNumber: d.phoneNumber || undefined,
          password: d.password,
          role: d.role,
        });
        setUsers((prev) => [res.data, ...prev]);
        showToast(`${d.firstName} ${d.lastName} created`);
      }
      setEditing(null);
    } catch (err) {
      if (err instanceof ApiError && err.errors.length > 0) {
        showToast(err.errors.map((e) => e.message).join(" "));
      } else {
        showToast(err instanceof ApiError ? err.message : formatAuthError(err));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(userId: string, file: File) {
    try {
      const res = await uploadUserAvatar(userId, file);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
      setEditing((e) => (e && e.id === userId ? { ...e, avatarUrl: res.data.avatarUrl } : e));
      showToast("Avatar updated");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Customers & Users</h2>
          <p>Loaded from the Trendgrid API. Manage customer accounts, staff and roles.</p>
        </div>
        <div className="adm-head-actions">
          <input className="adm-search" placeholder="Search name, email or phone…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="adm-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
          <button className="adm-btn adm-btn-primary" onClick={() => setEditing({ ...BLANK })} disabled={loading}>
            + Add user
          </button>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat"><div className="adm-stat-label">Total users</div><div className="adm-stat-value">{users.length}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Customers</div><div className="adm-stat-value">{counts.USER ?? 0}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Staff</div><div className="adm-stat-value">{(counts.ADMIN ?? 0) + (counts.EDITOR ?? 0)}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Active</div><div className="adm-stat-value">{users.filter((u) => u.isActive).length}</div></div>
      </div>

      <div className="adm-pills">
        {FILTERS.map((f) => (
          <button key={f} className={`adm-pill${roleFilter === f ? " is-active" : ""}`} onClick={() => setRoleFilter(f)}>
            {f === "all" ? "All" : f} <span className="adm-pill-count">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="adm-card">
          <div className="adm-empty">Loading users from API…</div>
        </div>
      )}

      {!loading && error && (
        <div className="adm-card">
          <div className="adm-login-error" style={{ margin: 16 }} role="alert">{error}</div>
          <div style={{ padding: "0 16px 16px" }}>
            <button className="adm-btn adm-btn-primary" onClick={() => void load()}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>User</th><th>Phone</th><th>Role</th><th>Joined</th><th>Active</th><th style={{ textAlign: "right" }}>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="adm-cell-flex">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt={`${u.firstName} ${u.lastName}`} className="adm-avatar" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div className="adm-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{initials(u.firstName, u.lastName)}</div>
                        )}
                        <div>
                          <div className="adm-cell-main">{u.firstName} {u.lastName}{me && u.id === me.id ? " (you)" : ""}</div>
                          <div className="adm-cell-sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="adm-cell-sub">{u.phoneNumber || "—"}</td>
                    <td><Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge></td>
                    <td className="adm-cell-sub">{fmtDate(u.createdAt)}</td>
                    <td><Toggle checked={u.isActive} onChange={(v) => void toggleActive(u, v)} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button className="adm-btn adm-btn-sm" onClick={() => setEditing(mapUser(u))}>Edit</button>
                        <button
                          className="adm-btn adm-btn-sm adm-btn-danger"
                          onClick={() => void remove(u)}
                          disabled={Boolean(me && u.id === me.id)}
                          title={me && u.id === me.id ? "You can't delete your own account" : undefined}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6}><div className="adm-empty">No users match.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <UserModal
          draft={editing}
          saving={saving}
          onClose={() => !saving && setEditing(null)}
          onSave={(d) => void save(d)}
          onUploadAvatar={(file) => void handleAvatarUpload(editing.id, file)}
        />
      )}
      <Toast msg={toast} />
      {dialog}
    </>
  );
}

function UserModal({
  draft,
  saving,
  onClose,
  onSave,
  onUploadAvatar,
}: {
  draft: Draft;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
  onUploadAvatar: (file: File) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const isNew = !draft.id;
  const passwordOk = !isNew || passwordMeetsPolicy(d.password);

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{isNew ? "Add user" : `Edit · ${draft.firstName} ${draft.lastName}`}</h3>
          <button className="adm-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="adm-modal-body">
          {!isNew && (
            <div className="adm-field">
              <label>Avatar</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {d.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="adm-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>{initials(d.firstName, d.lastName)}</div>
                )}
                <input
                  className="adm-input"
                  type="file"
                  accept="image/*"
                  style={{ fontSize: 12 }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) onUploadAvatar(file);
                  }}
                />
              </div>
            </div>
          )}
          <div className="adm-form-row">
            <div className="adm-field"><label>First name</label><input className="adm-input" value={d.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
            <div className="adm-field"><label>Last name</label><input className="adm-input" value={d.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
          </div>
          <div className="adm-field">
            <label>Email</label>
            <input className="adm-input" type="email" value={d.email} readOnly={!isNew} disabled={!isNew} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
            {!isNew && <span className="adm-hint">Email can&apos;t be changed after account creation.</span>}
          </div>
          <div className="adm-form-row">
            <div className="adm-field"><label>Phone</label><input className="adm-input" value={d.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="Optional" /></div>
            <div className="adm-field">
              <label>Role</label>
              <select className="adm-select" value={d.role} onChange={(e) => set("role", e.target.value as UserRole)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {isNew && (
            <div className="adm-field">
              <label>Password</label>
              <input className="adm-input" type="password" value={d.password} onChange={(e) => set("password", e.target.value)} placeholder="8+ chars: upper, lower, number, symbol" />
              <PasswordStrengthMeter password={d.password} />
            </div>
          )}
          <div className="adm-switchrow">
            <div className="adm-switchrow-info"><strong>Active</strong><span>Inactive users can&apos;t sign in</span></div>
            <Toggle checked={d.isActive} onChange={(v) => set("isActive", v)} />
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="adm-btn adm-btn-primary"
            disabled={!d.firstName.trim() || !d.lastName.trim() || (isNew && !d.email.trim()) || !passwordOk || saving}
            onClick={() => onSave(d)}
          >
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
