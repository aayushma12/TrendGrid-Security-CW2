/**
 * Reusable validation middleware powered by zod.
 * Each feature's `validator/` exports zod schemas — routes wire them in via `validate(schema)`.
 * Ensures NO invalid request ever reaches a service.
 */
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export type ValidationTarget = 'body' | 'query' | 'params';

export interface ValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate =
  (schema: ValidationSchema | AnyZodObject, target: ValidationTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Single-schema shorthand
      if ('parse' in (schema as ZodSchema)) {
        req[target] = (schema as ZodSchema).parse(req[target]);
        return next();
      }

      const s = schema as ValidationSchema;
      if (s.body) req.body = s.body.parse(req.body);
      if (s.query) req.query = s.query.parse(req.query) as never;
      if (s.params) req.params = s.params.parse(req.params) as never;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        return next(new ValidationError(details));
      }
      next(err);
    }
  };
