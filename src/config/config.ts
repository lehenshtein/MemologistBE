import dotenv from 'dotenv';
dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const NODE_ENV = process.env.NODE_ENV || 'dev';
const CLUSTER_NAME = process.env.CLUSTER_NAME || '';
const MONGO_URL = NODE_ENV === 'prod'
  ? `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.${CLUSTER_NAME}.mongodb.net`
  : `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.${CLUSTER_NAME}.mongodb.net/`; // dev cluster should be here
const EMAIL_LOGIN = process.env.EMAIL_LOGIN || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const frontProdUrl = 'http://memologist.com.ua/';
const frontStageUrl = 'http://memologist.herokuapp.com/';
const frontLocalUrl = 'http://localhost:4200/';

const frontUrl = NODE_ENV === 'local' ? frontLocalUrl : NODE_ENV === 'dev' ? frontStageUrl : frontProdUrl;

export const config = {
  mongo: {
    url: MONGO_URL
  },
  server: {
    port: PORT
  },
  env: NODE_ENV,
  email: {
    login: EMAIL_LOGIN,
    password: EMAIL_PASSWORD
  },
  frontUrl
};
