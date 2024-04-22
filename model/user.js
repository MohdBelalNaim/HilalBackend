const mongoose = require("mongoose");

const User = mongoose.Schema({
  name: { type: String, required: true },
  accessId: { type: String, required: true },
  password: { type: String, required: true },
  location: { type: String, default: "" },
  category: { type: String, default: "" },
  gender: { type: String, default: "" },
  bio: { type: String, default: "" },
  profile_url: { type: String, default: "" },
  cover_url: { type: String, default: "" },
  isPremium: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", User);
