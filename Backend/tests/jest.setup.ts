import path from 'path';

import dotenv from 'dotenv';

// Loaded before config/env.ts's own `dotenv.config()` call resolves the
// process — this ensures the test database/secrets from .env.test win over
// whatever's in .env, without needing every test file to know about it.
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });
