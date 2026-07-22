import bcrypt from 'bcrypt';
import request from 'supertest';

import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { encryptJson } from '../src/utils/crypto';

const TEST_EMAIL_PREFIX = 'jest-rbac-';
const uniqueEmail = (label: string) => `${TEST_EMAIL_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

async function registerUser(label: string) {
  const email = uniqueEmail(label);
  const password = 'CorrectHorse1!';
  const res = await request(app).post('/api/v1/auth/register').send({
    firstName: 'Jest',
    lastName: label,
    email,
    password,
    acceptTerms: true,
  });
  return { userId: res.body.data.user.id as string, email, password };
}

/** Registration always assigns USER — ADMIN/EDITOR accounts are seeded
 *  directly, which is realistic (they're provisioned by an existing admin,
 *  never self-registered — see auth service's register()). */
async function seedStaffUser(role: 'ADMIN' | 'EDITOR', label: string) {
  const email = uniqueEmail(label);
  const password = 'CorrectHorse1';
  const passwordHash = await bcrypt.hash(password, env.jwt.saltRounds);
  const user = await prisma.user.create({
    data: { firstName: 'Jest', lastName: label, email, passwordHash, role },
  });
  return { userId: user.id, email, password };
}

/** Seeds a minimal order directly (bypassing checkout) so IDOR tests don't
 *  need to exercise the full cart/checkout flow just to get a row to probe. */
async function seedOrder(userId: string, label: string) {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const address = encryptJson({ line1: '123 Test St', city: 'Testville', country: 'NP' });
  return prisma.order.create({
    data: {
      orderNumber: `ORD-${suffix}`,
      invoiceNumber: `INV-${suffix}`,
      trackingNumber: `TRK-${suffix}`,
      userId,
      subtotal: 1000,
      grandTotal: 1000,
      shippingAddress: address,
      billingAddress: address,
    },
  });
}

function cookieValue(setCookieHeader: string[] | undefined, name: string): string | undefined {
  const line = setCookieHeader?.find((c) => c.startsWith(`${name}=`));
  if (!line) return undefined;
  return line.split(';')[0].split('=').slice(1).join('=');
}

async function loginAgent(email: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email, password });
  const csrfToken = cookieValue(res.headers['set-cookie'] as unknown as string[], 'csrf_token')!;
  return { agent, csrfToken };
}

afterAll(async () => {
  // Orders FK-restrict their user (no cascade — an order must outlive an
  // account deletion in real usage), so seeded test orders must go first.
  await prisma.order.deleteMany({ where: { user: { email: { startsWith: TEST_EMAIL_PREFIX } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
  await prisma.$disconnect();
});

describe('vertical privilege escalation', () => {
  it('blocks a plain USER from the admin/editor-only user list', async () => {
    const { email, password } = await registerUser('vertical');
    const { agent } = await loginAgent(email, password);

    const res = await agent.get('/api/v1/users');
    expect(res.status).toBe(403);
  });

  it('allows an ADMIN through the same route', async () => {
    const { email, password } = await seedStaffUser('ADMIN', 'vertical-admin');
    const { agent } = await loginAgent(email, password);

    const res = await agent.get('/api/v1/users');
    expect(res.status).toBe(200);
  });
});

describe('horizontal privilege escalation (IDOR)', () => {
  it("blocks a USER from viewing another user's profile", async () => {
    const userA = await registerUser('idor-a');
    const userB = await registerUser('idor-b');
    const { agent: agentA } = await loginAgent(userA.email, userA.password);

    const res = await agentA.get(`/api/v1/users/${userB.userId}`);
    expect(res.status).toBe(403);
  });

  it('still allows a USER to view their own profile', async () => {
    const userA = await registerUser('idor-self');
    const { agent: agentA } = await loginAgent(userA.email, userA.password);

    const res = await agentA.get(`/api/v1/users/${userA.userId}`);
    expect(res.status).toBe(200);
  });

  it('allows staff to view any profile', async () => {
    const target = await registerUser('idor-target');
    const staff = await seedStaffUser('EDITOR', 'idor-editor');
    const { agent } = await loginAgent(staff.email, staff.password);

    const res = await agent.get(`/api/v1/users/${target.userId}`);
    expect(res.status).toBe(200);
  });
});

describe('mass-assignment / role escalation', () => {
  it('blocks a non-admin EDITOR from granting themselves the ADMIN role', async () => {
    const editor = await seedStaffUser('EDITOR', 'escalate-editor');
    const { agent, csrfToken } = await loginAgent(editor.email, editor.password);

    const res = await agent
      .put(`/api/v1/users/${editor.userId}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ role: 'ADMIN', firstName: 'Still Jest' });
    expect(res.status).toBe(403);

    const unchanged = await prisma.user.findUnique({ where: { id: editor.userId } });
    expect(unchanged?.role).toBe('EDITOR');
  });

  it('allows an ADMIN to change a role', async () => {
    const admin = await seedStaffUser('ADMIN', 'escalate-admin');
    const target = await registerUser('escalate-target');
    const { agent, csrfToken } = await loginAgent(admin.email, admin.password);

    const res = await agent
      .put(`/api/v1/users/${target.userId}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ role: 'EDITOR' });
    expect(res.status).toBe(200);

    const updated = await prisma.user.findUnique({ where: { id: target.userId } });
    expect(updated?.role).toBe('EDITOR');
  });
});

describe('order ownership (IDOR) + admin-only listing', () => {
  it("blocks a USER from viewing another user's order", async () => {
    const userA = await registerUser('order-a');
    const userB = await registerUser('order-b');
    const orderB = await seedOrder(userB.userId, 'order-b');
    const { agent: agentA } = await loginAgent(userA.email, userA.password);

    const res = await agentA.get(`/api/v1/orders/${orderB.id}`);
    expect(res.status).toBe(403);
  });

  it('allows a USER to view their own order', async () => {
    const userA = await registerUser('order-self');
    const orderA = await seedOrder(userA.userId, 'order-self');
    const { agent } = await loginAgent(userA.email, userA.password);

    const res = await agent.get(`/api/v1/orders/${orderA.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(orderA.id);
  });

  it('allows ADMIN to view any order, including one it does not own', async () => {
    const userA = await registerUser('order-admin-target');
    const orderA = await seedOrder(userA.userId, 'order-admin-target');
    const admin = await seedStaffUser('ADMIN', 'order-admin-viewer');
    const { agent } = await loginAgent(admin.email, admin.password);

    const res = await agent.get(`/api/v1/orders/${orderA.id}`);
    expect(res.status).toBe(200);
  });

  it('blocks a plain USER from the admin-only order list, allows ADMIN', async () => {
    const user = await registerUser('order-list-user');
    const { agent: agentUser } = await loginAgent(user.email, user.password);
    const userRes = await agentUser.get('/api/v1/orders');
    expect(userRes.status).toBe(403);

    const admin = await seedStaffUser('ADMIN', 'order-list-admin');
    const { agent: agentAdmin } = await loginAgent(admin.email, admin.password);
    const adminRes = await agentAdmin.get('/api/v1/orders');
    expect(adminRes.status).toBe(200);
  });
});

