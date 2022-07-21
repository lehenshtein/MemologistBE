import mongoose from 'mongoose';
import { config } from './src/config/config';
import Logger from './src/library/logger';
import User, { IUserModel } from './src/models/User.model';
import Post, { IPostModel } from './src/models/Posts.model';

// Connect to mongo
mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' })
  .then(() => {
    Logger.log('connected to db');
    // updateUsersDB().then(res => Logger.log(res));
    updatePostsDB().then(res => Logger.log(res));
  })
  .catch((err) => {
    Logger.err('Unable to connect');
    Logger.err(err);
  });

const updateUsersDB = async () => {
  const users: IUserModel[] = await User.find();
  users.map((user) => {
    if (!user.markedComments) {
      user.set({
        ...user,
        markedComments: new Map()
      });
    }
    return user;
    // return user.save(); // run after data is ok
  });
  Logger.log(users);
};

const updatePostsDB = async () => {
  const posts: IPostModel[] = await Post.find();
  posts.map((post) => {
    if (!post.viewsAmount && !post.commentsAmount) {
      post.set({
        ...post,
        viewsAmount: 0,
        commentsAmount: 0
      });
    }
    return post;
    // return post.save(); // run after data is ok
  });
  Logger.log(posts);
};
