import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUserModel } from '../models/User.model';
import jwt from 'jsonwebtoken';
import Crypto from 'crypto';
import Mailer from '../helpers/EmailVerification';
import Logger from '../library/logger';
import { config } from '../config/config';
import { AuthRequest } from '../middleware/Authentication';

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
  const verificationKey = generateVerificationKey();
  const emailData = createEmailData(verificationKey);

  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name,
    email,
    password: hashedPassword,
    salt,
    verificationKey
  });
  return user.save()
    .then(user => {
      sendMail(email, emailData);
      return res.status(201).json({ token: createToken(name, email) });
    })
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

const verify = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const { code } = req.params;

  if (user?.verified) {
    return res.status(403).json({ message: 'Already verified' });
  }

  try {
    if (user?.verificationKey === code) {
      user.verified = true;
      await user.save();
      res.status(200).json({ message: 'Verified' });
    } else {
      res.status(403).json({ message: 'Wrong verification key' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

const resendMail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;

  if (user?.verified) {
    return res.status(403).json({ message: 'Already verified' });
  }

  if (user) {
    const verificationKey = generateVerificationKey();
    const emailData = createEmailData(verificationKey);
    const currentDate: Date = new Date();
    const nextEmailDate: Date = new Date(user.verificationDate.setHours(user.verificationDate.getHours() + 1));
    if (nextEmailDate > currentDate) {
      return res.status(403).json({ message: 'Please wait till send email again' });
    }
    user.verificationKey = verificationKey;
    user.verificationDate = currentDate;
    return user.save()
      .then(user => {
        sendMail(user.email, emailData);
        return res.status(201).json(user);
      })
      .catch(err => res.status(500).json({ message: 'Server error', err }));
  }
};

const generateSalt = () => {
  return Crypto.randomBytes(32).toString('base64');
};

const hashPassword = (password: string, salt: string) => {
  return Crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('base64');
};

const generateVerificationKey = () => {
  return Crypto.randomBytes(4).toString('hex');
};

const createEmailData = (verificationKey: string) => {
  return {
    subject: 'Мемолог | Верифікація пошти. Memologist | Email verification.',
    text:
          `<p>Будь-ласка, підтвердь свою пошту, натиснувши на посилання знизу.</p>
          <p>Або вставте цей код у поле верифікації: ${verificationKey}.</p>
          <p>Please, confirm your email, by clicking on the link below.</p>
          <p>Or paste this code to verification input: ${verificationKey}.</p>
          <p><a href='${config.frontUrl}auth/verification/${verificationKey}'>
            ${config.frontUrl}auth/verification/${verificationKey}
          </a></p>
          <p></p>
          <p><b>Мемолог - український розважальний портал.</b></p>
          <a href="https://memologist.com.ua">memologist.com.ua</a>`
  };
};

const createToken = (name: string, email: string) => {
  return jwt.sign(
    { name, email },
    process.env.JWT_SIGN_KEY || '123',
    { expiresIn: '7 days' }
  );
};

const sendMail = async (receiver: string, email: { subject: string, text: string }) => {
  const mailer = new Mailer(receiver, email);
  try {
    await mailer.sendMail();
  } catch (err) {
    Logger.err(err);
  }
};

export default { register, login, verify, resendMail };
