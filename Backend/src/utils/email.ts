/**
 * Outbound transactional email (forgot-password links, security notices).
 *
 * Pluggable, same pattern as utils/captcha.ts: no-ops (logs the message
 * instead of sending) when SMTP_HOST is unset, so local dev/coursework
 * grading isn't blocked on having a real mailbox. Set SMTP_HOST/PORT/USER/PASS
 * to actually deliver mail via any standard SMTP provider (Gmail app
 * password, Mailtrap, SES SMTP, etc.).
 */
import nodemailer, { Transporter } from 'nodemailer';

import { env } from '../config/env';
import { logger } from './logger';

export const isEmailEnabled = (): boolean => Boolean(env.email.smtpHost);

let cachedTransport: Transporter | null = null;

const getTransport = (): Transporter => {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpSecure,
    auth: env.email.smtpUser ? { user: env.email.smtpUser, pass: env.email.smtpPass } : undefined,
  });
  return cachedTransport;
};

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Sends an email if SMTP is configured; otherwise logs it (dev-safe no-op). */
export const sendEmail = async (input: SendEmailInput): Promise<void> => {
  if (!isEmailEnabled()) {
    logger.warn(
      `EMAIL (SMTP_HOST unset — not sent) to=${input.to} subject="${input.subject}"\n${input.text}`,
    );
    return;
  }

  try {
    await getTransport().sendMail({
      from: env.email.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    logger.info(`Email sent to=${input.to} subject="${input.subject}"`);
  } catch (err) {
    // Never let a mail-provider outage surface as a 500 with a stack trace to
    // the client — the caller (e.g. forgot-password) already returns a
    // generic success response regardless, to avoid user enumeration.
    logger.error(`Failed to send email to=${input.to}: ${(err as Error).message}`);
  }
};
