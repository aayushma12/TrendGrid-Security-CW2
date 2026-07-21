import express from 'express';
import request from 'supertest';

import { createRateLimit } from '../src/middleware/rateLimit';

/**
 * Exercises the real rate-limit middleware directly (not the app's shared,
 * test-inflated instances — see middleware/rateLimit.ts) with an explicit
 * low `max`, on a throwaway Express app, so this test neither depends on nor
 * pollutes any other test's request quota.
 */
describe('rate limiting', () => {
  it('allows requests up to the limit, then returns 429 with the standard error envelope', async () => {
    const limiter = createRateLimit('Too many requests in this test.', {
      windowMs: 60 * 1000,
      max: 3,
    });
    const app = express();
    app.get('/limited', limiter, (_req, res) => res.json({ success: true, statusCode: 200, data: null }));

    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).get('/limited');
      expect(res.status).toBe(200);
    }

    const blockedRes = await request(app).get('/limited');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body).toMatchObject({
      success: false,
      statusCode: 429,
      message: 'Too many requests in this test.',
    });
  });
});
