const mongoose = require("mongoose");

const Post = mongoose.Schema({
  asset_url: { type: String, default: "" },
  date: { type: Date, required: true },
  post_type: { type: String, required: true },
  text: { type: String, default: "" },
  views: { type: Number, default: "0" },
  likes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: { type: String, required: true },
    },
  ],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Post", Post);
