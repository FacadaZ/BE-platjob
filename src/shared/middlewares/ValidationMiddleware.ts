import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { asyncHandler } from '@shared/utils/AsyncHandler.js';

export const validateRequest = (schema: AnyZodObject) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const validated = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Asignamos los datos validados de vuelta al request
    req.body = validated.body;
    req.query = validated.query;
    req.params = validated.params;
    
    next();
  });
};
