import { AuthRequest } from '../middleware/Authentication';
import { NextFunction, Response } from 'express';
import Comment, { ICommentCreate, ICommentModel } from '../models/Comment.model';
import mongoose from 'mongoose';
import { marks } from '../models/marks.type';
import { IUserModel } from '../models/User.model';

const createComment = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { text, post }: ICommentCreate = req.body;
  const author = req.user;
  if (!author) {
    return res.status(401).json({ message: 'Please sign-in or sign-up' });
  }
  if (author.status === 'banned' || author.status === 'muted') {
    return res.status(403).json({ message: 'You was banned or muted' });
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

const getComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const { postId } = req.params;
  try {
    const comments: ICommentModel[] = await Comment.find({ post: postId }, '-__v')
      .sort('-createdAt')
      .populate('author', 'name -_id');

    if (user) {
      comments.map((comment: ICommentModel) => {
        return mapCommentsMarks(comment, user!);
      });
    }
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
};

// TODO: make it separate method for comments and posts
function mapCommentsMarks (comment: ICommentModel, user: IUserModel): ICommentModel {
  const mark: marks | undefined = user?.markedComments.get(comment._id);
  mark ? comment.marked = mark : comment.marked = 'default';
  return comment;
}

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

const markComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, markType } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: 'Please sign-in or sign-up' });
  }

  const comment: ICommentModel | null = await Comment.findById(id);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }
  if (markType === 'liked') {
    comment.score++;
    comment.set('score', comment.score);
  }
  if (markType === 'disliked') {
    comment.score--;
    comment.set('score', comment.score--);
  }
  const recentCommentStatus: marks | undefined = req.user.markedComments.get(comment._id);

  if (recentCommentStatus) {
    req.user.markedComments.delete(comment._id);
  } else {
    req.user.markedComments.set(comment._id, markType);
  }

  await req.user.save();
  return comment.save()
    .then(comment => res.status(201).json({ score: comment.score }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

export default { createComment, getComments, getCommentsForUser, markComment };
