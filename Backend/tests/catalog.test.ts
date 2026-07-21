import bcrypt from 'bcrypt';
import request from 'supertest';

import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';

const PREFIX = 'jest-catalog-';
const unique = (label: string) => `${PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

async function seedAdmin(label: string) {
  const email = `${unique(label)}@example.com`;
  const password = 'CorrectHorse1';
  const passwordHash = await bcrypt.hash(password, env.jwt.saltRounds);
  const user = await prisma.user.create({
    data: { firstName: 'Jest', lastName: label, email, passwordHash, role: 'ADMIN' },
  });
  return { userId: user.id, email, password };
}

async function seedUser(label: string) {
  const email = `${unique(label)}@example.com`;
  const password = 'CorrectHorse1';
  const passwordHash = await bcrypt.hash(password, env.jwt.saltRounds);
  const user = await prisma.user.create({
    data: { firstName: 'Jest', lastName: label, email, passwordHash, role: 'USER' },
  });
  return { userId: user.id, email, password };
}

let categoryId: string;
let products: { id: string; name: string }[] = [];

beforeAll(async () => {
  const category = await prisma.category.create({ data: { name: unique('Category'), isActive: true } });
  categoryId = category.id;

  const specs = [
    { name: unique('Winter Coat'), tags: ['Formal'], labels: ['Elegant'], collections: ['Winter'] },
    { name: unique('Summer Dress'), tags: ['Casual'], labels: ['Bohemian'], collections: ['Summer'] },
    { name: unique('Everyday Tee'), tags: ['Casual'], labels: ['Minimalist'], collections: ['Everyday'] },
  ];
  for (const spec of specs) {
    // eslint-disable-next-line no-await-in-loop
    const p = await prisma.product.create({
      data: {
        name: spec.name,
        basePrice: 1000,
        currency: 'NPR',
        categoryId,
        status: 'PUBLISHED',
        isActive: true,
        tags: spec.tags,
        labels: spec.labels,
        collections: spec.collections,
        variants: { create: [{ sku: unique('SKU'), price: 1000, stock: 5, color: 'Black' }] },
      },
    });
    products.push({ id: p.id, name: p.name });
  }
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await prisma.$disconnect();
});

describe('catalog filtering', () => {
  it('filters products by tag, label, and collection', async () => {
    const byTag = await request(app).get('/api/v1/products').query({ tag: 'Formal', limit: 100 });
    expect(byTag.body.data.some((p: { name: string }) => p.name === products[0].name)).toBe(true);
    expect(byTag.body.data.some((p: { name: string }) => p.name === products[1].name)).toBe(false);

    const byLabel = await request(app).get('/api/v1/products').query({ label: 'Bohemian', limit: 100 });
    expect(byLabel.body.data.some((p: { name: string }) => p.name === products[1].name)).toBe(true);

    const byCollection = await request(app).get('/api/v1/products').query({ collection: 'Winter', limit: 100 });
    expect(byCollection.body.data.some((p: { name: string }) => p.name === products[0].name)).toBe(true);
  });
});

describe('catalog stats', () => {
  it('requires ADMIN and reports totals including this test category', async () => {
    const user = await seedUser('stats-user');
    const { agent: userAgent } = await loginAgent(user.email, user.password);
    const forbidden = await userAgent.get('/api/v1/products/stats');
    expect(forbidden.status).toBe(403);

    const admin = await seedAdmin('stats-admin');
    const { agent } = await loginAgent(admin.email, admin.password);
    const res = await agent.get('/api/v1/products/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.totalProducts).toBeGreaterThanOrEqual(products.length);
    expect(
      res.body.data.productsPerCategory.some((c: { categoryId: string; count: number }) => c.categoryId === categoryId && c.count === 3),
    ).toBe(true);
  });
});

describe('bulk product operations', () => {
  it('blocks a non-admin, then bulk-deactivates and bulk-deletes as admin', async () => {
    const admin = await seedAdmin('bulk-admin');
    const { agent, csrfToken } = await loginAgent(admin.email, admin.password);
    const ids = products.map((p) => p.id);

    const nonAdmin = await seedUser('bulk-user');
    const { agent: userAgent } = await loginAgent(nonAdmin.email, nonAdmin.password);
    const blocked = await userAgent.post('/api/v1/products/bulk/active').send({ ids, isActive: false });
    expect(blocked.status).toBe(403);

    const deactivateRes = await agent
      .post('/api/v1/products/bulk/active')
      .set('X-CSRF-Token', csrfToken)
      .send({ ids, isActive: false });
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data).toMatchObject({ requested: 3, updated: 3, notFound: [] });

    const stillActive = await prisma.product.count({ where: { id: { in: ids }, isActive: true } });
    expect(stillActive).toBe(0);

    // Include one id that doesn't exist — should be reported, not fail the whole request.
    const fakeId = '00000000-0000-4000-8000-000000000000';
    const deleteRes = await agent
      .post('/api/v1/products/bulk/delete')
      .set('X-CSRF-Token', csrfToken)
      .send({ ids: [...ids, fakeId] });
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.updated).toBe(3);
    expect(deleteRes.body.data.notFound).toEqual([fakeId]);

    const remaining = await prisma.product.count({ where: { id: { in: ids } } });
    expect(remaining).toBe(0);
    products = []; // already deleted — afterAll's cleanup query would just find nothing, which is fine
  });
});

describe('CSV import', () => {
  const csvRow = (name: string, categoryName: string) =>
    `name,basePrice,categoryName,tags\n"${name}",1500,"${categoryName}","Formal"\n`;

  it('creates a valid row, skips a duplicate, reports an unknown category as an error, and dry-run does not write', async () => {
    const admin = await seedAdmin('import-admin');
    const { agent, csrfToken } = await loginAgent(admin.email, admin.password);

    const importName = unique('Imported Product');
    const csv = csvRow(importName, (await prisma.category.findUnique({ where: { id: categoryId } }))!.name);

    const dryRunRes = await agent
      .post('/api/v1/products/import')
      .query({ dryRun: 'true' })
      .set('X-CSRF-Token', csrfToken)
      .attach('file', Buffer.from(csv), { filename: 'import.csv', contentType: 'text/csv' });
    expect(dryRunRes.status).toBe(200);
    expect(dryRunRes.body.data.dryRun).toBe(true);
    expect(dryRunRes.body.data.created).toBe(1);

    const afterDryRun = await prisma.product.findFirst({ where: { name: importName } });
    expect(afterDryRun).toBeNull(); // dry run must not have written anything

    const realRes = await agent
      .post('/api/v1/products/import')
      .set('X-CSRF-Token', csrfToken)
      .attach('file', Buffer.from(csv), { filename: 'import.csv', contentType: 'text/csv' });
    expect(realRes.status).toBe(200);
    expect(realRes.body.data.dryRun).toBe(false);
    expect(realRes.body.data.created).toBe(1);

    const created = await prisma.product.findFirst({ where: { name: importName } });
    expect(created).not.toBeNull();

    // Re-importing the exact same file: the row is now a duplicate.
    const dupRes = await agent
      .post('/api/v1/products/import')
      .set('X-CSRF-Token', csrfToken)
      .attach('file', Buffer.from(csv), { filename: 'import.csv', contentType: 'text/csv' });
    expect(dupRes.body.data.skipped).toBe(1);
    expect(dupRes.body.data.created).toBe(0);

    // Unknown category -> reported as a row-level error, not a request failure.
    const badCsv = csvRow(unique('No Category Product'), 'Totally Unknown Category Name');
    const badRes = await agent
      .post('/api/v1/products/import')
      .set('X-CSRF-Token', csrfToken)
      .attach('file', Buffer.from(badCsv), { filename: 'import.csv', contentType: 'text/csv' });
    expect(badRes.status).toBe(200);
    expect(badRes.body.data.errors).toBe(1);
    expect(badRes.body.data.results[0].status).toBe('error');

    await prisma.product.deleteMany({ where: { name: importName } });
  });

  it('rejects a non-CSV file', async () => {
    const admin = await seedAdmin('import-reject-admin');
    const { agent, csrfToken } = await loginAgent(admin.email, admin.password);

    const res = await agent
      .post('/api/v1/products/import')
      .set('X-CSRF-Token', csrfToken)
      .attach('file', Buffer.from('not a csv'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('category bulk operations', () => {
  it('bulk-deactivates categories and reports a graceful failure deleting one that still has products', async () => {
    const admin = await seedAdmin('cat-bulk-admin');
    const { agent, csrfToken } = await loginAgent(admin.email, admin.password);

    const withProduct = await prisma.category.create({ data: { name: unique('Has Products'), isActive: true } });
    await prisma.product.create({
      data: { name: unique('Blocking Product'), basePrice: 500, currency: 'NPR', categoryId: withProduct.id, status: 'DRAFT', isActive: true },
    });
    const empty = await prisma.category.create({ data: { name: unique('Empty Category'), isActive: true } });

    const deactivateRes = await agent
      .post('/api/v1/categories/bulk/active')
      .set('X-CSRF-Token', csrfToken)
      .send({ ids: [withProduct.id, empty.id], isActive: false });
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.updated).toBe(2);

    const deleteRes = await agent
      .post('/api/v1/categories/bulk/delete')
      .set('X-CSRF-Token', csrfToken)
      .send({ ids: [withProduct.id, empty.id] });
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deleted).toBe(1);
    expect(deleteRes.body.data.failed).toHaveLength(1);
    expect(deleteRes.body.data.failed[0].id).toBe(withProduct.id);

    await prisma.product.deleteMany({ where: { categoryId: withProduct.id } });
    await prisma.category.deleteMany({ where: { id: withProduct.id } });
  });
});
