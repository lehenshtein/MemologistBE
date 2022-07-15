import { TokenInterface } from '../middleware/Authentication';
import { IUser } from './src/models/User.model';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser | null,
    tokenPayload?: TokenInterface
  }
}
