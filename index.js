require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8080;
const socket = require("socket.io");
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to mongodb"))
  .catch((err) => console.log(err));

app.use("/auth", require("./routes/auth"));
app.use("/signup", require("./routes/signup"));
app.use("/user", require("./routes/users"));
app.use("/post", require("./routes/post"));
app.use("/notification", require("./routes/notification"));
app.use("/post-save", require("./routes/savepost"));
app.use("/message", require("./routes/message"));
app.use("/repost", require("./routes/repost"));

app.get("/", (req, res) => {
  res.json({ message: "All set!" });
});
const server = app.listen(port, () => {
  console.log("App is running on ", port);
});

const io = socket(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin:"https://hilal-xi.vercel.app/",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(onlineUsers);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    console.log(data.to);
    console.log(sendUserSocket);
    io.to(sendUserSocket).emit("msg-recieve", data);
  });
});
