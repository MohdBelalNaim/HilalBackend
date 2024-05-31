const router = require("express").Router();
const User = require("../model/user");
const nodemailer = require("nodemailer");
const bcryptjs = require("bcryptjs");
const verifyToken = require("../middlewares/verifyToken");
const cloudinary = require("cloudinary").v2;
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B50}-\u{2B50}]|[\u{23E9}-\u{23EF}]|[\u{23F0}-\u{23F3}]|[\u{25B6}-\u{25B6}]|[\u{25C0}-\u{25C0}]|[\u{2600}-\u{2600}]|[\u{26A1}-\u{26A1}]|[\u{2705}-\u{2705}]|[\u{274C}-\u{274C}]|[\u{2B06}-\u{2B06}]|[\u{2B07}-\u{2B07}]|[\u{2934}-\u{2934}]|[\u{2935}-\u{2935}]|[\u{2B05}-\u{2B05}]|[\u{2194}-\u{2199}]|[\u{21AA}-\u{21AA}]|[\u{21A9}-\u{21A9}]/u;
const isTextOnly = (str) => /^[a-zA-Z\s]+$/.test(str);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

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
//email config ends

//personal detail of user by id
router.post("/personal-details/:id", (req, res) => {
  const { id } = req.params;
  const { category, gender, country, city, state } = req.body;
  if (!category || !gender || !country || !city || !state) {
    return res.json({ error: "All fileds are required!" });
  } else {
    User.updateOne(
      { _id: id },
      {
        $set: {
          category,
          gender,
          city,
          state,
          country,
        },
      }
    )
      .then((updated) => res.json({ success: "Details updated" }))
      .catch((err) => {
        console.log(err);
        res.json({ error: "Something went wrong" });
      });
  }
});

//bio route
router.post("/bio/:id", (req, res) => {
  const { id } = req.params;
  const { bio } = req.body;
  if (!bio) {
    return res.json({ error: "All fileds are required!" });
  } else {
    User.updateOne(
      { _id: id },
      {
        $set: {
          bio,
        },
      }
    )
      .then(() => res.json({ success: "Details updated" }))
      .catch((err) => {
        console.log(err);
        res.json({ error: "Something went wrong" });
      });
  }
});

//email verification
router.post("/verify-email", async (req, res) => {
  const { to } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  const hashedOtp = await bcryptjs.hash(otp.toString(), 12);
  const mailOptions = {
    from: "noreply@hilallink.com",
    to: to,
    subject: "Verify your email address", html: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">

    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your login</title>
      <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
    </head>

    <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
      <table role="presentation"
        style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
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
                          <p style="padding-bottom: 16px">Please use the verification code below to signup for HilalLink.</p>
                          <p style="padding-bottom: 16px"><strong style="font-size: 130%">${otp}</strong></p>
                          <p style="padding-bottom: 16px">If you didn’t request this, you can ignore this email.</p>
                          <p style="padding-bottom: 16px">Thanks,<br>The HilalLink team</p>
                        </div>
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
      res.json({ success: true, hash: hashedOtp }); 
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "An error occurred while sending email" }); 
    });
});

//otp verifictaion route
router.post("/verify-otp", async (req, res) => {
  const { otp, hashedOtp, accessId } = req.body; 

  try {
    const otpMatch = await bcryptjs.compare(otp.toString(), hashedOtp);

    if (otpMatch) {
      const user = await User.findOne({ accessId });
      if (!user) {
        return res.json({ error: "User not found" });
      }
      user.isVerified = true;
      await user.save();
      res.json({ success: "OTP verified successfully"});
    } 
    else {
      res.json({ error: "Invalid OTP" });
    }
  } catch (err) {
    console.error(err);
    res.json({ error: "Server error" });
  }
});

// Signup address route
router.post("/address", async (req, res) => {
  const { accessId, category, state, gender, city, country } = req.body;
  if (!city || !country || !state || !gender || !category) {
    return res.json({ error: "All fields are required" });
  }
  if (![city, country, state, gender, category].every(isTextOnly)) {
    return res.json({ error: "All fields must contain only text" });
  }
  try {
    const user = await User.findOne({ accessId });
    if (!user) {
      return res.json({ error: "User not found" });
    }
    user.category = category;
    user.state = state;
    user.gender = gender;
    user.country = country;
    user.city = city;
    await user.save();
    return res.json({ success: "Address added successfully" });
  } 
  catch (error) {
    return res.json({ error: "Something went wrong" });
  }
});

