import { Router, Request, Response } from 'express';
import { CopingStrategyService, StrategyFeedback } from '../services/coping-strategy.service';
import { DatabaseService } from '../services/database.service';
import { EmotionalState, EmotionalAnalysis } from '../../../shared/types';

const router = Router();

// Initialize service (in a real app, this would be dependency injected)
const databaseService = new DatabaseService();
const copingStrategyService = new CopingStrategyService(databaseService);

/**
 * GET /api/coping-strategies/recommendations
 * Get personalized coping strategy recommendations
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Parse emotional state from query parameters
    const emotionalState: EmotionalState = {
      currentMood: parseInt(req.query.mood as string) || 3,
      dominantEmotion: req.query.emotion as string || 'neutral',
      stressLevel: parseInt(req.query.stress as string) || 2,
      riskLevel: (req.query.risk as any) || 'low'
    };

    // Parse optional emotional analysis from request body
    let emotionalAnalysis: EmotionalAnalysis | undefined;
    if (req.body && req.body.emotionalAnalysis) {
      emotionalAnalysis = req.body.emotionalAnalysis;
    }

    const limit = parseInt(req.query.limit as string) || 3;

    const recommendations = await copingStrategyService.getRecommendations(
      userId,
      emotionalState,
      emotionalAnalysis,
      limit
    );

    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting coping strategy recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/coping-strategies/usage
 * Record strategy usage and feedback
 */
router.post('/usage', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { strategyId, effectiveness, notes } = req.body;

    if (!strategyId) {
      return res.status(400).json({ error: 'Strategy ID is required' });
    }

    const feedback: StrategyFeedback | undefined = effectiveness ? {
      strategyId,
      effectiveness: parseInt(effectiveness),
      notes,
      timestamp: new Date()
    } : undefined;

    await copingStrategyService.recordStrategyUsage(userId, strategyId, feedback);

    res.json({
      success: true,
      message: 'Strategy usage recorded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error recording strategy usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record strategy usage',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/coping-strategies/user
 * Get user's strategy history and effectiveness
 */
router.get('/user', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userStrategies = copingStrategyService.getUserStrategies(userId);
    const mostEffective = copingStrategyService.getMostEffectiveStrategies(userId);

    res.json({
      success: true,
      data: {
        allStrategies: userStrategies.map(s => s.toJSON()),
        mostEffective,
        totalStrategiesUsed: userStrategies.filter(s => s.usageCount > 0).length,
        averageEffectiveness: userStrategies.length > 0 
          ? userStrategies.reduce((sum, s) => sum + s.effectivenessScore, 0) / userStrategies.length 
          : 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting user strategies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user strategies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/coping-strategies/categories/:category
 * Get strategies by category
 */
router.get('/categories/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    const validCategories = ['breathing', 'grounding', 'cognitive', 'physical', 'social'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category',
        validCategories 
      });
    }

    const strategies = copingStrategyService.getStrategiesByCategory(category as any);

    res.json({
      success: true,
      category,
      strategies,
      count: strategies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting strategies by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get strategies by category',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/coping-strategies/all
 * Get all available coping strategies
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const categories = ['breathing', 'grounding', 'cognitive', 'physical', 'social'];
    const allStrategies: any = {};

    categories.forEach(category => {
      allStrategies[category] = copingStrategyService.getStrategiesByCategory(category as any);
    });

    res.json({
      success: true,
      strategies: allStrategies,
      totalCount: Object.values(allStrategies).flat().length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting all strategies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all strategies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;