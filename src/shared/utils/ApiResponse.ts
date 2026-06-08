import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, message: string, data?: unknown, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res: Response, message: string, data?: unknown): Response {
    return this.success(res, message, data, 201);
  }
}
