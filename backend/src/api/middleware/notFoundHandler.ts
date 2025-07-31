import { Request, Response } from 'express';
import { ApiResponse } from '@/types';

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: 'Not Found',
    message: `The requested resource ${req.method} ${req.url} was not found`,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId,
  };

  res.status(404).json(response);
};