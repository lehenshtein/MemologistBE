import mongoose, { Document, Schema } from 'mongoose';
import { marks } from './marks.type';
import { IUserModel } from './User.model';

export interface IPost {
  title: string;
  text: string;
  tags: string[];
  imgUrl: string;
  author: Partial<IUserModel>;
  score: number,
  viewsAmount: number,
  commentsAmount: number,
  marked?: marks,
  hotPoints: number,
  hotPointsCheck: {
    lastHotCheckDate: number,
    lastHotCheckPoints: number
  }
}

export interface IPostModel extends IPost, Document {}

const ContentSchema = new Schema({
  type: { type: String, required: true },
  imgUrl: { type: String, required: false },
  imgName: { type: String, required: false },
  text: { type: String, required: false }
});

const PostSchema: Schema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: false },
  tags: { type: [String], required: false },
  imgUrl: { type: String, required: false },
  content: { type: [ContentSchema], required: false },
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  score: { type: Number, required: false, default: 0 },
  viewsAmount: { type: Number, required: false, default: 0 },
  commentsAmount: { type: Number, required: false, default: 0 },
  marked: { type: String, required: false, default: 'default', ref: 'User' },
  hotPoints: { type: Number, required: true, default: 0 },
  hotPointsCheck: {
    lastHotCheckDate: { type: Number, required: true, default: new Date().getTime() },
    lastHotCheckPoints: { type: Number, required: true, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model<IPostModel>('Post', PostSchema);
