import mongoose, { Document, Schema} from 'mongoose';

export interface IPost {
  title: string;
  text: string;
  tags: string[];
  imgUrl: string;
  author: string;
}

export interface IPostModel extends IPost, Document {}

const PostSchema: Schema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  tags: { type: [String], required: false },
  imgUrl: { type: String, required: false },
  author: { type: Schema.Types.ObjectId, required: true, ref: 'Author' },
}, { timestamps: true })

export default mongoose.model<IPostModel>('Post', PostSchema)
