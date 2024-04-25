const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middlewares/verifyToken");

router.post("/signup", async (req, res) => {
  const { accessId, password, name } = req.body;
  if (!accessId || !password || !name) {
    return res.json({ error: "All feilds are required!" });
  }
  const checkUser = await User.findOne({ accessId });
  if (checkUser) {
    return res.json({ error: "This email or password is already in use!" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    name,
    accessId,
    password: hashedPassword,
  });

  user
    .save()
    .then((saved) => res.json({ success: "Signup successful!" }))
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

router.post("/login", async (req, res) => {
  const { accessId, password } = req.body;
  if (!accessId || !password) {
    return res.json({ error: "All feilds are required!" });
  }
  const user = await User.findOne({ accessId });
  if (user) {
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET);
      res.json({ token });
    } else {
      res.json({ error: "Invalid email or password" });
    }
  } else {
    return res.json({
      error: "This email is not registered with HilalLink",
    });
  }
});

router.post("/password-reset", verifyToken, async (req, res) => {
  const { password } = req.body;
  if (!password)
    return res.json({ error: "A required parameter was missing!" });
  const hashedPassword = await bcrypt.hash(password, 12);
  User.updateOne(
    { _id: req.user },
    {
      $set: { password: hashedPassword },
    }
  )
    .then(() => res.json({ success: "Password updated successfully!" }))
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

module.exports = router;
