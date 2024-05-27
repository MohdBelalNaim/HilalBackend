const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const Message = require("../model/messages");

//send message to user by id
router.post("/send/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;
    const { content } = req.body;

    const message = new Message({
      from: userId,
      to: id,
      content: content,
      date: new Date(),
      isSent: true,
    });

    await message.save();

    res.json({ success: "Message sent successfully" });
  } catch (error) {
    res.json({ error: "Something went wrong", er: error });
  }
});

//all message of my (either to or form)
router.post("/my", verifyToken, (req, res) => {
  const userId = req.user;
  Message.find({ $or: [{ from: userId }, { to: userId }] })
    .populate("to from")
    .then((found) => {
      if (found.length > 0) {
        res.json(found);
      } else {
        res.json({ error: "No messages found for the user" });
      }
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
    });
});

//chat user by id
router.post("/by-chat/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  Message.find({
    $or: [
      {
        from: req.user,
        to: id,
      },
      {
        from: id,
        to: req.user,
      },
    ],
  })
    .then((found) => res.json({ found }))
    .catch((err) => {
      res.json({ error: "Can't retrieve chats" });
    });
});

module.exports = router;
