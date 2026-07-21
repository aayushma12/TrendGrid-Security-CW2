"use client";

import { useAuth } from "@/lib/auth-context";
import { MfaEnrollmentCard } from "@/components/auth/MfaEnrollmentCard";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LogoutAllButton } from "@/components/auth/LogoutAllButton";
import { PasswordExpiredBanner } from "@/components/auth/PasswordExpiredBanner";

/**
 * Self-service security settings for the signed-in staff member. Separate
 * from /profile, which is customer-only territory — CustomerAreaGuard and
 * proxy.ts now keep ADMIN/EDITOR sessions out of it entirely (see
 * the RBAC fix), so staff need their own place to manage MFA/password.
 */
export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Settings</h2>
          <p>Manage your own account security — {user?.email}.</p>
        </div>
      </div>

      <PasswordExpiredBanner onChangePassword={() => document.getElementById("adm-change-password")?.scrollIntoView({ behavior: "smooth" })} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <div id="adm-change-password">
          <ChangePasswordForm />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MfaEnrollmentCard />
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", background: "#fff" }}>
            <h3 style={{ margin: "0 0 6px" }}>Sessions</h3>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px" }}>
              Signed in somewhere you don&apos;t recognize? Sign out of every device at once.
            </p>
            <LogoutAllButton redirectTo="/admin/login" />
          </div>
        </div>
      </div>
    </>
  );
}
