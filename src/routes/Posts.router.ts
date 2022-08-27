import express from 'express';
import multer from 'multer';
import controller from '../controllers/Posts.controller';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';
import { requireAuthentication } from '../middleware/Authentication';
import { multipartConvert } from "../middleware/MultipartConvert";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024  // 2 MB
  }
});

const router = express.Router();

router.post('', [
  requireAuthentication as express.RequestHandler,
  upload.array('images', 10),
  multipartConvert,
  ValidateSchema(Schema.post.create)
], controller.createPost);
router.get('/:postId', controller.readPost);
router.get('', controller.readAll);
router.get('/user/:name', controller.getPostsForUser);
router.patch('/:postId', [
  requireAuthentication as express.RequestHandler,
  upload.array('images', 10),
  multipartConvert,
  ValidateSchema(Schema.post.update)
], controller.updatePost);
router.delete('/:postId', controller.deletePost);

router.post('/mark', [requireAuthentication as express.RequestHandler], controller.markPost);

export = router;
