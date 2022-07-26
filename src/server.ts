import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logger from './library/logger';
import http from 'http';
import { AuthRoutes, CommentRoutes, PostsRoutes, UserRoutes } from './routes/routes';
import { addUserToRequest } from './middleware/Authentication';
import { checkHotPosts } from './helpers/HotPostsCron';

const router = express();
// Connect to mongo
mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' })
  .then(() => {
    Logger.log('connected to db');
    StartServer();
  })
  .catch((err) => {
    Logger.err('Unable to connect');
    Logger.err(err);
  });

// Start server only if/after mongo connect
function StartServer () {
  setInterval(function () {
    http.get('http://memologist-be.herokuapp.com/');
  }, 1200000); // every 20 minutes (1200000)

  if (config.env !== 'development') { // disabling cron for local env
    checkHotPosts();
  }

  router.use((req, res, next) => {
    // Log the request
    Logger.info(`Incoming -> method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

    res.on('finish', () => {
      // Log the response
      Logger.info(`Incoming -> method: [${req.method}] - Url: [${req.url}] - IP: [${req.socket
        .remoteAddress}] - Status: [${res.statusCode}]`);
    });

    next();
  });

  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  // Rules of API
  router.use((req, res, next) => {
    const allowedOrigins = ['https://memologist.herokuapp.com', 'http://localhost:4200', 'http://localhost:8080', 'https://memologist-be.herokuapp.com'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin!)) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
    } else {
      res.header('Access-Control-Allow-Origin', 'https://memologist.herokuapp.com');
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Expose-Headers', 'X-Page, X-Limit');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
    }

    next();
  });

  // auth middleware
  router.use(addUserToRequest as express.RequestHandler);

  // Routes
  router.use('/auth', AuthRoutes);
  router.use('/posts', PostsRoutes);
  router.use('/comment', CommentRoutes);
  router.use('/user', UserRoutes);

  // HealthCheck
  router.get('/ping', (req, res, next) => res.status(200).json({ message: 'ping successfull' }));

  // Error handling
  router.use((req, res, next) => {
    const error = new Error('not found');
    Logger.err(error);

    return res.status(404).json({ message: error.message });
  });

  http.createServer(router).listen(config.server.port, () => Logger.info(`Server is running on port:
    http://localhost:${config.server.port}`));
}
