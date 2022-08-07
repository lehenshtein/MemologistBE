import express from 'express';
import controller from '../controllers/Authentication.controller';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';
import { requireAuthentication } from '../middleware/Authentication';

const router = express.Router();

router.post('/login', ValidateSchema(Schema.authentication.login), controller.login);
router.post('/register', ValidateSchema(Schema.authentication.register), controller.register);
router.get('/verification/resend', [requireAuthentication as express.RequestHandler], controller.resendMail);
router.get('/verification/:code', [requireAuthentication as express.RequestHandler], controller.verify);

export = router;
