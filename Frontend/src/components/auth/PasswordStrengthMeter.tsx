"use client";

/**
 * Single source of truth for password-complexity feedback, used by
 * register, reset-password, and change-password. Must stay in sync with the
 * backend's Zod policy (Backend/src/features/auth/validator/index.ts and
 * user/validator/index.ts) — previously each form had its own drifted copy
 * of this list (some missing the lowercase/special-character rules), so a
 * password that looked "done" client-side could still be rejected server-side.
 */
export const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[a-z]/.test(v), label: "One lowercase letter" },
  { test: (v: string) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v: string) => /\d/.test(v), label: "One number" },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), label: "One special character" },
] as const;

export const passwordMeetsPolicy = (password: string): boolean =>
  PASSWORD_RULES.every((rule) => rule.test(password));

const LEVELS = [
  { label: "Very weak", color: "#dc2626" },
  { label: "Weak", color: "#ea580c" },
  { label: "Fair", color: "#d97706" },
  { label: "Good", color: "#65a30d" },
  { label: "Strong", color: "#16a34a" },
] as const;

/** Live strength bar + checklist. Renders nothing for an empty password so
 *  it doesn't clutter a fresh, untouched form. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const passedCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const level = LEVELS[Math.max(0, passedCount - 1)];

  return (
    <div style={{ marginTop: 8 }} aria-live="polite">
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {LEVELS.map((_, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              height: 4,
              flex: 1,
              borderRadius: 2,
              background: i < passedCount ? level.color : "#e5e7eb",
              transition: "background 150ms ease",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: level.color, margin: "0 0 4px" }}>
        {level.label}
      </p>
      <ul
        aria-label="Password requirements"
        style={{
          listStyle: "none", margin: 0, padding: 0,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px",
        }}
      >
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.label}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: met ? "#166534" : "var(--nx-muted, #6b7280)" }}
            >
              <span aria-hidden>{met ? "✓" : "○"}</span>
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
