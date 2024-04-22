require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to mongodb"))
  .catch((err) => console.log(err));

app.use("/auth", require("./routes/auth"));

app.listen(port, () => {
  console.log("App is running on ", port);
});
