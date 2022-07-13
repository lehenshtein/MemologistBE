import express from 'express';
import controller from '../controllers/Posts.controller';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';

const router = express.Router();

router.post('', ValidateSchema(Schema.post.create), controller.createPost);
router.get('/:postId', controller.readPost);
router.get('', controller.readAll);
router.patch('/patch/:postId', ValidateSchema(Schema.post.update), controller.updatePost);
router.delete('/:postId', controller.deletePost);

export = router;
