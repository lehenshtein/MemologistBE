import mongoose, { Document, Schema } from 'mongoose';
// import * as mongoose from 'mongoose';

export interface IUser {
  name: string,
  email: string,
  password: string,
  salt: string,
  role: 'superAdmin' | 'admin' | 'moderator' | 'user',
  rate: number,
  points: number,
  status: 'default' | 'muted' | 'banned',
  statusTillDate: Date | null,
  statusChangeDate: Date,
  createdDate: Date,
  createdPosts: string[],
  options: UserOptionsInterface
}

interface UserOptionsInterface {
  selectedLocale: 'en' | 'ua',
  locale: string,
  showContent: 'en' | 'ua' | 'all',
  nsfw: boolean
}

export interface IUserModel extends IUser, Document {
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, required: true, unique: true },
    password: { type: String, required: true, select: false },
    salt: { type: String, required: true, select: false },
    role: { type: String, required: true, default: 'user' },
    rate: { type: Number, required: true, default: 0 },
    points: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, default: 'default' },
    statusTillDate: { type: Date, required: false },
    statusChangeDate: { type: Date, required: false, default: Date.now },
    createdDate: { type: Date, required: false, default: Date.now },
    createdPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    options: {
      selectedLocale: { type: String, required: true, default: 'ua' },
      locale: { type: String, required: false },
      showContent: { type: String, required: true, default: 'all' },
      nsfw: { type: Boolean, required: true, default: false }
    }
  },
  {
    versionKey: false
  }
);

export default mongoose.model<IUserModel>('User', UserSchema);
