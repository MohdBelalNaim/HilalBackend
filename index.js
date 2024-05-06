require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8080;

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

app.get("/", (req, res) => {
  res.json({ message: "All set!" });
});
app.listen(port, () => {
  console.log("App is running on ", port);
});
