import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    tweetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalComment: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
