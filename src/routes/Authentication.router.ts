import express from 'express';
import controller from '../controllers/Authentication.controller';
import { Schema, ValidateSchema } from '../middleware/ValidateSchema';

const router = express.Router();

router.post('/login', ValidateSchema(Schema.authentication.login), controller.login);
router.post('/register', ValidateSchema(Schema.authentication.register), controller.register);

export = router;