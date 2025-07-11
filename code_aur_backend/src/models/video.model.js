import mongoose, {Schema} from "mongoose";
import mongooseAggrigatePaginate from 'mongoose-aggregate-paginate-v2'
const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

videoSchema.plugin(mongooseAggrigatePaginate)
export const video = mongoose.model("Video", videoSchema)