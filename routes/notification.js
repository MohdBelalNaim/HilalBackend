const verifyToken = require("../middlewares/verifyToken");
const Notification = require("../model/notification");
const router = require("express").Router();

//create notification on any activity
router.post("/create", verifyToken, async (req, res) => {
  const { type, content, to } = req.body;
  if (!type || !content || !to) {
    return res.status(400).json({ error: "A required parameter was missing!" });
  }
  if (to == req.user) {
    return res.status(400).json({ error: "User cannot notify themselves" });
  }
  try {
    const existingNotification = await Notification.findOne({ type, content, from: req.user, to });

    if (existingNotification) {
      return res.status(400).json({ error: "Notification already exists" });
    }
    const notification = new Notification({
      type,
      content,
      to,
      read: false,
      from: req.user,
      date: new Date(),
    });
    await notification.save();
    res.json({ message: "User notified", notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong!" });
  }
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
    .sort({ date: -1 }) // Sort by createdAt field in descending order
    .populate("from to content")
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong!" });
      console.error(err);
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
