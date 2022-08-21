import { NextFunction, Request, Response } from 'express';

export const multipartConvert = (req: Request, res: Response, next: NextFunction) => {
  for (const [k, v] of Object.entries(req.body)) {
    try {
      req.body[k] = JSON.parse(v as string);
    } catch (err) {}
  }
  next();
};
