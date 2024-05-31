const verifyToken = require("../middlewares/verifyToken");
const router = require("express").Router();
const Post = require("../model/post");

//delete repost
router.post("/delete/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user;
  Post.findOneAndDelete({ original_postId: id, user: userId })
    .then((deletedRepost) => {
      if (!deletedRepost) {
        return res.json({ error: "You are unauthorized to this post" });
      }
      res.json({ success: "Repost deleted successfully" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
  await Post.updateOne({ _id: id }, { $inc: { reposts: -1 } });
  await Post.updateOne(
    { _id: id },
    {
      $pull: { reposted: req.user },
    }
  );
});

router.post("/repost-delete/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user;
  try {
    const deletedRepost = await Post.findOneAndDelete({ _id: id, user: userId });
    if (!deletedRepost) {
      return res.json({ error: "You are unauthorized to delete this post" });
    }
    await Post.updateOne(
      { _id: deletedRepost.original_postId },
      {
        $pull: { reposted: userId },
      }
    );
    res.json({ success: "Repost deleted successfully" });
  } catch (err) {
    console.log(err);
    res.json({ error: "Something went wrong" });
  }
});


//repost post
router.post("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    await Post.updateOne(
      { _id: id },
      {
        $push: { reposted: req.user },
      }
    );
    const repostedPost = new Post({
      asset_url: post.asset_url,
      date: Date.now(),
      post_type: post.post_type,
      text: post.text,
      views: post.views,
      reposted: post.reposted.concat(req.user),
      likes: post.likes,
      comments: post.comments,
      user: req.user,
      original_user: post.user,
      original_postId: post._id,
    });
    await repostedPost.save();
    res.json({ success: "Post reposted successfully", repostedPost });
  } catch (error) {
    console.error("Error reposting post:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});


//repost done by me
router.get("/my-reposts", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({
      $and: [{ user: req.user }, { original_user: { $exists: true } }],
    })
    .populate("user original_user")
    .sort({ date: -1 })
    res.json({ posts });
  } catch (error) {
    console.error("Error fetching posts with users:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

//repost done by other user
router.get("/user-repost/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await Post.find({
      $and: [{ user: id }, { original_user: { $exists: true } }],
    })
    .populate("user original_user")
    .sort({ date: -1 })
    res.json({ posts });
  } catch (error) {
    console.error("Error fetching posts with users:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

module.exports = router;
