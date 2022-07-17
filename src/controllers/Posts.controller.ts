import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post, { IPostModel, marks } from '../models/Posts.model';
import User, { IUserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/Authentication';

const createPost = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, text, tags, imgUrl } = req.body;
  const author = req.user?._id;
  if (!author) {
    return res.status(401).json({ message: 'Please sign-in or sign-up' });
  }
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

const readAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  let user: IUserModel | null = null;
  if (userId) {
    user = await User.findById(userId);
  }
  try {
    const posts: IPostModel[] = await Post.find()
      .sort('-createdAt')
      .populate('author', 'name -_id')
      .select('-__v'); // get rid of field

    if (user) {
      posts.map((post: IPostModel) => {
        return mapPostsMarks(post, user!);
      });
    }

    return res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }

  // return Post.find()
  //   .sort('-createdAt')
  //   .populate('author')
  //   .select('-__v')// get rid of field
  //   .then(posts => res.status(200).json(posts))
  //   .catch(err => res.status(500).json({ message: 'Server error', err }));
};
function mapPostsMarks (post: IPostModel, user: IUserModel): IPostModel {
  const mark: marks | undefined = user?.markedPosts.get(post._id);
  mark ? post.marked = mark : post.marked = 'default';
  return post;
}

const updatePost = (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;

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

const markPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id, markType } = req.body;
  console.log(req.user);
  // const userId = req.user?._id;
  // const user: IUserModel | null = await User.findById(userId);
  if (!req.user) {
    return res.status(401).json({ message: 'Please sign-in or sign-up' });
  }

  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  if (markType === 'liked') {
    post.score++;
    post.set('score', post.score);
  }
  if (markType === 'disliked') {
    post.score--;
    post.set('score', post.score--);
  }
  const recentPostStatus: marks | undefined = req.user.markedPosts.get(post._id);

  if (recentPostStatus) {
    req.user.markedPosts.delete(post._id);
  } else {
    req.user.markedPosts.set(post._id, markType);
    // user.set('markedPosts', { [post._id]: markType });
  }

  await req.user.save();
  return post.save()
    .then(post => res.status(201).json({ score: post.score }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

export default { createPost, readPost, readAll, updatePost, deletePost, markPost };
