const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const User = require("../model/user");
const Delete = require("../model/delete");
const Post = require("../model/post");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Notification = require("../model/notification")
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B50}-\u{2B50}]|[\u{23E9}-\u{23EF}]|[\u{23F0}-\u{23F3}]|[\u{25B6}-\u{25B6}]|[\u{25C0}-\u{25C0}]|[\u{2600}-\u{2600}]|[\u{26A1}-\u{26A1}]|[\u{2705}-\u{2705}]|[\u{274C}-\u{274C}]|[\u{2B06}-\u{2B06}]|[\u{2B07}-\u{2B07}]|[\u{2934}-\u{2934}]|[\u{2935}-\u{2935}]|[\u{2B05}-\u{2B05}]|[\u{2194}-\u{2199}]|[\u{21AA}-\u{21AA}]|[\u{21A9}-\u{21A9}]/u;

//email config starts
const mailTransport = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  secure: true,
  secureConnection: false, 
  tls: {
    ciphers: "SSLv3",
  },
  requireTLS: true,
  port: 465,
  debug: true,
  auth: {
    user: "noreply@hilallink.com",
    pass: "Ahmedkhaki@hilallink@786",
  },
});

//all  user
router.post("/all", verifyToken, (req, res) => {
  User.find({ _id: { $ne: req.user } })
    .then((found) => {
      if (found) res.json({ found });
      else res.json({ error: "No users found" });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

//user by id
router.post("/by-id/:id", (req, res) => {
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

//update user information
router.post("/update", verifyToken, async (req, res) => {
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

  if (!name || !city || !state || !country || !gender || !category || !bio ) {
    return res.json({ error: "All fields are required!" })
  }

  if (emojiRegex.test(name) || emojiRegex.test(city) || emojiRegex.test(state) || emojiRegex.test(country) || emojiRegex.test(bio)) {
    return res.json({ error: "Emojis are not allowed" })
  }

  try {
    const user = await User.findOne({ _id: req.user });
    if (!user) {
      return res.json({ error: "User not found" })
    }

    user.name = name;
    user.city = city;
    user.state = state;
    user.country = country;
    user.gender = gender;
    user.category = category;
    user.bio = bio;
    user.profile_url = profile_url;
    user.cover_url = cover_url;

    await user.save();
    return res.json({ success: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.json({ error: "Something went wrong" });
  }
});

//my details
router.post("/my", verifyToken, (req, res) => {
  User.findOne({ _id: req.user })
    .then((found) => {
      if (found) res.json(found);
      else res.json({ error: "No user found" });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

//top-users
router.post("/top-users", verifyToken, (req, res) => {
  User.find({ _id: { $ne: req.user } })
    .limit(6)
    .then((found) => {
      if (found) res.json({ found });
      else res.json({ error: "No users found" });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});

//delete account
router.post("/delete-account", verifyToken, async (req, res) => {
  const { reason, password } = req.body;
  if (!reason || !password) {
    return res.json({ error: "All fields are required" });
  }
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.json({ error: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.json({ error: "Invalid password" });
    }
    await Post.deleteMany({ user: req.user });
    await Post.updateMany(
      {},
      { $pull: { comments: { user: req.user } } }
    );
    await Post.updateMany(
      {},
      { $pull: { "comments.$[].replies": { user: req.user } } }
    );
    await User.updateMany(
      { followers: req.user },
      { $pull: { followers: req.user } }
    );
    await User.updateMany(
      { following: req.user },
      { $pull: { following: req.user } }
    );

    const deletionRequest = new Delete({
      user: req.user,
      reason: reason,
    });
    await deletionRequest.save();
    await User.findByIdAndDelete(req.user);
    return res.json({
      success: "Account and all related data deleted successfully!",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
});

//change password email verification
router.post("/change-password-email-verification",verifyToken,async (req, res) => {
    try {
      const foundUser = await User.findOne({ _id: req.user });
      if (!foundUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const mailOptions = {
        from: "noreply@hilallink.com",
        to: foundUser.accessId,
        subject: "Password Change Notification",
        html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Change Notification</title>
          <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
        </head>
        <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
            <tbody>
              <tr>
                <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
                  <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
                    <tbody>
                      <tr>
                        <td style="padding: 40px 0px 0px;">
                          <div style="text-align: left;">
                            <div style="padding-bottom: 20px;"><img src="https://i.ibb.co/ZfjD91W/logo.jpg" alt="Company" style="width: 56px;border-radius:50%;"></div>
                          </div>
                          <div style="padding: 20px; background-color: rgb(255, 255, 255);">
                            <div style="color: rgb(0, 0, 0); text-align: left;">
                              <h1 style="margin: 1rem 0">Password Change Notification</h1>
                              <p style="padding-bottom: 16px">The password of your HilalLink account has been changed.</p>
                              <p style="padding-bottom: 16px">If you did not initiate this change, please contact support immediately.</p>
                              <p style="padding-bottom: 16px">Thanks,<br>The HilalLink team</p>
                            </div>
                          </div>
                          <div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;">
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `,
      };

      mailTransport
        .sendMail(mailOptions)
        .then(() => {
          res.json({ success: "Password updated" }); // Return a valid JSON response
        })
        .catch((err) => {
          console.error(err);
          res
            .status(500)
            .json({ error: "An error occurred while changing password" }); // Handle errors and return JSON
        });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong!" });
    }
  }
);

//search user or post 
router.post("/search/:keyword", verifyToken, async (req, res) => {
  try {
    const { keyword } = req.params;
    const users = await User.find({ name: { $regex: keyword, $options: "i" } });

    let results = [];

    for (const user of users) {
      if (user.isPrivate) {
        results.push({ user });
      } else {
        const userPosts = await Post.find({ user: user._id }).limit(5).populate("user");
        results.push({ user, posts: userPosts});
      }
    }
    const keywordPosts = await Post.find({ 
          $and: [
            { text: { $regex: keyword, $options: "i" } },
            { user: { $nin: users.filter(user => user.isPrivate).map(user => user._id) } }
          ]
        }).populate("user");


    res.json({ results, keywordPosts });
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

//gamil login address form
router.get('/check-empty-fields', verifyToken, async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    const fieldsToCheck = ['city', 'state', 'country', 'category', 'gender'];
    const emptyFields = fieldsToCheck.filter(field => !user[field]);

    if (emptyFields.length > 0) {
      return res.json({message: 'Address information is mandatory'});
    }
    else{
      return res.json({message:"Address is filled"})
    }
  } 
  catch (err) {
    res.json({ error:"something went wrong" });
  }
});

//my following followers
router.get("/my-people/:id", (req, res) => {
  User.findOne({ _id: req.params.id })
    .populate("followers following")
    .then((found) => res.json(found));
});

// Route to send a follow request to a private user
router.post("/privateId-request/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user;
  User.findById(id)
    .then(user => {
      if (!user) {
        return res.json({ error: "User not found" });
      }
      if (user.isPrivate) {
        if (user.followRequests.includes(userId)) {
          return res.json({ error: "Follow request already sent" });
        }
        user.followRequests.push(userId);
        return user.save().then(() => {
          res.json({ message: "Follow request sent", private: true });
        });
      } else {
        if (user.followers.includes(userId)) {
          return res.json({ error: "Already following this user" });
        }
        user.followers.push(userId);
        return user.save().then(() => {
          return User.findByIdAndUpdate(userId, {
            $push: { following: id }
          }, { new: true });
        }).then(() => {
          res.json({ message: "User followed directly", private: false });
        });
      }
    })
    .catch(err => {
      console.error(err);
      res.json({ error: "Something went wrong" });
    });
});

//cancel follow request
router.post("/cancel-request/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user;
  User.findById(id)
    .then(user => {
      if (!user) {
        return res.json({ error: "User not found" });
      }
      if (!user.followRequests.includes(userId)) {
        return res.json({ error: "No follow request found" });
      }
      user.followRequests.pull(userId);
      return user.save();
    })
    .then(() => {
      res.json({ message: "Follow request cancelled" });
    })
    .catch(err => {
      console.error(err);
      res.json({ error: "Something went wrong" });
    });
});

// Route to accept a follow request
router.post("/PrivateId-accept-follow-request/:id", verifyToken, (req, res) => {
  const { id } = req.params; 
  const userId = req.user;

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.followRequests.includes(id)) {
        return res.json({ error: "No such follow request" });
      }
      user.followRequests.pull(id);
      user.followers.push(id);
      return user.save();
    })
    .then(() => {
      return User.findByIdAndUpdate(id, {
        $push: { following: userId }
      }, { new: true });
    })
    .then(() => {
      return Notification.findOneAndDelete({ type: 'requested', from: id, to: userId });
    })
    .then(() => {
      res.json({ message: "Follow request accepted and notification deleted" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});


//delete-follow-request
router.post('/delete-request/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ error: 'User not found' });
    }

    user.followRequests = user.followRequests.filter(reqId => reqId.toString() !== id);
    await Notification.findOneAndDelete({ type: 'requested', from: id, to: userId });

    await user.save();

    res.json({ message: 'Follow request deleted successfully' });
  } catch (error) {
    console.error('Error deleting follow request:', error);
    res.json({ error: 'Internal server error' });
  }
});


//unfollow
router.put("/unfollow-user/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user;

  User.findByIdAndUpdate(
    userId,
    { $pull: { following: id } },
    { new: true }
  )
  .then(() => {
    return User.findByIdAndUpdate(
      id,
      { $pull: { followers: userId } },
      { new: true }
    );
  })
  .then(() => {
    res.json({ message: "User unfollowed successfully" });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });
});


module.exports = router;

