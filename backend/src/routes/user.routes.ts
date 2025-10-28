import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Placeholder routes - will be implemented in subsequent tasks
router.get('/profile', (req: AuthenticatedRequest, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'User profile endpoints will be implemented in task 5.4'
  });
});

router.put('/profile', (req: AuthenticatedRequest, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'User profile endpoints will be implemented in task 5.4'
  });
});

router.delete('/data', (req: AuthenticatedRequest, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Data reset endpoints will be implemented in task 5.4'
  });
});

export { router as userRoutes };