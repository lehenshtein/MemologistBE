import { AuthRequest } from '../middleware/Authentication';
import { NextFunction, Response, Request } from 'express';
import Comment, { ICommentCreate, ICommentModel } from '../models/Comment.model';
import mongoose from 'mongoose';

const createComment = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { text, post }: ICommentCreate = req.body;
  const author = req.user;
  if (!author) {
    return res.status(401).json({ message: 'Please sign-in or sign-up' });
  }
  const comment = new Comment({
    _id: new mongoose.Types.ObjectId(),
    author,
    text,
    post
  });

  return comment.save()
    .then(comment => res.status(201).json(comment))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const getComments = async (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  try {
    const comments: ICommentModel[] = await Comment.find({ post: postId }, '-__v')
      .sort('-createdAt')
      .populate('author', 'name -_id');
    // comments.map(comment => comment.author.populate('name'));
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

const getCommentsForUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user?._id) {
    return res.status(401).json({ message: 'Please sign-in or sign-up' });
  }
  try {
    const comment: ICommentModel[] = await Comment.find({ author: user?._id })
      .sort('-createdAt')
      .populate('author', 'name -_id')
      .select('-__v');

    return res.status(201).json(comment);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

export default { createComment, getComments, getCommentsForUser };
