import { marks } from './marks.type';
import mongoose, { Document, Schema } from 'mongoose';
import { IPost } from './Posts.model';
import { IUserModel } from './User.model';

export interface ICommentCreate {
  text: string,
  post: string
}

export interface IComment {
  author: Partial<IUserModel>,
  // authorName: string,
  text: string,
  score: number,
  marked?: marks,
  post: Partial<IPost>,
  updatedAt: Date,
  createdAt: Date
}

export interface ICommentModel extends IComment, Document {}

const CommentSchema: Schema = new Schema({
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  // authorName: { type: String, required: true },
  text: { type: String, required: true },
  score: { type: Number, required: false, default: 0 },
  marked: { type: String, required: false, default: 'default' },
  post: { type: Schema.Types.ObjectId, required: true, ref: 'Post' }
}, { timestamps: true });

export default mongoose.model<ICommentModel>('Comment', CommentSchema);
