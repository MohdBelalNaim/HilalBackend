const verifyToken = require("../middlewares/verifyToken");
const Notification = require("../model/notification");
const router = require("express").Router();

//create notification on any activity
router.post("/create", verifyToken, (req, res) => {
  const { type, content, to } = req.body;

  if (!type || !content || !to) {
    return res.json({ error: "A required parameter was missing!" });
  }

  if (to == req.user) {
    return res.json({ error: "User engaged in themselves" });
  }

  const notification = new Notification({
    type,
    content,
    to,
    read: false,
    from: req.user,
    date: new Date(),
  });

  notification
    .save()
    .then(() => res.json({ message: "User notified", notification }))
    .catch((err) => {
      res.json({ error: err });
      console.log(err);
    });
});



//all notification
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

//notification to me
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

//notification count
router.post("/count",verifyToken, async (req, res) => {
  Notification.find({ read: false, to: req.user })
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

//notification read
router.post("/uncount", verifyToken, async (req, res) => {
  Notification.updateMany({ read: false, to: req.user }, { $set: { read: true } })
    .then((result) => {
      res.json({ message: "Notifications marked as read", result });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});


module.exports = router;
