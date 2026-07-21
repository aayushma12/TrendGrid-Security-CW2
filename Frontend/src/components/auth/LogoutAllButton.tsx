"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const btnDanger: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2",
  color: "#b91c1c", fontSize: 14, fontWeight: 600, cursor: "pointer",
};

/** "Log out everywhere" — revokes every session for this account, including the current one. */
export function LogoutAllButton({ redirectTo }: { redirectTo: string }) {
  const { logoutAllDevices } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    try {
      await logoutAllDevices();
    } finally {
      router.replace(redirectTo);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button type="button" style={btnDanger} onClick={handleClick} disabled={busy}>
        {busy ? "Signing out everywhere…" : confirming ? "Click again to confirm" : "Log out of all devices"}
      </button>
      {confirming && !busy && (
        <button type="button" style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      )}
    </div>
  );
}
