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

router.post("/all", (req, res) => {
  Post.find({ user: { $ne: req.user } })
    .sort({ date: -1 })
    .populate(
      "user comments.user original_user comments.replies comments.replies.user comments.likes original_postId"
    )
    .then((data) => {
      if (data) res.json({ data });
      else res.json({ error: "No posts found" });
    });
});

router.post("/user/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.json({ error: "A required parameter was missing!" });
  Post.find({ user: id })
    .populate("user original_user")
    .then((data) => {
      if (data) res.json({ data });
      else res.json({ error: "No posts found" });
    });
});

router.post("/my-post", verifyToken, (req, res) => {
  Post.find({ user: req.user })
    .populate("user original_user")
    .sort({ date: -1 })
    .then((found) => {
      if (found.length > 0) {
        res.json({ found });
      } else {
        res.json({ error: "No posts found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong!" });
    });
});


router.post("/post-by-id/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.json({ error: "A required parameter was missing!" });
  Post.findById(id)
    .populate("user comments.user original_user")
    .then((data) => {
      if (data) res.json({ data });
      else res.json({ error: "No posts found" });
    });
});

router.get("/update-views/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Post.findOne({ _id: id });
    if (!data) {
      return res.status(404).json({ error: "Post not found" });
    }
    const currentViews = data.views;
    await Post.updateOne(
      { _id: id },
      {
        $set: {
          views: currentViews + 1,
        },
      }
    );
    res.json({ success: "Views updated successfully" });
  } catch (error) {
    console.error("Error updating views:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
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

//comment-reply
router.post("/reply/:postId/:commentId", verifyToken, async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user;
  const { text } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ error: "Post not found" });
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.json({ error: "Comment not found" });
    }
    if (!comment.replies) {
      comment.replies = [];
    }
    comment.replies.push({
      user: userId,
      text: text,
    });
    await post.save();
    res.json({ user: userId, text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.put("/comment/add-like/:commentId", verifyToken, async (req, res) => {
  const { commentId } = req.params;
  try {
    const post = await Post.findOne({ "comments._id": commentId });
    if (!post) {
      return res.json({ error: "Comment not found!" });
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.json({ error: "Comment not found" });
    }
    if (!comment.likes) {
      comment.likes = [];
    }
    comment.likes.push(req.user);
    await post.save();
    res.json({ success: "like added successfully" });
  } catch (error) {
    console.error(error);
    res.json({ error: "Something went wrong" });
  }
});

router.put("/comment/remove-like/:commentId", verifyToken, async (req, res) => {
  const { commentId } = req.params;
  try {
    const post = await Post.findOne({ "comments._id": commentId });
    if (!post) {
      return res.json({ error: "Comment not found!" });
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.json({ error: "Comment not found" });
    }
    comment.likes.pull(req.user);
    await post.save();
    res.json({ success: "Like removed successfully" });
  } catch (error) {
    console.error(error);
    res.json({ error: "Something went wrong" });
  }
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

router.post("/my-post-count", verifyToken, (req, res) => {
  Post.countDocuments({ user: req.user })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: "Something went wrong!" });
    });
});

router.post("/delete/:id", verifyToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user;
  Post.deleteOne({ _id: postId, user: userId })
    .then((result) => {
      if (result.deletedCount === 1) {
        res.json({ success: "Post deleted" });
      } else {
        res.json({ error: "Post not found" });
      }
    })
    .catch((err) => {
      console.error("Error deleting post:", err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

router.post("/edit/:id", verifyToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user;
  const { text } = req.body;
  Post.updateOne({ _id: postId, user: userId }, { $set: { text: text } })
    .then((updated) => {
      if (updated.nModified > 0) {
        res.json({ success: "Post edited successfully" });
      } else {
        res.json({
          error: "Post not found or you do not have permission to edit",
          postId,
          userId,
        });
      }
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

router.post("/my-post-count", verifyToken, (req, res) => {
  Post.countDocuments({ user: req.user })
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: "Something went wrong!" });
    });
});

module.exports = router;
