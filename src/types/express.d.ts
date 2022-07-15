import {TokenInterface} from "../middleware/Authentication";

declare global {
  namespace Express {
    interface Request {
      user?: import('../models/User.model').IUser | null,
      tokenPayload?: TokenInterface
    }
  }
}