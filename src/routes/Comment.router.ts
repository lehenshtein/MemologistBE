import express from 'express';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';
import { requireAuthentication } from '../middleware/Authentication';
import controller from '../controllers/Comment.controller';

const router = express.Router();

router.post('', [requireAuthentication as express.RequestHandler], ValidateSchema(Schema.comment.create), controller.createComment);
router.get('/:postId', controller.getComments);
router.get('', controller.getCommentsForUser);

router.post('/mark', [requireAuthentication], controller.markComment);

export = router;
