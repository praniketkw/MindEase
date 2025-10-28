import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Placeholder routes - will be implemented in subsequent tasks
router.post('/', (req: AuthenticatedRequest, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Conversation endpoints will be implemented in task 5.2'
  });
});

export { router as conversationRoutes };