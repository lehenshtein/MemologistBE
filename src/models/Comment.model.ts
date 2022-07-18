import { IUser } from './User.model';
import { marks } from './marks.type';
import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  author: Partial<IUser>,
  text: string,
  score: number,
  marked?: marks,
  updatedAt: Date,
  createdAt: Date
}

export interface ICommentModel extends IComment, Document {}

const CommentSchema: Schema = new Schema({
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  text: { type: String, required: true },
  score: { type: Number, required: false, default: 0 },
  marked: { type: String, required: false, ref: 'User' }
}, { timestamps: true });
