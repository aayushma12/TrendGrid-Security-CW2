/**
 * Response builders. Controllers should ONLY return through these helpers so
 * every API emits an identical shape, per workflowtunelling.md.
 */
import { Response } from 'express';
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta,
} from '../types';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const success = <T>(
  res: Response,
  data: T,
  message: string = MESSAGES.RETRIEVED,
  statusCode: number = HTTP_STATUS.OK,
  meta?: PaginationMeta,
): Response<ApiSuccessResponse<T>> => {
  const body: ApiSuccessResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(body);
};

export const created = <T>(res: Response, data: T, message: string = MESSAGES.CREATED): Response =>
  success(res, data, message, HTTP_STATUS.CREATED);

export const noContent = (res: Response): Response =>
  res.status(HTTP_STATUS.NO_CONTENT).send();

export const paginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message: string = MESSAGES.RETRIEVED,
): Response => success(res, data, message, HTTP_STATUS.OK, meta);

export const error = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.BAD_REQUEST,
  errors: ApiErrorResponse['errors'] = [],
): Response<ApiErrorResponse> => {
  const body: ApiErrorResponse = {
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(body);
};
