import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { schoolIdContext } from '../prisma.js';

export interface AuthUser {
  sub: string;
  username: string;
  role: string;
  schoolId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware that:
 * 1. Verifies JWT token
 * 2. Sets user in request
 * 3. Sets schoolId context for automatic query filtering
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = payload;
    
    // Set schoolId context for automatic filtering in all Prisma queries
    // This ensures data isolation - all queries will automatically filter by schoolId
    // Use AsyncLocalStorage to maintain context throughout the request
    schoolIdContext.run(payload.schoolId, () => {
      next();
    });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