//bio information route
router.post("/bio", async (req, res) => {
  const { accessId, bio } = req.body;
  if (!bio) {
    return res.json({ error: "All fields are required!" });
  }
  if (emojiRegex.test(bio)) {
    return res.json({ error: "Emojis are not allowed" });
  }
  try {
    const user = await User.findOne({ accessId });
    if (!user) {
      return res.json({ error: "User not found" });
    }
    user.bio = bio;
    await user.save();
    return res.json({ success: "Bio added successfully" });
  } catch (error) {
    console.error("Error adding bio:", error);
    return res.json({ error: "Something went wrong" });
  }
});

//photo upload route
router.post("/photo", async (req, res) => {
  const { accessId, coverUrl, profileUrl } = req.body;

  try {
    const user = await User.findOne({ accessId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (profileUrl) {
      user.profile_url = profileUrl;
    }
    if (coverUrl) {
      user.cover_url = coverUrl;
    }

    await user.save();
    return res.json({ coverUrl, profileUrl });
  } catch (error) {
    console.error("Error adding profile URL:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

//all user detail
router.get('/all-user', async(req,res)=>{
  const { accessId } = req.query; 
  try {
    const users = await User.find({ accessId: { $ne: accessId } }).limit(10);
    if (users.length > 0) {
      res.json({ users });
    } else {
      res.json({ error: "No users found" });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

//password-change-email
router.post("/password-change-email", async (req, res) => {
  const { to } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);
  const hashedOtp = await bcryptjs.hash(otp.toString(), 12);
  const mailOptions = {
    from: "noreply@hilallink.com",
    to: to,
    subject: "Verify your email address",
    html: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">

    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your login</title>
      <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
    </head>

    <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
      <table role="presentation"
        style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
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
                          <p style="padding-bottom: 16px">Please use the verification code below to signup for HilalLink.</p>
                          <p style="padding-bottom: 16px"><strong style="font-size: 130%">${otp}</strong></p>
                          <p style="padding-bottom: 16px">If you didn’t request this, you can ignore this email.</p>
                          <p style="padding-bottom: 16px">Thanks,<br>The HilalLink team</p>
                        </div>
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
      res.json({ success: true, hash: hashedOtp }); // Return a valid JSON response
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "An error occurred while sending email" }); // Handle errors and return JSON
    });
});

//signup-email
router.post("/signup-email", async (req, res) => {
  const { to } = req.body;
  const mailOptions = {
    from: "noreply@hilallink.com",
    to: to,
    subject: "Congratulations! Welcome to HilalLink",
    html: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">

    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Congratulations! Welcome to HilalLink</title>
      <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
    </head>

    <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
      <table role="presentation"
        style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
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
                          <h1 style="margin: 1rem 0">Congratulations!</h1>
                          <p style="padding-bottom: 16px">You have successfully completed Signup on HilalLink.</p>
                          <p style="padding-bottom: 16px">Thanks,<br>The HilalLink team</p>
                        </div>
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
      res.json({ success: true }); // Return a valid JSON response
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "An error occurred while sending email" }); // Handle errors and return JSON
    });
});

//gmail login address
router.post("/gmail/address", verifyToken, async (req, res) => {
  const { category, state, gender, city, country } = req.body;
  if (!city || !country || !state || !gender || !category) {
    return res.json({ error: "All fields are required" });
  }
  try {
    const user = await User.findOne({ _id: req.user });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.category = category;
    user.state = state;
    user.gender = gender;
    user.country = country;
    user.city = city;

    await user.save();
    return res.json({ success: "Address added successfully" });
  } catch (error) {
    console.error("Error adding address information:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

//signup final follow all  
router.post('/follow-all', async (req, res) => {
  const { accessId, users } = req.body;
  try {
    const currentUser = await User.findOne({ accessId });
    if (!currentUser) {
      return res.json({ error: "User not found" });
    }
    
    currentUser.following.push(...users);
    await currentUser.save();

    res.json({ success: "Users followed successfully" });
  } catch (error) {
    console.error("Error following users:", error);
    res.json({ error: "Something went wrong" });
  }
});


module.exports = router;