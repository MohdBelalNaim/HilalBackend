const router = require("express").Router();
const User = require("../model/user");
const nodemailer = require("nodemailer");
const bcryptjs = require("bcryptjs");

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

router.get("/verify-email", async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const hashedOtp = await bcryptjs.hash(otp.toString(), 12);
  const mailOptions = {
    from: "noreply@hilallink.com",
    to: "sajadkhaki.jk@gmail.com",
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
  `,
  };
  mailTransport
    .sendMail(mailOptions)
    .then(() => {
      res.json({ success: "Mail sent", hash: hashedOtp });
    })
    .catch((err) => console.log(err));
});

router.post("/photo/:id", (req, res) => {
  const { id } = req.params;
  const { cover_url, profile_url } = req.body;
  if (!cover_url || !profile_url) {
    return res.json({ error: "All feilds are required!" });
  }
  User.updateOne(
    { _id: id },
    {
      $set: {
        cover_url,
        profile_url,
      },
    }
  )
    .then(() => res.json({ success: "Details updated!" }))
    .catch((err) => {
      res.json({ error: "Something went wrong!" });
      console.log(err);
    });
});



module.exports = router;
