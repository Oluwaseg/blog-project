const jwt = require("jsonwebtoken");
const { User } = require("../models/model");

const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/api/login");
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.redirect("/api/login");
    }

    try {
      const user = await User.findById(decodedToken.userId);

      if (!user) {
        return res.redirect("/api/login");
      }

      req.user = user;

      req.session.userId = user._id;
      next();
    } catch (error) {
      console.error("Error verifying token:", error);
      return next(error);
    }
  });
};

// Less Strict Authentication Middleware
const authenticateTokenPublic = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return next();
    }

    try {
      const user = await User.findById(decodedToken.userId);

      if (!user) {
        return next();
      }

      req.user = user;
      req.session.userId = user._id;
    } catch (error) {
      console.error("Error verifying token:", error);
      return next(error);
    }

    next();
  });
};

const checkSessionExpiration = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect("/api/login");
  }

  next();
};

module.exports = {
  authenticateToken,
  checkSessionExpiration,
  authenticateTokenPublic,
};
