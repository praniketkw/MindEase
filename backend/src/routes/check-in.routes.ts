import { Router, Request, Response } from 'express';
import { CheckInService, CheckInSession } from '../services/check-in.service';
import { DatabaseService } from '../services/database.service';
import { UserPreferences } from '../../../shared/types';

const router = Router();

// Initialize service
const databaseService = new DatabaseService();
const checkInService = new CheckInService(databaseService);

/**
 * POST /api/check-in/start
 * Start a new check-in session
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { triggeredBy, concerningPatterns } = req.body;

    const session = await checkInService.createCheckInSession(
      userId,
      triggeredBy || 'manual',
      concerningPatterns
    );

    const questions = checkInService.getPersonalizedQuestions(userId, concerningPatterns);

    res.json({
      success: true,
      session: {
        id: session.id,
        triggeredBy: session.triggeredBy,
        concerningPatterns: session.concerningPatterns
      },
      questions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error starting check-in session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start check-in session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/check-in/:sessionId/respond
 * Submit a response to a check-in question
 */
router.post('/:sessionId/respond', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const updatedSession = await checkInService.processCheckInResponse(
      sessionId,
      question,
      answer
    );

    res.json({
      success: true,
      session: {
        id: updatedSession.id,
        mood: updatedSession.mood,
        stressLevel: updatedSession.stressLevel,
        responsesCount: updatedSession.responses.length,
        emotionalState: updatedSession.emotionalState
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing check-in response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/check-in/:sessionId/complete
 * Complete a check-in session and get insights
 */
router.post('/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await checkInService.completeCheckInSession(sessionId);

    res.json({
      success: true,
      session: {
        id: result.session.id,
        mood: result.session.mood,
        stressLevel: result.session.stressLevel,
        emotionalState: result.session.emotionalState,
        completed: result.session.completed
      },
      insights: result.insights,
      recommendations: result.recommendations,
      followUpNeeded: result.followUpNeeded,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error completing check-in session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete check-in session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/check-in/analyze-patterns
 * Analyze user patterns and get check-in triggers
 */
router.get('/analyze-patterns', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const triggers = await checkInService.analyzeUserPatterns(userId);

    res.json({
      success: true,
      triggers,
      checkInRecommended: triggers.length > 0,
      highPriorityTriggers: triggers.filter(t => t.severity === 'high'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing user patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/check-in/mood-pattern
 * Get user's mood pattern over time
 */
router.get('/mood-pattern', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const moodPattern = await checkInService.getUserMoodPattern(userId, days);

    res.json({
      success: true,
      moodPattern,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting mood pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mood pattern',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/check-in/schedule
 * Schedule next check-in based on user preferences
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const preferences: UserPreferences = req.body.preferences;
    if (!preferences) {
      return res.status(400).json({ error: 'User preferences are required' });
    }

    const nextCheckIn = await checkInService.scheduleCheckIn(userId, preferences);

    res.json({
      success: true,
      nextCheckIn,
      frequency: preferences.checkInFrequency,
      scheduled: nextCheckIn !== null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error scheduling check-in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule check-in',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/check-in/questions
 * Get personalized check-in questions
 */
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const concerningPatterns = req.query.patterns ? 
      (req.query.patterns as string).split(',') : undefined;

    const questions = checkInService.getPersonalizedQuestions(userId, concerningPatterns);

    res.json({
      success: true,
      questions,
      count: questions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting check-in questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;