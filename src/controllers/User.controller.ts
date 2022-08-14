import { AuthRequest } from '../middleware/Authentication';
import { NextFunction, Request, Response } from 'express';
import User from '../models/User.model';

const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return;
  }

  try {
    const user = await User.findById(req.user._id, '-_id -verificationKey -email');
    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const getUserByName = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;

  try {
    const user = await User.findOne({ name }, '-_id -verificationKey -email');
    if (!user) {
      return res.status(404).json({ message: 'not found' });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

export default { getUser, getUserByName };
