import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import Logger from '../library/logger';
import { IPost } from '../models/Posts.model';

export const ValidateSchema = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body);

      next();
    } catch (err) {
      Logger.err(err);

      return res.status(422).json({ err });
    }
  };
};
const idRegex = /^[0-9a-fA=F]{24}$/;

export const Schema = {
  post: {
    create: Joi.object<IPost>({
      title: Joi.string().required().min(8).max(30),
      text: Joi.string().required().min(20).max(2000),
      tags: Joi.array().items(Joi.string()),
      imgUrl: Joi.string().optional().allow('', null).max(120)
    }),
    update: Joi.object<IPost>({
      title: Joi.string().required().min(8).max(30),
      text: Joi.string().required().min(20).max(2000),
      tags: Joi.array().items(Joi.string()),
      imgUrl: Joi.string().optional().allow('', null).max(120)
    })
  },

  authentication: {
    register: Joi.object({
      name: Joi.string().required().min(4).max(30),
      email: Joi.string().required().email({ tlds: { allow: false } }),
      password: Joi.string().required().min(8).max(40)
    }),
    login: Joi.object({
      email: Joi.string().required().email({ tlds: { allow: false } }),
      password: Joi.string().required().min(8).max(40)
    })
  }
};
