const verifyToken = require("../middlewares/verifyToken");
const Saved = require("../model/saved");
const router = require("express").Router();

router.get("/all", (req, res) => {
  res.json("Enzoi");
});

router.post("/save/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const savePost = new Saved({
    content: id,
    user: req.user,
    date: new Date(),
  });
  savePost
    .save()
    .then((saved) => res.json({ success: "Post saved" }))
    .catch((err) => {
      res.json({ error: "Something went wrong" });
      console.log(err);
    });
});

router.post("/my", verifyToken, (req, res) => {
  Saved.find({ user: req.user })
    .populate("user content")
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong" });
      console.log(err);
    });
});

module.exports = router;
