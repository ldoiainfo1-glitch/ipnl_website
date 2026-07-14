import { Response } from 'express';

/**
 * Matches the `ApiError` interface in frontend/src/types/index.ts exactly:
 *   { type, title, status, detail, instance? }
 * The frontend's axios response interceptor (api/client.ts) reads this
 * shape directly out of error.response.data.
 */
export interface ApiErrorBody {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  //  code?: string;
}

export function sendError(res: Response, status: number, title: string, detail: string): Response {
  const body: ApiErrorBody = { type: 'about:blank', title, status, detail };
  return res.status(status).json(body);
}

// Common shortcuts used across every route file
export const badRequest = (res: Response, detail: string) =>
  sendError(res, 400, 'Bad Request', detail);

export const unauthorized = (res: Response, detail = 'Authentication required') =>
  sendError(res, 401, 'Unauthorized', detail);

export const forbidden = (res: Response, detail = 'You do not have permission to perform this action') =>
  sendError(res, 403, 'Forbidden', detail);

export const notFound = (res: Response, detail = 'Resource not found') =>
  sendError(res, 404, 'Not Found', detail);

export const conflict = (res: Response, detail: string) =>
  sendError(res, 409, 'Conflict', detail);

export const serverError = (res: Response, detail = 'Internal server error') =>
  sendError(res, 500, 'Internal Server Error', detail);
