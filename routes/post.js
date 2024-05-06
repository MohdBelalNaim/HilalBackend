const verifyToken = require("../middlewares/verifyToken");
const Post = require("../model/post");
const saved = require("../model/saved");
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

router.post("/all", verifyToken, (req, res) => {
  Post.find({ user: { $ne: req.user } })
    .sort({ date: -1 })
    .populate("user comments.user")
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

router.post("/my-post",verifyToken, (req, res) => {
  Post.find({ user: req.user })
  .populate("user")
  .then((found) => {
    if (found) res.json({ found });
    else res.json({ error: "No posts found" });
  })
  .catch((err) => {
    res.json({ error: "Something went wrong!" });
    console.log(err);
  });
});

router.post("/post-by-id/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.json({ error: "A required parameter was missing!" });
  Post.findById(id)
    .populate("user comments.user")
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

router.put("/add-comment/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  if (!comment) return res.json({ error: "A required parameter was missing!" });
  Post.findByIdAndUpdate(
    id,
    {
      $push: {
        comments: {
          user: req.user,
          text: comment,
        },
      },
    },
    {
      new: true,
    }
  )
    .then((updated) => {
      res.json({ updated });
    })
    .catch({ error: "Something went wrong!" });
});

router.put("/remove-comment/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  if (!comment) return res.json({ error: "A required parameter was missing!" });
  Post.findByIdAndUpdate(
    id,
    {
      $pull: {
        comments: {
          user: req.user,
          text: comment,
        },
      },
    },
    {
      new: true,
    }
  )
    .populate("comments.user")
    .then((updated) => {
      res.json({ updated });
    })
    .catch({ error: "Something went wrong!" });
});

router.put("/add-like/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  Post.findByIdAndUpdate(
    id,
    {
      $push: { likes: req.user },
    },
    { new: true }
  )
    .then((updated) => res.json({ updated }))
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

router.put("/remove-like/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  Post.findByIdAndUpdate(
    id,
    {
      $pull: { likes: req.user },
    },
    { new: true }
  )
    .then((updated) => res.json({ updated }))
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

router.post("/save-post/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const savedPost = new saved({
    content: id,
    user: req.user,
    date: new Date(),
  });
  savedPost
    .save()
    .then(() => res.json({ success: "Post saved" }))
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});
router.post("/remove-save-post/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  saved
    .deleteOne({ $and: [{ user: req.user, content: id }] })
    .then(() => {
      res.json({ success: "Post unsaved" });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

module.exports = router;
