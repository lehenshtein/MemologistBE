import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import Logger from '../library/logger';
import { IAuthor } from '../models/Authors.model';
import { IBook } from '../models/Books.model';
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

export const Schema = {
  author: {
    create: Joi.object<IAuthor>({
      name: Joi.string().required()
    }),
    update: Joi.object<IAuthor>({
      name: Joi.string().required()
    })
  },

  book: {
    create: Joi.object<IBook>({
      title: Joi.string().required(),
      author: Joi.string().regex(/^[0-9a-fA=F]{24}$/).required()
    }),
    update: Joi.object<IBook>({
      title: Joi.string().required(),
      author: Joi.string().regex(/^[0-9a-fA=F]{24}$/).required()
    })
  },

  post: {
    create: Joi.object<IPost>({
      title: Joi.string().required().min(8).max(20),
      text: Joi.string().required().min(20).max(2000),
      tags: Joi.array().items(Joi.string()),
      imgUrl: Joi.string().optional().allow('', null).max(120),
      author: Joi.string().regex(/^[0-9a-fA=F]{24}$/).required()
    }),
    update: Joi.object<IPost>({
      title: Joi.string().required().min(8).max(20),
      text: Joi.string().required().min(20).max(2000),
      tags: Joi.array().items(Joi.string()),
      imgUrl: Joi.string().optional().allow('', null).max(120),
      author: Joi.string().regex(/^[0-9a-fA=F]{24}$/).required()
    })
  }
};
