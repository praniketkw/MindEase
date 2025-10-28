import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // For MindEase, we'll create anonymous sessions for privacy
      // Generate a temporary user ID and session ID
      req.userId = uuidv4();
      req.sessionId = uuidv4();
      
      // Set session cookie for subsequent requests
      const sessionToken = jwt.sign(
        { 
          userId: req.userId, 
          sessionId: req.sessionId,
          type: 'anonymous'
        },
        process.env.JWT_SECRET || 'mindease-dev-secret',
        { expiresIn: '24h' }
      );
      
      res.cookie('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      return next();
    }

    // Verify existing token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'mindease-dev-secret'
    ) as any;
    
    req.userId = decoded.userId;
    req.sessionId = decoded.sessionId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // Invalid token, create new anonymous session
      req.userId = uuidv4();
      req.sessionId = uuidv4();
      
      const sessionToken = jwt.sign(
        { 
          userId: req.userId, 
          sessionId: req.sessionId,
          type: 'anonymous'
        },
        process.env.JWT_SECRET || 'mindease-dev-secret',
        { expiresIn: '24h' }
      );
      
      res.cookie('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      return next();
    }
    
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Unable to process authentication'
    });
  }
};

export { AuthenticatedRequest };