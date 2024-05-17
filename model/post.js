const mongoose = require("mongoose");

const PostSchema = mongoose.Schema({
  asset_url: { type: String, default: "" },
  date: { type: Date, required: true },
  post_type: { type: String, required: true },
  text: { type: String, default: "" },
  views: { type: Number, default: 0 },
  reposts: { type: Number, default: 0 },
  reposted: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: { type: String, required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      replies: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          text: { type: String, required: true },
        },
      ],
    },
  ],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  original_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
});

module.exports = mongoose.model("Post", PostSchema);
