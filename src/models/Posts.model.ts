import mongoose, { Document, Schema } from 'mongoose';
import { marks } from './marks.type';

export interface IPost {
  title: string;
  text: string;
  tags: string[];
  imgUrl: string;
  author: string;
  score: number,
  marked?: marks
}

export interface IPostModel extends IPost, Document {}

const PostSchema: Schema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  tags: { type: [String], required: false },
  imgUrl: { type: String, required: false },
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  score: { type: Number, required: false, default: 0 },
  marked: { type: String, required: false, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<IPostModel>('Post', PostSchema);
