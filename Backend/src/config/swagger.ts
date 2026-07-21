import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';

// swagger-jsdoc reads @swagger JSDoc comments as raw text, so it needs the
// .ts sources (tsconfig strips comments from the compiled dist/*.js). Glob
// off __dirname instead of process.cwd() so this still finds them however
// the process gets started (pm2, a different working dir, etc.) — a glob
// anchored to cwd would silently resolve to zero files and prod docs would
// render with no endpoints instead of failing loudly.
const projectRoot = path.join(__dirname, '..', '..');

const swaggerEnabled = env.swagger.enabled;
const swaggerPath = env.swagger.path;

// Prefer an explicit public URL (set SWAGGER_PUBLIC_URL in prod if the API
// sits behind a domain/proxy you want pinned). Otherwise fall back to a
// server entry relative to the API prefix, which Swagger UI resolves
// against whatever origin actually served the docs page — so "Try it out"
// works correctly in dev, staging, and prod without per-env config.
const swaggerServerUrl = env.swagger.publicUrl
  ? `${env.swagger.publicUrl.replace(/\/$/, '')}${env.apiPrefix}`
  : env.apiPrefix;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NDH Trendgrid API',
      version: env.apiVersion,
      description:
        'Backend for NDH Trendgrid. All endpoints follow the standard response shape defined in workflowtunelling.md.',
    },
    servers: [
      { url: swaggerServerUrl, description: env.nodeEnv },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ApiSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(projectRoot, 'src', 'features', '**', 'swagger', '*.ts'),
    path.join(projectRoot, 'src', 'features', '**', 'route', '*.ts'),
  ],
};

const spec = swaggerJsdoc(options);

export const mountSwagger = (app: Application): void => {
  if (!swaggerEnabled) return;

  const pathCount = Object.keys((spec as { paths?: object }).paths ?? {}).length;
  if (pathCount === 0) {
    // Fail loud in the logs rather than silently serving an empty spec —
    // this almost always means src/ isn't present next to dist/ at runtime.
    // eslint-disable-next-line no-console
    console.warn(
      `[swagger] 0 documented paths found under ${projectRoot}/src. ` +
        'Docs will render but be empty — check that src/**/*.ts is deployed alongside dist/.',
    );
  }

  app.use(`${env.apiPrefix}${swaggerPath}`, swaggerUi.serve, swaggerUi.setup(spec));
  // Swagger's own raw JSON spec endpoint, not an application API response —
  // the standard success() envelope doesn't apply here.
  // eslint-disable-next-line no-restricted-syntax
  app.get(`${env.apiPrefix}${swaggerPath}.json`, (_req, res) => res.json(spec));
};
