const verifyToken = require("../middlewares/verifyToken");
const Notification = require("../model/notification");

const router = require("express").Router();

router.post("/create", verifyToken, (req, res) => {
  const { type, content, to } = req.body;
  if (!type || !content || !to) {
    return res.json({ error: "A required parameter was missing!" });
  }
  if (to == req.user) {
    return res.json({ error: "User engaged in theirself" });
  }
  Notification.find({ type, content, to }).then((found) => {
    if (found.length > 0) {
      res.json({ error: "User already notified" });
    } else {
      const notification = new Notification({
        type,
        content,
        to,
        from: req.user,
        date: new Date(),
      });
      notification
        .save()
        .then(() => res.json({ message: "User notified" }))
        .catch((err) => {
          res.json({ error: err });
          console.log(err);
        });
    }
  });
});

router.post("/all", (req, res) => {
  Notification.find()
    .sort({ date: -1 })
    .populate("from to content")
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

router.post("/my", verifyToken, (req, res) => {
  Notification.find({ to: req.user })
    .populate("from to content")
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

module.exports = router;
