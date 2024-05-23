const mongoose = require("mongoose");

const Message = mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    date: { type: Date, required: true },
    isSent: { type: Boolean, default: false },
    isReceived: { type: Boolean, default: false }
});

module.exports = mongoose.model("Message", Message);
