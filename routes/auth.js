const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middlewares/verifyToken");

//signup route
router.post("/signup", async (req, res) => {
  const { accessId, password, name, confirmpassword } = req.body;
  if (!accessId || !password || !name || !confirmpassword) {
    return res.json({ error: "All fields are required!" });
  }

  if (password !== confirmpassword) {
    return res.json({
      error: "Password and confirm password should be the same!",
    });
  }

  const checkUser = await User.findOne({ accessId });
  if (checkUser) {
    return res.json({ error: "This email is already in use!" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    name,
    accessId,
    password: hashedPassword,
  });

  user
    .save()
    .then((savedUser) => {
      const token = jwt.sign({ user: savedUser._id }, process.env.JWT_SECRET);
      res.json({
        accessId: savedUser.accessId,
        name: savedUser.name,
        token: token,
      });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

//login route
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

//google-user
router.post("/google-login", async (req, res) => {
  const { name, accessId, photo } = req.body;
  if (!name || !accessId) {
    return res.json({ error: "Name and accessId are required" });
  }
  try {
    let user = await User.findOne({ accessId });
    if (!user) {
      const randomPassword = generateRandomPassword(12);
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = new User({
        name,
        accessId,
        password: hashedPassword,
        profile_url: photo,
      });
      await user.save();
      const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET);
      return res.json({ token });
    }
    if (user.profile_url !== photo) {
      user.profile_url = photo;
      await user.save();
    }

    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error("Error finding or updating user:", error);
    res.json({ error: "Server error" });
  }
});

// Function to generate a random password
function generateRandomPassword(length) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

//password-reset route
router.post("/password-reset", verifyToken, async (req, res) => {
  const { password, confirmpassword } = req.body;
  if (!password || !confirmpassword)
    return res.json({ error: "A required parameter was missing!" });
  if (password !== confirmpassword) {
    return res.json({
      error: "Password and Confirm Password should be the same",
    });
  }
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

//login from final page
router.post("/final/login", async (req, res) => {
  const { accessId } = req.body;
  const user = await User.findOne({ accessId });
  if (user) {
    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.json({ error: "Something went wrong" });
  }
});

//forgot password
router.post("/forgot-password", async (req, res) => {
  const { accessId } = req.body;
  if (!accessId) {
    return res.json({ error: "Email is required" });
  }
  const user = await User.findOne({ accessId });
  if (!user) {
    return res.json({ error: "This email is not registered with HilalLink" });
  }
});

//password-change after forgot-password
router.post("/password-change", async (req, res) => {
  const { accessId, password, confirmpassword } = req.body;
  if (!accessId || !password || !confirmpassword) {
    return res.json({ error: "A required parameter was missing!" });
  }
  if (password !== confirmpassword) {
    return res.json({
      error: "Password and Confirm Password should be the same",
    });
  }
  try {
    const user = await User.findOne({ accessId: accessId });
    if (!user) {
      return res.json({ error: "This email is not registered with HilalLink" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong!" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.updateOne(
      { accessId: accessId },
      {
        $set: { password: hashedPassword },
      }
    );
    res.json({ success: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// router.post("/my-id", verifyToken, (req, res) => {
//   User.findOne({ _id: req.user }).then((user) => res.json({ id: user._id }));
// });

router.post("/make-private", verifyToken, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user },
    {
      $set: { isPrivate: true },
    },
    {
      new: true,
    }
  )
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      rmSync.json({ error: err });
    });
});

router.post("/make-public", verifyToken, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user },
    {
      $set: { isPrivate: false },
    },
    {
      new: true,
    }
  )
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      rmSync.json({ error: err });
    });
});

module.exports = router;
