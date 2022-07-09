import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Posts.model';

const createPost = (req: Request, res: Response, next: NextFunction) => {
  const { title, author, text, tags, imgUrl } = req.body;
  const post = new Post({
    _id: new mongoose.Types.ObjectId(),
    title,
    author,
    text,
    tags,
    imgUrl
  });

  return post.save()
    .then(post => res.status(201).json(post))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const readPost = (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;

  return Post.findById(postId)
    .populate('author')// form ref author we get author obj and can get his name
    .select('-__v')// get rid of field
    .then(post => post ? res.status(200).json(post) : res.status(404).json({ message: 'not found' }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
  return Post.find()
    .sort('-createdAt')
    .populate('author')
    .select('-__v')// get rid of field
    .then(posts => res.status(200).json(posts))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const updatePost = (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  console.log(req.body);

  return Post.findById(postId)
    .then(post => {
      if (post) {
        post.set(req.body);

        return post.save()
          .then(post => res.status(201).json(post))
          .catch(err => res.status(500).json({ message: 'Server error', err }));
      } else {
        res.status(404).json({ message: 'not found' });
      }
    })
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const deletePost = (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;

  return Post.findByIdAndDelete(postId)
    .then(post => post
      ? res.status(201).json({ message: 'deleted' })
      : res.status(404).json({ message: 'not found' }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

export default { createPost, readPost, readAll, updatePost, deletePost };
