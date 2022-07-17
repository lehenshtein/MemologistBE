import { IUserModel } from './src/models/User.model';
import { TokenInterface } from './src/middleware/Authentication';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUserModel | null,
    tokenPayload?: TokenInterface
  }
  interface Response {
    user?: IUserModel | null,
    tokenPayload?: TokenInterface
  }
}
