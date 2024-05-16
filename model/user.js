const mongoose = require("mongoose");

const User = mongoose.Schema({
  name: { type: String, required: true },
  accessId: { type: String, required: true },
  password: { type: String, required: true },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  category: { type: String, default: "" },
  gender: { type: String, default: "" },
  bio: { type: String, default: "" },
  profile_url: { type: String, default: "" },
  cover_url: { type: String, default: "" },
  isPremium: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("User", User);
