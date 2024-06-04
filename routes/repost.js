const verifyToken = require("../middlewares/verifyToken");
const router = require("express").Router();
const Post = require("../model/post");

//delete repost
router.post("/delete/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user;
  try {
    const deletedRepost = await Post.findOneAndDelete({ original_postId: id, user: userId });
    if (!deletedRepost) {
      return res.json({ error: "You are unauthorized to delete this repost" });
    }
    await Post.updateOne(
      { _id: id },
      { $pull: { reposted: req.user } }
    );
    await Post.updateMany(
      { original_postId: id },
      { $pull: { reposted: req.user } }
    );
    res.json({ success: "Repost deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


//create repost 
router.post("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;
    const post = await Post.findById(id);
    if (!post) {
      return res.json({ error: "Post not found" });
    }
    const originalPostId = post.original_postId ? post.original_postId : post._id;
    await Post.updateMany(
      { original_postId: originalPostId },
      { $push: { reposted: userId } }
    );
    await Post.updateOne(
      { _id: originalPostId },
      { $push: { reposted: userId } }
    );
    const repostedPost = new Post({
      asset_url: post.asset_url,
      date: Date.now(),
      post_type: post.post_type,
      text: post.text,
      views: post.views,
      reposted: post.reposted.concat(userId), 
      likes: post.likes,
      comments: post.comments,
      user: userId,
      original_user: post.original_user ? post.original_user : post.user,
      original_postId: originalPostId,
    });
    const savedRepostedPost = await repostedPost.save();
    await savedRepostedPost.populate("repostedBy original_user original_postId comments");
    res.json({ success: "Post reposted successfully", repostedPost: savedRepostedPost });
  } catch (error) {
    console.error("Error reposting post:", error);
    res.json({ error: "Something went wrong!" });
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
