/**
 * Real-time security alerting.
 *
 * Fires on suspicious/critical events (account lockouts, repeated auth
 * failures, rate-limit breaches, privilege changes). If SECURITY_ALERT_WEBHOOK_URL
 * is configured (Slack/Teams/PagerDuty-compatible incoming webhook), the event
 * is POSTed there in addition to being logged. With no webhook configured it
 * still lands in the structured logs at `warn`/`error` level so it's never lost.
 *
 * Never pass secrets (passwords, tokens, MFA codes) in `details`.
 */
import axios from 'axios';

import { env } from '../config/env';
import { logger } from './logger';

export type SecurityEventType =
  | 'account_locked'
  | 'login_failed'
  | 'rate_limit_exceeded'
  | 'mfa_failed'
  | 'ip_blocked'
  | 'role_escalation_attempt'
  | 'refresh_token_reuse';

export const sendSecurityAlert = (
  event: SecurityEventType,
  details: Record<string, unknown> = {},
): void => {
  logger.warn(`SECURITY_ALERT event=${event} ${JSON.stringify(details)}`);

  if (!env.security.alertWebhookUrl) return;

  const payload = {
    text: `:rotating_light: Security alert: *${event}*\n\`\`\`${JSON.stringify(
      { event, timestamp: new Date().toISOString(), ...details },
      null,
      2,
    )}\`\`\``,
  };

  axios.post(env.security.alertWebhookUrl, payload, { timeout: 5000 }).catch((err) => {
    logger.error(`Failed to deliver security alert webhook: ${(err as Error).message}`);
  });
};
