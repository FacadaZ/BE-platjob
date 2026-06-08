import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../service/ConversationService.js';
import { ApiResponse } from '@shared/utils/ApiResponse.js';
import { AppError } from '@shared/errors/AppError.js';

export class ConversationController {
  findOrCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { recipientId, serviceRequestId } = req.body;
      if (!recipientId) {
        throw AppError.badRequest('El ID del destinatario es obligatorio');
      }
      const conversation = await conversationService.findOrCreate(req.user.id, recipientId, serviceRequestId);
      ApiResponse.success(res, 'Conversación obtenida/creada con éxito', conversation);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const conversations = await conversationService.list(req.user.id);
      ApiResponse.success(res, 'Conversaciones listadas con éxito', conversations);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id } = req.params;
      const conversation = await conversationService.getById(id, req.user.id);
      ApiResponse.success(res, 'Conversación obtenida con éxito', conversation);
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id } = req.params;
      await conversationService.markAsRead(id, req.user.id);
      ApiResponse.success(res, 'Mensajes marcados como leídos con éxito');
    } catch (err) {
      next(err);
    }
  };

  negotiate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id } = req.params;
      const { newPrice, newDate } = req.body;
      const message = await conversationService.proposeNegotiation(id, req.user.id, { newPrice, newDate });
      ApiResponse.success(res, 'Propuesta enviada', message);
    } catch (err) {
      next(err);
    }
  };

  acceptNegotiation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id, messageId } = req.params;
      const result = await conversationService.acceptNegotiation(id, messageId, req.user.id);
      ApiResponse.success(res, 'Propuesta aceptada', result);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id } = req.params;
      await conversationService.delete(id, req.user.id);
      ApiResponse.success(res, 'Conversación eliminada con éxito');
    } catch (err) {
      next(err);
    }
  };
}
export const conversationController = new ConversationController();
