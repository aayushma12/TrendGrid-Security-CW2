import request from 'supertest';
import { authenticator } from 'otplib';

import * as emailUtil from '../src/utils/email';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';

const TEST_EMAIL_PREFIX = 'jest-auth-';
const uniqueEmail = () => `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

/** Pulls a single cookie's value out of a supertest response's Set-Cookie header. */
function cookieValue(setCookieHeader: string[] | undefined, name: string): string | undefined {
  const line = setCookieHeader?.find((c) => c.startsWith(`${name}=`));
  if (!line) return undefined;
  return line.split(';')[0].split('=').slice(1).join('=');
}

async function registerUser(overrides: Partial<{ email: string; password: string }> = {}) {
  const email = overrides.email ?? uniqueEmail();
  const password = overrides.password ?? 'CorrectHorse1!';
  const res = await request(app).post('/api/v1/auth/register').send({
    firstName: 'Jest',
    lastName: 'User',
    email,
    password,
  });
  return { res, email, password };
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
  await prisma.$disconnect();
});

describe('POST /auth/register', () => {
  it('creates the account and sets httpOnly session cookies', async () => {
    const { res } = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('USER');

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const accessLine = setCookie.find((c) => c.startsWith('access_token='));
    const refreshLine = setCookie.find((c) => c.startsWith('refresh_token='));
    const csrfLine = setCookie.find((c) => c.startsWith('csrf_token='));

    expect(accessLine).toMatch(/HttpOnly/i);
    expect(refreshLine).toMatch(/HttpOnly/i);
    // The CSRF cookie must be readable by frontend JS to be echoed back —
    // it's the one cookie that must NOT be httpOnly.
    expect(csrfLine).not.toMatch(/HttpOnly/i);
  });

  it('rejects a duplicate email', async () => {
    const { email, password } = await registerUser();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'Dup', lastName: 'User', email, password });
    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  it('rejects a wrong password with a generic message (no user enumeration)', async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TotallyWrong9' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('rejects an unknown email with the exact same message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: uniqueEmail(), password: 'WhoKnows1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('locks the account after repeated failed attempts (ACCOUNT_LOCKOUT_MAX_ATTEMPTS)', async () => {
    const { email, password } = await registerUser();

    for (let i = 0; i < env.security.lockoutMaxAttempts; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong-pass' });
      expect(res.status).toBe(401);
    }

    // Even the CORRECT password is now rejected — that's the lockout.
    const lockedRes = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(lockedRes.status).toBe(401);
    expect(lockedRes.body.message).toMatch(/locked/i);
  });
});

describe('cookie session + CSRF', () => {
  it('allows a protected route via the cookie alone, blocks mutations without the CSRF header, allows them with it', async () => {
    const agent = request.agent(app);
    const { email, password } = await registerUser();
    const loginRes = await agent.post('/api/v1/auth/login').send({ email, password });
    const userId = loginRes.body.data.user.id as string;
    const csrfToken = cookieValue(loginRes.headers['set-cookie'] as unknown as string[], 'csrf_token');
    expect(csrfToken).toBeTruthy();

    // GET via the agent's stored cookies only — no Authorization header sent.
    const meRes = await agent.get(`/api/v1/users/${userId}`);
    expect(meRes.status).toBe(200);

    // Mutating request, cookie present, no CSRF header -> blocked.
    const noCsrfRes = await agent.post('/api/v1/auth/logout-all').send();
    expect(noCsrfRes.status).toBe(403);

    // Same request with the matching header -> allowed.
    const withCsrfRes = await agent.post('/api/v1/auth/logout-all').set('X-CSRF-Token', csrfToken!).send();
    expect(withCsrfRes.status).toBe(200);
  });
});

describe('forgot-password / reset-password', () => {
  it('always returns the same generic response whether or not the email is registered', async () => {
    const known = await registerUser();
    const sendEmailSpy = jest.spyOn(emailUtil, 'sendEmail').mockResolvedValue(undefined);

    const forKnown = await request(app).post('/api/v1/auth/forgot-password').send({ email: known.email });
    const forUnknown = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: uniqueEmail() });

    expect(forKnown.status).toBe(200);
    expect(forUnknown.status).toBe(200);
    expect(forKnown.body.message).toBe(forUnknown.body.message);
    // Only the real account actually triggers an email send.
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);

    sendEmailSpy.mockRestore();
  });

  it('resets the password with the emailed token, rejects reuse of the token, and revokes the old session', async () => {
    const { email, password: oldPassword } = await registerUser();
    const agent = request.agent(app);
    const loginRes = await agent.post('/api/v1/auth/login').send({ email, password: oldPassword });
    const oldRefreshCookie = cookieValue(loginRes.headers['set-cookie'] as unknown as string[], 'refresh_token');

    const sendEmailSpy = jest.spyOn(emailUtil, 'sendEmail').mockResolvedValue(undefined);
    await request(app).post('/api/v1/auth/forgot-password').send({ email });

    const emailBody = sendEmailSpy.mock.calls[0][0].text;
    const token = emailBody.match(/token=([a-f0-9]+)/)?.[1];
    expect(token).toBeTruthy();
    sendEmailSpy.mockRestore();

    const newPassword = 'BrandNewPass2!';
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword });
    expect(resetRes.status).toBe(200);

    // Old password no longer works.
    const oldLoginRes = await request(app).post('/api/v1/auth/login').send({ email, password: oldPassword });
    expect(oldLoginRes.status).toBe(401);

    // New password works.
    const newLoginRes = await request(app).post('/api/v1/auth/login').send({ email, password: newPassword });
    expect(newLoginRes.status).toBe(200);

    // The refresh token issued before the reset is now revoked — a reset is
    // a trust-boundary event, same as an explicit password change.
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh_token=${oldRefreshCookie}`)
      .send();
    expect(refreshRes.status).toBe(401);

    // The same reset token cannot be used twice.
    const reuseRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'AnotherOne3!' });
    expect(reuseRes.status).toBe(400);
  });

  it('GET /reset-password/validate reports validity without consuming the token', async () => {
    const { email } = await registerUser();
    const sendEmailSpy = jest.spyOn(emailUtil, 'sendEmail').mockResolvedValue(undefined);
    await request(app).post('/api/v1/auth/forgot-password').send({ email });
    const token = sendEmailSpy.mock.calls[0][0].text.match(/token=([a-f0-9]+)/)?.[1];
    sendEmailSpy.mockRestore();
    expect(token).toBeTruthy();

    const garbageRes = await request(app).get('/api/v1/auth/reset-password/validate').query({ token: 'not-a-real-token' });
    expect(garbageRes.status).toBe(200);
    expect(garbageRes.body.data.valid).toBe(false);

    // Checking validity does NOT consume the token — it must still work afterwards.
    const validRes = await request(app).get('/api/v1/auth/reset-password/validate').query({ token });
    expect(validRes.status).toBe(200);
    expect(validRes.body.data.valid).toBe(true);

    await request(app).post('/api/v1/auth/reset-password').send({ token, newPassword: 'PostCheck9Pass!' });

    // Now that it's actually been used, the same check reports invalid.
    const afterUseRes = await request(app).get('/api/v1/auth/reset-password/validate').query({ token });
    expect(afterUseRes.body.data.valid).toBe(false);
  });

  it('invalidates a previous unused reset token when a new one is requested (one active token per account)', async () => {
    const { email } = await registerUser();
    const sendEmailSpy = jest.spyOn(emailUtil, 'sendEmail').mockResolvedValue(undefined);

    await request(app).post('/api/v1/auth/forgot-password').send({ email });
    const firstToken = sendEmailSpy.mock.calls[0][0].text.match(/token=([a-f0-9]+)/)?.[1];

    await request(app).post('/api/v1/auth/forgot-password').send({ email });
    const secondToken = sendEmailSpy.mock.calls[1][0].text.match(/token=([a-f0-9]+)/)?.[1];
    sendEmailSpy.mockRestore();

    expect(firstToken).not.toBe(secondToken);

    const firstCheck = await request(app).get('/api/v1/auth/reset-password/validate').query({ token: firstToken });
    expect(firstCheck.body.data.valid).toBe(false);

    const secondCheck = await request(app).get('/api/v1/auth/reset-password/validate').query({ token: secondToken });
    expect(secondCheck.body.data.valid).toBe(true);
  });

  it('leaves MFA enrollment intact through a password reset — still required on next login', async () => {
    const { email, password: oldPassword } = await registerUser();
    const agent = request.agent(app);
    const loginRes = await agent.post('/api/v1/auth/login').send({ email, password: oldPassword });
    const csrfToken = cookieValue(loginRes.headers['set-cookie'] as unknown as string[], 'csrf_token')!;

    const setupRes = await agent.post('/api/v1/auth/mfa/setup').set('X-CSRF-Token', csrfToken).send();
    const totpCode = authenticator.generate(setupRes.body.data.secret);
    const confirmRes = await agent
      .post('/api/v1/auth/mfa/setup/confirm')
      .set('X-CSRF-Token', csrfToken)
      .send({ code: totpCode });
    expect(confirmRes.status).toBe(200);

    const sendEmailSpy = jest.spyOn(emailUtil, 'sendEmail').mockResolvedValue(undefined);
    await request(app).post('/api/v1/auth/forgot-password').send({ email });
    const token = sendEmailSpy.mock.calls[0][0].text.match(/token=([a-f0-9]+)/)?.[1];
    sendEmailSpy.mockRestore();

    const newPassword = 'PostMfaReset7!';
    await request(app).post('/api/v1/auth/reset-password').send({ token, newPassword });

    // Login with the new password still stops at the MFA challenge — the
    // reset must not have disabled or cleared the enrollment.
    const postResetLogin = await request(app).post('/api/v1/auth/login').send({ email, password: newPassword });
    expect(postResetLogin.status).toBe(200);
    expect(postResetLogin.body.data.mfaRequired).toBe(true);
  });

  it('accepts an optional captchaToken field without error when CAPTCHA is disabled', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: uniqueEmail(), captchaToken: 'irrelevant-when-captcha-provider-is-none' });
    expect(res.status).toBe(200);
  });
});
