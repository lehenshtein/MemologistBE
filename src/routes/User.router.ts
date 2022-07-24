import controller from '../controllers/User.controller';
import { requireAuthentication } from '../middleware/Authentication';
import express from 'express';

const router = express.Router();

router.get('', [requireAuthentication as express.RequestHandler], controller.getUser);

export = router;
