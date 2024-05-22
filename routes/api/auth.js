const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../../models/model");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const authController = require("../../controllers/authController");
const {
  authenticateToken,
  checkSessionExpiration,
  verifyEmail,
} = require("../../middleware/authenticate");
const { upload } = require("../../middleware/image.config");
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;
const router = express.Router();

// Middleware to clear user session
const clearSession = (req, res, next) => {
  req.logout(() => {}); // Dummy callback function
  next();
};

const baseURL = process.env.BASE_URL;

// Passport setup
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseURL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile || !profile.id) {
          return done(new Error("Profile or profile id is undefined"));
        }

        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error("No email found in the profile"));
        }

        const email = profile.emails[0].value; // Extract email from profile

        let user = await User.findOne({ email: email });

        if (user) {
          console.log("User found:", user);
          if (!user.email && email) {
            user.email = email;
            await user.save();
          }
          return done(null, user);
        } else {
          // Create a new user with Google details
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            image:
              profile.photos && profile.photos.length > 0
                ? profile.photos[0].value
                : null,

            isVerified: true,
          });

          // Save the new user
          await user.save();

          return done(null, user);
        }
      } catch (error) {
        console.error("Error in Google OAuth strategy:", error);
        return done(error, false);
      }
    }
  )
);

router.use(passport.initialize());
router.use(passport.session());

// Google OAuth authentication route
router.get(
  "/auth/google",
  clearSession,
  passport.authenticate("google", { scope: ["email", "profile"] })
);

const createToken = (user) => {
  const tokenData = {
    userId: user._id,
    email: user.email,
    name: user.name,
    image: user.image,
  };

  const token = jwt.sign(tokenData, secretKey, { expiresIn: "30m" });

  return token;
};

// Google OAuth callback route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/login" }),
  async (req, res) => {
    try {
      const token = createToken(req.user);
      req.user.tokens.push(token);
      await req.user.save();
      res.cookie("jwt", token, { httpOnly: true });
      const redirectUrl = `${process.env.REDIRECT_BASE_URL}/blog`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.log("Error in Google OAuth callback:", error);
      res.status(500).render("error", { error: "Internal Server Error" });
    }
  }
);

// Registration route
router.post("/register", upload.single("image"), authController.registerUser);

// Login route
router.post("/login", authController.loginUser);

// Logout route
router.post("/logout", authController.logoutUser);

// Forgot password route
router.post("/forgot-password", authController.forgotPassword);

// Reset password route
router.post("/reset-password", authController.resetPassword);

// verify
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  const result = await authController.resendVerificationEmail(email);
  if (result.success) {
    const successMessage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Success</title>
        <style>
          /* Add your CSS styles here */
          body {
            font-family: Arial, sans-serif;
            background-color: #f3f3f3;
            text-align: center;
          }
          .container {
            margin-top: 50px;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }
          h1 {
            color: #4caf50;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Success!</h1>
          <p>Verification email sent successfully. Check your email to verify.</p>
        </div>
        <script>
          // Show a toast notification
          alert("Verification email sent successfully. You will be redirected to login.");
          setTimeout(function() {
            window.location.href = "/api/login";
          }, 5000); // Redirect to login after 5 seconds
        </script>
      </body>
      </html>
    `;
    return res.send(successMessage);
  } else {
    const errorMessage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          /* Add your CSS styles here */
          body {
            font-family: Arial, sans-serif;
            background-color: #f3f3f3;
            text-align: center;
          }
          .container {
            margin-top: 50px;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }
          h1 {
            color: #f44336;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Error!</h1>
          <p>${result.message}</p>
          <button onclick="window.location.href='/api/login'" class="btn btn-primary">Go to Login</button>
        </div>
      </body>
      </html>
    `;
    return res.send(errorMessage);
  }
});

// Update password route
router.post(
  "/update-password",
  authenticateToken,
  authController.updatePassword
);

// Change profile picture route
router.post(
  "/change-profile-picture",
  authenticateToken,
  upload.single("image"),
  authController.changeProfilePicture
);

// Update user details route
router.post(
  "/update-details",
  authenticateToken,
  checkSessionExpiration,
  authController.updateUserDetails
);

router.get("/verify-email", verifyEmail);
router.get("/resend-verification", authenticateToken, (req, res) => {
  if (!req.user) {
    // Handle case where user is not logged in
    return res.redirect("/api/login");
  }

  res.render("resend-verification", { email: req.user.email });
});

router.get("/reset-password/:token", (req, res) => {
  const token = req.params.token;
  res.render("reset-password", { token });
});

router.get("/success", (req, res) => {
  res.render("success");
});

// Route to render registration form
router.get("/register", (req, res) => {
  const successMsg = req.flash("success_msg");
  const errorMsg = req.flash("error_msg");
  res.render("register", {
    success_msg: successMsg,
    error_msg: errorMsg,
  });
});

// Route to render login form
router.get("/login", (req, res) => {
  const successMsg = req.flash("success_msg");
  const errorMsg = req.flash("error_msg");
  res.render("login", {
    success_msg: successMsg,
    error_msg: errorMsg,
  });
});

// Route to render forgot password form
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

// Route to render account setting page
router.get(
  "/account-setting",
  authenticateToken,
  checkSessionExpiration,
  (req, res) => {
    const successMsg = req.flash("success_msg");
    const errorMsg = req.flash("error_msg");
    res.render("blog/account", {
      user: req.user,
      success_msg: successMsg,
      error_msg: errorMsg,
    });
  }
);

// Route to fetch image URL
router.get("/getImageUrl", authenticateToken, (req, res) => {
  try {
    // Assuming req.user contains the user object with the image URL
    const imageUrl = req.user.image;
    res.json({ imageUrl });
  } catch (error) {
    console.error("Error fetching image URL:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
