import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: unknown[] = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    console.warn(`⚠️ Operational Error [${statusCode}]: ${message}`);
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    console.warn(`⚠️ Validation Error: ${errors.length} issues found`);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handling standard Prisma Client Errors
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        message = `El registro ya existe. Campo duplicado: ${(err.meta?.target as string[])?.join(', ') || 'clave única'}`;
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        message = err.meta?.cause as string || 'El recurso solicitado no existe';
        break;
      default:
        statusCode = 400;
        message = `Database Error: ${err.message}`;
    }
    console.warn(`⚠️ Database Operational Error [${statusCode}]: ${message}`);
  } else {
    // Log non-operational errors to console (or external logger)
    try {
      console.error('💥 Unexpected System Error:', err);
    } catch (logError) {
      console.error('💥 Unexpected System Error (failed to inspect):', Object.prototype.toString.call(err));
      console.error('Error message:', err?.message);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
