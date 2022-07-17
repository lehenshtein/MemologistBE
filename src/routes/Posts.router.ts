import express from 'express';
import controller from '../controllers/Posts.controller';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';
import { requireAuthentication } from '../middleware/Authentication';

const router = express.Router();

router.post('', [requireAuthentication as express.RequestHandler], ValidateSchema(Schema.post.create), controller.createPost);
router.post('/mark', [requireAuthentication as express.RequestHandler], controller.markPost);
router.get('/:postId', controller.readPost);
router.get('', controller.readAll);
router.patch('/:postId', ValidateSchema(Schema.post.update), controller.updatePost);
router.delete('/:postId', controller.deletePost);

export = router;
