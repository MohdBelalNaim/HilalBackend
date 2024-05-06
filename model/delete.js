const mongoose = require("mongoose");

const Delete = mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
    reason:{ type: String, required: true },
})

module.exports = mongoose.model("Delete",Delete)