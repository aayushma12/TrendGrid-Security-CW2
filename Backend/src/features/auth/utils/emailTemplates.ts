/**
 * Password-reset email content. Kept plain (inline styles, table-free) since
 * this only needs to render correctly in a basic mail client / Mailtrap's
 * preview — no external assets, no tracking pixels, nothing that could leak
 * data or fail to load.
 */

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const buildResetEmailText = (firstName: string, resetUrl: string, ttlMinutes: number): string =>
  `Hi ${firstName},\n\n` +
  `We received a request to reset your TrendGrid password. Click the link below to choose a new one:\n\n` +
  `${resetUrl}\n\n` +
  `This link expires in ${ttlMinutes} minutes and can only be used once.\n\n` +
  `If you didn't request this, you can safely ignore this email — your password won't change.`;

export const buildMfaOtpEmailText = (firstName: string, code: string, ttlMinutes: number): string =>
  `Hi ${firstName},\n\n` +
  `Your TrendGrid sign-in verification code is:\n\n` +
  `${code}\n\n` +
  `This code expires in ${ttlMinutes} minutes and can only be used once.\n\n` +
  `If you didn't try to sign in, you can safely ignore this email.`;

export const buildMfaOtpEmailHtml = (firstName: string, code: string, ttlMinutes: number): string => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
                 style="background:#ffffff; border-radius:12px; padding:32px; max-width:480px; width:100%;">
            <tr><td style="font-size:18px; font-weight:700; color:#111827; padding-bottom:16px;">TrendGrid</td></tr>
            <tr><td style="font-size:15px; color:#111827; padding-bottom:8px;">Hi ${escapeHtml(firstName)},</td></tr>
            <tr>
              <td style="font-size:14px; color:#374151; line-height:1.6; padding-bottom:20px;">
                Your sign-in verification code is:
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="display:inline-block; background:#f4f4f5; color:#111827; letter-spacing:6px;
                             font-size:28px; font-weight:700; padding:14px 24px; border-radius:8px; font-family:monospace;">
                  ${escapeHtml(code)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px; color:#6b7280; line-height:1.6; padding-bottom:24px;">
                This code expires in <strong>${ttlMinutes} minutes</strong> and can only be used once.
              </td>
            </tr>
            <tr>
              <td style="font-size:12px; color:#9ca3af; line-height:1.6; border-top:1px solid #e5e7eb; padding-top:16px;">
                If you didn't try to sign in, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const buildResetEmailHtml = (firstName: string, resetUrl: string, ttlMinutes: number): string => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#f4f4f5; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
                 style="background:#ffffff; border-radius:12px; padding:32px; max-width:480px; width:100%;">
            <tr><td style="font-size:18px; font-weight:700; color:#111827; padding-bottom:16px;">TrendGrid</td></tr>
            <tr><td style="font-size:15px; color:#111827; padding-bottom:8px;">Hi ${escapeHtml(firstName)},</td></tr>
            <tr>
              <td style="font-size:14px; color:#374151; line-height:1.6; padding-bottom:24px;">
                We received a request to reset your password. Click the button below to choose a new one.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${resetUrl}"
                   style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none;
                          font-size:14px; font-weight:600; padding:12px 28px; border-radius:8px;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px; color:#6b7280; line-height:1.6; padding-bottom:8px;">
                Or paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#4f46e5; word-break:break-all;">${resetUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px; color:#6b7280; line-height:1.6; padding-bottom:24px;">
                This link expires in <strong>${ttlMinutes} minutes</strong> and can only be used once.
              </td>
            </tr>
            <tr>
              <td style="font-size:12px; color:#9ca3af; line-height:1.6; border-top:1px solid #e5e7eb; padding-top:16px;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
