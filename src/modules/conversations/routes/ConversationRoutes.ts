import { Router } from 'express';
import { conversationController } from '../controller/ConversationController.js';
import { isAuthenticated } from '@shared/middlewares/AuthMiddleware.js';

const router = Router();

router.use(isAuthenticated);

router.post('/', conversationController.findOrCreate);
router.get('/', conversationController.list);
router.get('/:id', conversationController.getById);
router.patch('/:id/read', conversationController.markAsRead);
router.post('/:id/negotiate', conversationController.negotiate);
router.post('/:id/negotiate/:messageId/accept', conversationController.acceptNegotiation);
router.delete('/:id', conversationController.delete);

export const conversationRoutes = router;
