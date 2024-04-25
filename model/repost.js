const mongoose = require("mongoose")

const Repost = mongoose.Schema({
    content:{type:mongoose.Schema.Types.ObjectId, ref:"Post"},
    user:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
    date:{type:Date, required:true}
})

module.exports = mongoose.model("Repost",Repost)