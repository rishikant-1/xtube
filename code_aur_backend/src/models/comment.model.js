import mongoose, {Schema} from "mongoose";
import mongooseAggrigatePaginate from 'mongoose-aggregate-paginate-v2'

const commentSchema = new Schema(
  {
    video: {
      type: mongoose.Types.ObjectId,
      ref: "Video"
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    content: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
)
commentSchema.plugin(mongooseAggrigatePaginate)
export const Comment = mongoose.model("Comment", commentSchema)