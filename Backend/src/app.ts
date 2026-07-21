import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';


import { env } from './config/env';
import routes from './routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { configureTrustProxy, tunnelContext } from './middleware/trustProxy';
import { ipFilter } from './middleware/ipFilter';
import { auditLog } from './middleware/auditLog';
import { verifyCsrf } from './middleware/csrf';
import { mountSwagger } from './config/swagger';

const app: Application = express();

configureTrustProxy(app);

app.use(ipFilter);

// CSP is scoped to allow Swagger UI (served from the same origin at
// {apiPrefix}{swaggerPath}) to load its inline bootstrap script/styles.
// Every other route on this API returns JSON only, so the default-src
// 'none' baseline costs nothing there.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(verifyCsrf);
app.use(tunnelContext);



app.use(requestLogger);
app.use(auditLog);

mountSwagger(app);

app.use(env.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
