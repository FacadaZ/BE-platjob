export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: unknown[];

  constructor(message: string, statusCode = 500, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static solicitudIncorrecta(
    message: string,
    errors: unknown[] = [],
  ): AppError {
    return new AppError(message, 400, errors);
  }

  static badRequest(message: string, errors: unknown[] = []): AppError {
    return this.solicitudIncorrecta(message, errors);
  }

  static noAutorizado(message: string): AppError {
    return new AppError(message, 401);
  }

  static unauthorized(message: string): AppError {
    return this.noAutorizado(message);
  }

  static prohibido(message: string): AppError {
    return new AppError(message, 403);
  }

  static forbidden(message: string): AppError {
    return this.prohibido(message);
  }

  static noEncontrado(message: string): AppError {
    return new AppError(message, 404);
  }

  static notFound(message: string): AppError {
    return this.noEncontrado(message);
  }

  static conflicto(message: string): AppError {
    return new AppError(message, 409);
  }

  static conflict(message: string): AppError {
    return this.conflicto(message);
  }

  static interno(message: string): AppError {
    return new AppError(message, 500);
  }

  static internal(message: string): AppError {
    return this.interno(message);
  }
}
