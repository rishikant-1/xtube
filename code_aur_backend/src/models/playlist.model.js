import mongoose, {Schema} from "mongoose";
const playListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    videos: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Video"
      }
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)


export const PlayList = mongoose.model("PlayList", playListSchema)