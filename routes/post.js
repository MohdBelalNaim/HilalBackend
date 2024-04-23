const verifyToken = require("../middlewares/verifyToken");
const Post = require("../model/post");
const router = require("express").Router();

router.post("/create", verifyToken, (req, res) => {
  const { text, post_type, asset_url } = req.body;
  const post = new Post({
    text,
    post_type,
    asset_url,
    user: req.user,
    date: new Date(),
  });
  post
    .save()
    .then(() => {
      res.json({ success: "Post created" });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

router.post("/all", (req, res) => {
  Post.find()
    .populate("user")
    .then((data) => {
      if (data) res.json({ data });
      else res.json({ error: "No posts found" });
    });
});

router.post("/user/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.json({ error: "A required parameter was missing!" });
  Post.find({ user: id })
    .populate("user")
    .then((data) => {
      if (data) res.json({ data });
      else res.json({ error: "No posts found" });
    });
});

router.post("/post-by-id/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.json({ error: "A required parameter was missing!" });
  Post.findById(id)
    .populate("user")
    .then((data) => {
      if (data) res.json({ data });
      else res.json({ error: "No posts found" });
    });
});

router.get("/update-views/:id", async (req, res) => {
  const { id } = req.params;
  const data = await Post.findOne({ _id: id });
  const currentViews = data.views;
  res.json({ currentViews });
  await Post.updateOne(
    { _id: id },
    {
      $set: {
        views: currentViews + 1,
      },
    }
  );
});

module.exports = router;
