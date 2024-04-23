const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const User = require("../model/user");

router.post("/all", (req, res) => {
  User.find()
    .then((found) => {
      if (found) res.json({ found });
      else res.json({ error: "No users found" });
    })
    .catch((err) => {
      res.json({ error: "Somethign went wrong!" });
      console.log(err);
    });
});

router.post("/user/:id", (req, res) => {
  const { id } = req.params;
  User.findById(id)
    .then((found) => {
      if (found) res.json(found);
      else res.json({ error: "No user found" });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

router.post("/update", verifyToken, (req, res) => {
  const {
    name,
    city,
    state,
    country,
    gender,
    category,
    bio,
    profile_url,
    cover_url,
  } = req.body;
  User.updateOne(
    { _id: req.user },
    {
      $set: {
        name,
        city,
        state,
        country,
        gender,
        bio,
        profile_url,
        cover_url,
        category,
      },
    }
  )
    .then(() => res.json({ success: "User updated" }))
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

module.exports = router;
