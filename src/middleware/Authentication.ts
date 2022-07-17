import { NextFunction, Request, Response } from 'express';
import Logger from '../library/logger';
import jwt from 'jsonwebtoken';
import User, { IUserModel } from '../models/User.model';

export interface TokenInterface {
  email: string;
  name: string;
  userId: number;
}
export interface AuthRequest extends Request {
  user?: IUserModel | null;
  tokenPayload?: TokenInterface;
}
export interface AuthResponse extends Response {
  user?: IUserModel | null;
  tokenPayload?: TokenInterface;
}

export const addUserToRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.get('authorization');
    if (token) {
      try {
        const tokenPayload = jwt.verify(token, process.env.JWT_SIGN_KEY || '123') as TokenInterface;
        req.tokenPayload = tokenPayload;
        req.user = await User.findOne({ email: tokenPayload.email });
      } catch (err) {
        Logger.log(`Received invalid token ${token}`);
      }
    }
    next();
  } catch (err) {
    Logger.err(err);

    return res.status(422).json({ err });
  }
};

export const requireAuthentication = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Invalid or missing authentication token' });
  }
  next();
};
