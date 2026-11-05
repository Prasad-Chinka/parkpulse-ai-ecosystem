import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../services/store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'parkpulse_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'operator';
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No authorization token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      _id: string;
      email: string;
      role: 'user' | 'admin' | 'operator';
    };

    const user = await db.findUserById(decoded._id);
    if (!user) {
      res.status(401).json({ error: 'User session invalid or user deleted.' });
      return;
    }

    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired authorization token.' });
  }
};

export const requireRole = (allowedRoles: ('user' | 'admin' | 'operator')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access restricted. Your role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
};
