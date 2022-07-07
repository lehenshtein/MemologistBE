import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logger from './library/logger';
import http from 'http';
import { AuthorsRoutes } from './routes/routes';

const router = express();
// Connect to mongo
console.log('conf', config.mongo.url);
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
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
      return res.status(200).json({});
    }

    next();
  });

  // Routes
  router.use('/authors', AuthorsRoutes);

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
