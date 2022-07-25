import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model';
import jwt from 'jsonwebtoken';
import Crypto from 'crypto';

const register = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  const [nameExists, emailExists] = await Promise.all([
    User.findOne({ name }, '_id'),
    User.findOne({ email }, '_id')
  ]);

  if (nameExists) {
    return res.status(400).json({ message: 'Username is already in use' });
  } else if (emailExists) {
    return res.status(400).json({ message: 'Email is already in use' });
  }

  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);

  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name,
    email,
    password: hashedPassword,
    salt
  });

  return user.save()
    .then(user => res.status(201).json({ token: createToken(name, email) }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }, 'name email salt password');
  if (!user) {
    return res.status(400).json({ message: 'Invalid email/password' });
  }

  const hashedPassword = hashPassword(password, user.salt);
  if (hashedPassword === user.password) {
    return res.status(201).json({ token: createToken(user.name, user.email) });
  } else {
    return res.status(400).json({ message: 'Invalid email/password' });
  }
};

const generateSalt = () => {
  return Crypto.randomBytes(32).toString('base64');
};

const hashPassword = (password: string, salt: string) => {
  return Crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('base64');
};

const createToken = (name: string, email: string) => {
  return jwt.sign(
    { name, email },
    process.env.JWT_SIGN_KEY || '123',
    { expiresIn: '7 days' }
  );
};

export default { register, login };
