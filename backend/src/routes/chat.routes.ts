import { Router } from 'express';
import { sendMessage, detectCrisis } from '../controllers/chat.controller';

const router = Router();

// Main chat endpoint - stateless, no conversation storage
router.post('/message', sendMessage);

// Crisis detection endpoint
router.post('/crisis-check', detectCrisis);

export default router;
