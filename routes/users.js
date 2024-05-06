const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const User = require("../model/user");
const Delete = require("../model/delete")
const Post = require("../model/post")
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

//email config starts
const mailTransport = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  secure: true,
  secureConnection: false, // TLS requires secureConnection to be false
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

router.put("/follow/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  User.findByIdAndUpdate(
    id,
    {
      $push: { followers: req.user },
    },
    { new: true }
  ).then(() => {
    User.findByIdAndUpdate(
      req.user,
      {
        $push: { following: id },
      },
      { new: true }
    ).then((result) => res.json({ result }));
  });
});

router.put("/unfollow/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  User.findByIdAndUpdate(
    id,
    {
      $pull: { followers: req.user },
    },
    { new: true }
  ).then(() => {
    User.findByIdAndUpdate(
      req.user,
      {
        $pull: { following: id },
      },
      { new: true }
    ).then((result) => res.json({ result }));
  });
});

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

router.post("/top-users", (req, res) => {
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
      const user = await User.findById(req.user)
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
          return res.json({ error: "Invalid password" });
      }

      // Delete posts associated with the user's account
      await Post.deleteMany({ user: req.user });

      // Create a deletion request
      const deletionRequest = new Delete({
          user: req.user, 
          reason: reason
      });
      await deletionRequest.save();
      
      // Delete the user's account
      await User.findByIdAndDelete(req.user);
      
      return res.json({ success: "Account and associated posts deleted successfully!" });
  } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: "Something went wrong!" });
  }
});

//email-verification for password change
router.post("/change-password-email-verification", verifyToken, async (req, res) => {
  try {
    const foundUser = await User.findOne({ _id: req.user });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = await bcrypt.hash(otp.toString(), 12);

    const mailOptions = {
      from: "noreply@hilallink.com",
      to: foundUser.accessId,
      subject: "Verify your email address",
      html:`
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your login</title>
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
                              <h1 style="margin: 1rem 0">Verification code</h1>
                              <p style="padding-bottom: 16px">Please use the verification code below to change your password for HilalLink.</p>
                              <p style="padding-bottom: 16px"><strong style="font-size: 130%">${otp}</strong></p>
                              <p style="padding-bottom: 16px">If you didn’t request this, you can ignore this email.</p>
                              <p style="padding-bottom: 16px">Thanks,<br>The HilalLink team</p>
                            </div>
                          </div>
                          <div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;">
                            <p style="padding-bottom: 16px">Made with ♥ in India</p>
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
    `};

    mailTransport
      .sendMail(mailOptions)
      .then(() => {
        res.json({ success: true, hash: hashedOtp }); // Return a valid JSON response
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: "An error occurred while sending email" }); // Handle errors and return JSON
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong!" });
    }
});


module.exports = router;
