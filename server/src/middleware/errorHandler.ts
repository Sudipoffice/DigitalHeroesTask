import { Request, Response, NextFunction } from 'express';
import { handleError } from '../utils/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const { status, body } = handleError(err);
  res.status(status).json(body);
}