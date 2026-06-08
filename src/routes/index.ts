import { Router } from 'express';
import { authRoutes } from '@modules/auth/routes/AuthRoutes.js';
import { technicianRoutes } from '@modules/technicians/routes/TechnicianRoutes.js';
import { serviceRequestRoutes } from '@modules/service-requests/routes/ServiceRequestRoutes.js';
import { reviewRoutes } from '@modules/reviews/routes/ReviewRoutes.js';
import { conversationRoutes } from '@modules/conversations/routes/ConversationRoutes.js';
import { adminRoutes } from '@modules/admin/routes/AdminRoutes.js';

const router = Router();

// Endpoint de verificación de salud
router.get('/health', (_req, res) => {
  res.json({
    status: 'up',
    timestamp: new Date(),
    service: 'PlatJob Backend API',
  });
});

router.use('/auth', authRoutes);
router.use('/technicians', technicianRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/reviews', reviewRoutes);
router.use('/conversations', conversationRoutes);
router.use('/admin', adminRoutes);

export const appRouter = router;
