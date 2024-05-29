const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middlewares/verifyToken");

//signup route
router.post("/signup", async (req, res) => {
  const { accessId, password, name, confirmpassword } = req.body;
  if (!accessId || !password || !name || !confirmpassword) {
    return res.status(400).json({ error: "All fields are required!" });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(accessId)) {
    return res.status(400).json({ error: "Invalid email format!" });
  }
  const namePattern = /^[a-zA-Z0-9 ]*$/;
  if (!namePattern.test(name)) {
    return res.status(400).json({ error: "Name must be alphanumeric, alphabets, numeric, or contain spaces!" });
  }
  const passwordPattern = /^[\x20-\x7E]*$/;
  if (!passwordPattern.test(password) || !passwordPattern.test(confirmpassword)) {
    return res.status(400).json({ error: "Password must be valid" });
  }
  if (password !== confirmpassword) {
    return res.status(400).json({
      error: "Password and confirm password should be the same!",
    });
  }
  try {
    const checkUser = await User.findOne({ accessId });
    if (checkUser) {
      return res.status(409).json({ error: "This email is already in use!" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      accessId,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    const token = jwt.sign({ user: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({
      accessId: savedUser.accessId,
      name: savedUser.name,
      token: token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong!" });
  }
});



//login route
router.post("/login", async (req, res) => {
  const { accessId, password } = req.body;
  if (!accessId || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }
  try {
    const user = await User.findOne({ accessId });
    if (!user) {
      return res.json({ error: "This email is not registered with HilalLink" });
    }
    if (!user.isVerified) {
      return res.json({ error: "Email is not verified", accessId });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.json({ error: "Server error" });
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

//make account private
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

//make account public
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
