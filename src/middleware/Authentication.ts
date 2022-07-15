import {NextFunction, Request, Response} from "express";
import Logger from "../library/logger";
import jwt from 'jsonwebtoken';
import User from '../models/User.model';


export const addUserToRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.get('authorization');
    if (token) {
      try {
        const token_payload = jwt.verify(token, process.env.JWT_SIGN_KEY || '123');
        req.token_payload = token_payload;
        req.user = await User.findOne({ email: token_payload.email });
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

export const requireAuthentication = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 'message': 'Invalid or missing authentication token' });
  }
  next();
};
