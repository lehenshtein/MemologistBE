declare global {
  namespace Express {
    interface Request {
      user?: import('../models/User.model').IUser,
      token_payload?: object
    }
  }
}