describe('coupon admin-only management', () => {
  const couponPayload = () => ({
    code: `JESTCODE${Date.now()}${Math.floor(Math.random() * 1000)}`,
    type: 'PERCENTAGE' as const,
    value: 10,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  it('blocks a plain USER from creating a coupon', async () => {
    const { email, password } = await registerUser('coupon-user');
    const { agent, csrfToken } = await loginAgent(email, password);

    const res = await agent
      .post('/api/v1/coupons')
      .set('X-CSRF-Token', csrfToken)
      .send(couponPayload());
    expect(res.status).toBe(403);
  });

  it('allows an ADMIN to create a coupon', async () => {
    const admin = await seedStaffUser('ADMIN', 'coupon-admin');
    const { agent, csrfToken } = await loginAgent(admin.email, admin.password);

    const res = await agent
      .post('/api/v1/coupons')
      .set('X-CSRF-Token', csrfToken)
      .send(couponPayload());
    expect(res.status).toBe(201);

    await prisma.coupon.delete({ where: { id: res.body.data.id } });
  });

  it('blocks a plain USER from listing all coupons', async () => {
    const { email, password } = await registerUser('coupon-list-user');
    const { agent } = await loginAgent(email, password);

    const res = await agent.get('/api/v1/coupons');
    expect(res.status).toBe(403);
  });
});
