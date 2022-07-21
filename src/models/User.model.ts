import mongoose, { Document, Schema } from 'mongoose';
import { marks } from './marks.type';

interface UserOptionsInterface {
  selectedLocale: 'en' | 'ua',
  locale: string,
  showContent: 'en' | 'ua' | 'all',
  nsfw: boolean
}

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
  updatedAt: Date,
  createdAt: Date,
  createdPosts: string[],
  markedPosts: Map<string, marks>,
  markedComments: Map<string, marks>,
  options: UserOptionsInterface
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
    createdPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    markedPosts: { type: Map, of: String, default: new Map() },
    markedComments: { type: Map, of: String, default: new Map() },
    options: {
      selectedLocale: { type: String, required: true, default: 'ua' },
      locale: { type: String, required: false },
      showContent: { type: String, required: true, default: 'all' },
      nsfw: { type: Boolean, required: true, default: false }
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

export default mongoose.model<IUserModel>('User', UserSchema);
