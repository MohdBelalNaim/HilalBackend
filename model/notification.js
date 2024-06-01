const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  date: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);

