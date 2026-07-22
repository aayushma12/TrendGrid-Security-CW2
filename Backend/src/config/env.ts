
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const bool = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0', 'yes', 'no'])])
  .transform((v) => (typeof v === 'boolean' ? v : /^(true|1|yes)$/i.test(v)));

/**
 * Optional URL env var. A present-but-empty line in .env (e.g. `FOO_URL=`)
 * comes through as `''`, which `.url().optional()` rejects — `.optional()`
 * only tolerates `undefined`, not an empty string. Treat blank as unset.
 */
const optionalUrl = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().url().optional(),
);

const schema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  API_VERSION: z.string().default('1.0.0'),
  /** Publicly reachable base URL for this API — used for browser-redirect
   *  callbacks (e.g. eSewa success/failure URLs), which the frontend origin
   *  cannot serve directly since verification must happen server-side. */
  API_BASE_URL: z.string().default('http://localhost:5000'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).optional(),

  // Database
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid Postgres URL' }),
  DB_POOL_MIN: z.coerce.number().int().min(0).default(2),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),

  // Auth
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('30m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  // Account lockout / brute-force protection
  ACCOUNT_LOCKOUT_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  ACCOUNT_LOCKOUT_DURATION_MIN: z.coerce.number().int().min(1).default(15),

  // Password policy
  PASSWORD_MAX_AGE_DAYS: z.coerce.number().int().min(0).default(90),
  PASSWORD_HISTORY_COUNT: z.coerce.number().int().min(0).default(5),
  PASSWORD_RESET_TOKEN_TTL_MIN: z.coerce.number().int().min(1).default(30),

  // Email verification (registration)
  EMAIL_VERIFICATION_TOKEN_TTL_MIN: z.coerce.number().int().min(1).default(1440),

  // Outbound email (forgot-password, security notices). Sending no-ops (logs
  // only) when SMTP_HOST is unset, so local dev isn't blocked — see utils/email.ts.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: bool.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('NDH Trendgrid <no-reply@trendgrid.local>'),
  // Public frontend origin the reset-password link points to.
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // MFA (TOTP)
  MFA_ISSUER: z.string().default('NDH Trendgrid'),

  // Field-level encryption at rest (AES-256-GCM). Required in production.
  ENCRYPTION_KEY: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 32, 'ENCRYPTION_KEY must be at least 32 chars'),

  // CAPTCHA (hCaptcha or reCAPTCHA v2/v3). Verification is skipped when unset.
  CAPTCHA_PROVIDER: z.enum(['none', 'hcaptcha', 'recaptcha']).default('none'),
  CAPTCHA_SECRET: z.string().optional(),

  // IP allow / block lists — comma-separated IPs or CIDR ranges.
  IP_ALLOWLIST: z.string().default(''),
  IP_BLOCKLIST: z.string().default(''),

  // Real-time security alerting — generic incoming webhook (Slack-compatible payload).
  SECURITY_ALERT_WEBHOOK_URL: optionalUrl,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('fashion-store'),
  CLOUDINARY_ALLOWED_FORMATS: z.string().default('jpg,jpeg,png,webp'),
  CLOUDINARY_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),

  // Pagination
  DEFAULT_PAGE_SIZE: z.coerce.number().int().positive().default(10),
  MAX_PAGE_SIZE: z.coerce.number().int().positive().default(100),



  // Commerce
  TAX_RATE: z.coerce.number().nonnegative().max(1).default(0.13),
  SHIPPING_FLAT_RATE: z.coerce.number().nonnegative().default(150),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().nonnegative().default(5000),
  DEFAULT_COMMERCE_CURRENCY: z.string().length(3).toUpperCase().default('NPR'),

  // eSewa payment gateway (Nepal). Defaults are eSewa's own publicly documented
  // UAT/sandbox test merchant — safe to ship as-is for non-production use; set
  // real values via env for production.
  ESEWA_MERCHANT_CODE: z.string().default('EPAYTEST'),
  ESEWA_SECRET_KEY: z.string().default('8gBm/:&EnhH.1/q'),
  ESEWA_PAYMENT_URL: z.string().default('https://rc-epay.esewa.com.np/api/epay/main/v2/form'),
  ESEWA_STATUS_CHECK_URL: z.string().default('https://rc.esewa.com.np/api/epay/transaction/status/'),

  // Swagger
  SWAGGER_ENABLED: bool.default(true),
  SWAGGER_PATH: z.string().default('/docs'),
  // Public base URL Swagger UI should target for "Try it out" requests
  // (e.g. https://api.trendgrid.com). Left unset, Swagger UI falls back to
  // a server entry that's relative to whatever origin served the docs page,
  // which works correctly behind any domain/proxy without configuration.
  SWAGGER_PUBLIC_URL: optionalUrl,

  // Outbound proxy
  OUTBOUND_PROXY_ENABLED: bool.default(false),
  OUTBOUND_PROXY_URL: optionalUrl,
  OUTBOUND_PROXY_USER: z.string().optional(),
  OUTBOUND_PROXY_PASS: z.string().optional(),
  OUTBOUND_NO_PROXY: z.string().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('\n❌ Invalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  }
  // eslint-disable-next-line no-console
  console.error('\nFix your .env file and restart.\n');
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  apiPrefix: raw.API_PREFIX,
  apiVersion: raw.API_VERSION,
  // Cookies + `credentials: true` CORS can't pair with a wildcard origin —
  // browsers reject `Access-Control-Allow-Origin: *` alongside credentialed
  // requests. Fall back to FRONTEND_URL unless CORS_ORIGIN is explicitly set
  // to something else.
  corsOrigin: raw.CORS_ORIGIN === '*' ? raw.FRONTEND_URL : raw.CORS_ORIGIN,
  logLevel: raw.LOG_LEVEL,
  trustProxyHops: raw.TRUST_PROXY_HOPS,

  db: {
    url: raw.DATABASE_URL,
    poolMin: raw.DB_POOL_MIN,
    poolMax: raw.DB_POOL_MAX,
  },

  jwt: {
    secret: raw.JWT_SECRET,
    expiresIn: raw.JWT_EXPIRES_IN,
    refreshSecret: raw.JWT_REFRESH_SECRET,
    refreshExpiresIn: raw.JWT_REFRESH_EXPIRES_IN,
    saltRounds: raw.BCRYPT_SALT_ROUNDS,
  },

  security: {
    lockoutMaxAttempts: raw.ACCOUNT_LOCKOUT_MAX_ATTEMPTS,
    lockoutDurationMin: raw.ACCOUNT_LOCKOUT_DURATION_MIN,
    passwordMaxAgeDays: raw.PASSWORD_MAX_AGE_DAYS,
    passwordHistoryCount: raw.PASSWORD_HISTORY_COUNT,
    passwordResetTokenTtlMin: raw.PASSWORD_RESET_TOKEN_TTL_MIN,
    emailVerificationTokenTtlMin: raw.EMAIL_VERIFICATION_TOKEN_TTL_MIN,
    mfaIssuer: raw.MFA_ISSUER,
    encryptionKey: raw.ENCRYPTION_KEY,
    captchaProvider: raw.CAPTCHA_PROVIDER,
    captchaSecret: raw.CAPTCHA_SECRET,
    ipAllowlist: raw.IP_ALLOWLIST.split(',').map((s) => s.trim()).filter(Boolean),
    ipBlocklist: raw.IP_BLOCKLIST.split(',').map((s) => s.trim()).filter(Boolean),
    alertWebhookUrl: raw.SECURITY_ALERT_WEBHOOK_URL,
  },

  email: {
    smtpHost: raw.SMTP_HOST,
    smtpPort: raw.SMTP_PORT,
    smtpSecure: raw.SMTP_SECURE,
    smtpUser: raw.SMTP_USER,
    smtpPass: raw.SMTP_PASS,
    from: raw.EMAIL_FROM,
  },

  frontendUrl: raw.FRONTEND_URL,
  apiBaseUrl: raw.API_BASE_URL,

  cloudinary: {
    cloudName: raw.CLOUDINARY_CLOUD_NAME,
    apiKey: raw.CLOUDINARY_API_KEY,
    apiSecret: raw.CLOUDINARY_API_SECRET,
    folder: raw.CLOUDINARY_UPLOAD_FOLDER,
    allowedFormats: raw.CLOUDINARY_ALLOWED_FORMATS.split(',').map((s) => s.trim().toLowerCase()),
    maxFileSizeMb: raw.CLOUDINARY_MAX_FILE_SIZE_MB,
  },

  pagination: {
    defaultPageSize: raw.DEFAULT_PAGE_SIZE,
    maxPageSize: raw.MAX_PAGE_SIZE,
  },



  commerce: {
    taxRate: raw.TAX_RATE,
    shippingFlatRate: raw.SHIPPING_FLAT_RATE,
    freeShippingThreshold: raw.FREE_SHIPPING_THRESHOLD,
    currency: raw.DEFAULT_COMMERCE_CURRENCY,
  },

  esewa: {
    merchantCode: raw.ESEWA_MERCHANT_CODE,
    secretKey: raw.ESEWA_SECRET_KEY,
    paymentUrl: raw.ESEWA_PAYMENT_URL,
    statusCheckUrl: raw.ESEWA_STATUS_CHECK_URL,
  },

  swagger: {
    enabled: raw.SWAGGER_ENABLED,
    path: raw.SWAGGER_PATH,
    publicUrl: raw.SWAGGER_PUBLIC_URL,
  },

  outboundProxy: {
    enabled: raw.OUTBOUND_PROXY_ENABLED,
    url: raw.OUTBOUND_PROXY_URL,
    user: raw.OUTBOUND_PROXY_USER,
    pass: raw.OUTBOUND_PROXY_PASS,
    noProxy: raw.OUTBOUND_NO_PROXY.split(',').map((s) => s.trim()).filter(Boolean),
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
export const isDevelopment = env.nodeEnv === 'development';
export const isTest = env.nodeEnv === 'test';

if (isProduction && !env.security.encryptionKey) {
  // eslint-disable-next-line no-console
  console.error(
    '\n ENCRYPTION_KEY is required in production (used to encrypt addresses & MFA secrets at rest).\n',
  );
  process.exit(1);
}

if (isProduction && env.security.captchaProvider === 'none') {
  // eslint-disable-next-line no-console
  console.warn(
    ' CAPTCHA is disabled (CAPTCHA_PROVIDER=none). Login/register are unprotected against automated abuse beyond rate limiting.',
  );
}

if (isProduction && !env.email.smtpHost) {
  // eslint-disable-next-line no-console
  console.warn(
    ' SMTP_HOST is unset — forgot-password emails will only be logged, never delivered, in production.',
  );
}
