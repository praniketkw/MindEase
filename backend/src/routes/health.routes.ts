import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    service: 'MindEase Backend',
    ai: 'Anthropic Claude 3.5 Haiku',
    privacy: 'No data storage - client-side only',
    cost: '~$0.0001 per conversation',
  });
});

export default router;
