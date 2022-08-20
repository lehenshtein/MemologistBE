import { Express, NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import Crypto from 'crypto';
import ImageKit from 'imagekit';
import { fileTypeFromBuffer } from 'file-type';
import Post, { IPostModel } from '../models/Posts.model';
import User, { IUser, IUserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/Authentication';
import { marks } from '../models/marks.type';
import { sort } from '../models/postsSort.type';

type fileType = Express.Multer.File[] | undefined;

const IMAGEKIT_ID = process.env.IMAGEKIT_ID || '';
const IMAGEKIT_URL = `https://ik.imagekit.io/${IMAGEKIT_ID}`;

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: IMAGEKIT_URL
});

const validateContent = (content: Array<{type: string, text: string, imgUrl: string, imgName: string}>) => {
  content.forEach((item) => {
    if (item.type === 'text') {
      if (!item.text) {
        return { result: false, message: 'Text required for content type "text"' };
      }
    } else if (item.type === 'imgUrl') {
      if (!item.imgUrl) {
        return { result: false, message: 'Image URL required for content type "imgUrl"' };
      }
    } else if (item.type === 'imgName') {
      if (!item.imgName) {
        return { result: false, message: 'Image name required for content type "imgName"' };
      }
    } else {
      return { result: false, message: `Invalid content type ${item.type}` };
    }
  });
  return { result: true, message: '' };
};

const validateFiles = async (files: fileType) => {
  const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  for (const file of files!) {
    const fileType = await fileTypeFromBuffer(file.buffer);
    if (!fileType || !supportedMimeTypes.includes(fileType.mime)) {
      return { result: false, message: 'Unsupported file type' };
    }
  }
  return { result: true, message: '' };
};

const processImages = async (content: Array<{type: string, text: string, imgUrl: string, imgName: string}>, files: fileType) => {
  const fileMap = new Map();
  for (const file of files!) {
    fileMap.set(file.originalname, file);
  }

  const resultContent = [];
  for (const item of content) {
    if (item.type === 'text') {
      // item is text, no processing needed
      resultContent.push(item);
    } else {
      if (item.type === 'imgUrl' && item.imgUrl.includes(IMAGEKIT_URL)) {
        // image is already uploaded
        resultContent.push(item);
      } else {
        // need to upload the image
        const uploadResult = await uploadFile(item, fileMap);
        if (uploadResult.result) {
          resultContent.push(uploadResult.item);
        } else {
          return { result: false, message: uploadResult.message, content: [] };
        }
      }
    }
  }

  return { result: true, message: '', content: resultContent };
};

const uploadFile = async (item: {type: string, text: string, imgUrl: string, imgName: string}, fileMap: Map<string, Express.Multer.File>) => {
  const postData = {
    file: '',
    fileName: Crypto.randomBytes(32).toString('base64'),
    folder: '/user_uploads/'
  };

  if (item.type === 'imgUrl') {
    postData.file = item.imgUrl;
  } else {
    const file = fileMap.get(item.imgName);
    if (!file) {
      return { result: false, message: `File ${item.imgName} not found in request`, item: null };
    }
    postData.file = file.buffer.toString();
  }

  try {
    const response = await imagekit.upload(postData);
    return { result: true, message: '', item: { type: 'imgUrl', imgUrl: response.url } };
  } catch (err) {
    return { result: false, message: `Error while uploading image: ${err}`, item: null };
  }
};

const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, text, tags, imgUrl, content } = req.body;
  const author: IUser = req.user?._id;
  if (!author) {
    return;
  }
  if (req.user?.status === 'banned' || req.user?.status === 'muted') {
    return res.status(403).json({ message: 'You were banned or muted' });
  }
  const contentValidation = validateContent(content);
  if (!contentValidation.result) {
    return res.status(401).json({ message: contentValidation.message });
  }
  const fileValidation = await validateFiles(req.files as fileType);
  if (!fileValidation.result) {
    return res.status(401).json({ message: fileValidation.message });
  }
  const fileUpload = await processImages(content, req.files as fileType);
  if (!fileUpload.result) {
    return res.status(401).json({ message: fileUpload.message });
  }

  const post = new Post({
    _id: new mongoose.Types.ObjectId(),
    title,
    author,
    text,
    tags,
    imgUrl,
    content: fileUpload.content
  });

  return post.save()
    .then(post => res.status(201).json(post))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const updatePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;

  return Post.findById(postId)
    .then(async post => {
      if (post) {
        if (post.author._id !== req.user?._id) {
          return res.status(403).json({ message: 'Not your post' });
        }

        const contentValidation = validateContent(req.body.content);
        if (!contentValidation.result) {
          return res.status(401).json({ message: contentValidation.message });
        }
        const fileValidation = await validateFiles(req.files as fileType);
        if (!fileValidation.result) {
          return res.status(401).json({ message: fileValidation.message });
        }
        const fileUpload = await processImages(req.body.content, req.files as fileType);
        if (!fileUpload.result) {
          return res.status(401).json({ message: fileUpload.message });
        }
        req.body.content = fileUpload.content;

        post.set(req.body);

        return post.save()
          .then(post => res.status(201).json(post))
          .catch(err => res.status(500).json({ message: 'Server error', err }));
      } else {
        return res.status(404).json({ message: 'not found' });
      }
    })
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
    return res.status(500).json({ message: 'Server error', err });
  }
};

const getPostsForUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user: IUserModel | null | undefined = req.user;
  const { name } = req.params;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const sort: sort = 'new';

  let authorId;
  if (name && name !== 'undefined') {
    try {
      authorId = await User.findOne({ name }, '_id');
      if (!authorId) {
        return res.status(404).json({ message: 'Author not found' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Server error', err });
    }
  } else {
    return res.status(400).json({ message: 'Invalid username' });
  }

  try {
    const posts: IPostModel[] = await Post.find({ author: authorId })
      .sort(sort)
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
    return res.status(500).json({ message: 'Server error', err });
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

const deletePost = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const user = req.user;

  if (!user || user.role !== 'superAdmin') {
    return res.status(400).json({ message: 'Not enough permissions' });
  }

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

export default { createPost, readPost, readAll, updatePost, deletePost, markPost, getPostsForUser };
