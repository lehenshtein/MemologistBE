import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import Logger from '../library/logger';
import { IPost } from '../models/Posts.model';
import { IComment } from '../models/Comment.model';

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
const imgRegex = /^(ftp|http|https):\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)/i;

export const Schema = {
  post: {
    create: Joi.object<IPost>({
      title: Joi.string().required().min(5).max(50),
      text: Joi.string().empty('').min(10).max(2000),
      tags: Joi.array().items(Joi.string()),
      imgUrl: Joi.string().empty(null).regex(imgRegex).max(240)
    }).or('text', 'imgUrl'),

    update: Joi.object<IPost>({
      title: Joi.string().required().min(5).max(50),
      text: Joi.string().empty('').min(10).max(2000),
      tags: Joi.array().items(Joi.string()),
      imgUrl: Joi.string().empty(null).regex(imgRegex).max(240)
    }).or('text', 'imgUrl')
  },

  comment: {
    create: Joi.object<IComment>({
      text: Joi.string().required().min(1).max(2000),
      post: Joi.string().regex(idRegex).required()
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
