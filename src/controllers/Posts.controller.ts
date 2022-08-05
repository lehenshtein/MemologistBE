import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post, { IPostModel } from '../models/Posts.model';
import User, { IUser, IUserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/Authentication';
import { marks } from '../models/marks.type';
import { sort } from '../models/postsSort.type';

const createPost = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, text, tags, imgUrl } = req.body;
  const author: IUser = req.user?._id;
  if (!author) {
    return;
  }
  if (req.user?.status === 'banned' || req.user?.status === 'muted') {
    return res.status(403).json({ message: 'You was banned or muted' });
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

const readPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const user: IUserModel | null | undefined = req.user;

  try {
    const post: IPostModel | null = await Post.findById(postId)
      .populate('author', '-_id name')// form ref author we get author obj and can get his name
      .select('-__v -hotPointsCheck');// get rid of field
    // TODO: get rid of hotPoints field
    if (!post) {
      return res.status(404).json({ message: 'not found' });
    }
    if (user && post) {
      post.viewsAmount++;
      post.hotPoints += 0.01;
      await post.save();

      const mark: marks | undefined = user?.markedPosts.get(post._id);
      mark ? post.marked = mark : post.marked = 'default';
    }

    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', err });
  }
  //
  // return Post.findById(postId)
  //   .populate('author')// form ref author we get author obj and can get his name
  //   .select('-__v')// get rid of field
  //   .then(post => post ? res.status(200).json(post) : res.status(404).json({ message: 'not found' }))
  //   .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const readAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sort: sort = req.query.sort as sort || 'hot';

  try {
    const posts: IPostModel[] = await sortPosts(sort)
      .limit(+limit)
      .skip((+page - 1) * +limit)
      .populate('author', 'name -_id')
      .select('-__v -hotPoints -hotPointsCheck'); // get rid of field

    if (user) {
      posts.map((post: IPostModel) => {
        return mapPostsMarks(post, user!);
      });
    }
    res.header('X-Page', page.toString());
    res.header('X-Limit', limit.toString());

    return res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

function sortPosts (sort: sort) {
  if (sort === 'new') {
    return Post.find()
      .sort('-createdAt');
  }
  if (sort === 'best') {
    return Post.find()
      .sort('-score');
  }
  const lastDaysToTakePosts = 7;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - lastDaysToTakePosts);
  return Post.find({ createdAt: { $gt: d } })
    .sort('-hotPoints');
}

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
  if (!req.user) {
    return res.status(401).json({ message: 'Please sign-in or sign-up' });
  }

  const post: IPostModel | null = await Post.findById(id).populate('author', '_id');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const postAuthorId = post.author._id;
  const author: IUserModel | null = await User.findById(postAuthorId);

  if (!author) {
    return res.status(404).json({ message: 'Author of post is not found or removed' });
  }

  const recentPostStatus: marks | undefined = await req.user.markedPosts.get(post._id);

  if ((markType === 'liked' && recentPostStatus !== 'liked') ||
      (markType === 'disliked' && recentPostStatus === 'disliked')) {
    post.score++;
    post.hotPoints++;
    author.rate++;
  }
  if ((markType === 'disliked' && recentPostStatus !== 'disliked') ||
        (markType === 'liked' && recentPostStatus === 'liked')) {
    post.score--;
    post.hotPoints--;
    author.rate--;
    // post.set('score', post.score--);
  }

  if (recentPostStatus) {
    req.user.markedPosts.delete(post._id);
  } else {
    req.user.markedPosts.set(post._id, markType);
  }

  await req.user.save();
  await author.save();

  return post.save()
    .then(post => res.status(201).json({ score: post.score }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

export default { createPost, readPost, readAll, updatePost, deletePost, markPost };
