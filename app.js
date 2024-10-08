var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var flash = require("connect-flash");
var cors = require("cors");
var methodOverride = require("method-override");
const { authenticateTokenPublic } = require("./middleware/authenticate");
const blogController = require("./controllers/blogController");

var authRouter = require("./routes/api/auth");
var blogRouter = require("./routes/api/blog");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(cookieParser());
app.use(methodOverride("_method"));
// Middleware to log requests
function logRequests(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

// Use the middleware for logging
app.use(logRequests);

// app.use(
//   session({
//     secret: "testing",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       maxAge: 30 * 60 * 1000,
//     },
//   })
// );
// if (process.env.NODE_ENV === "production") {
//   sessionOptions.cookie.secure = true; // Enable secure cookie in production
// }

const sessionOptions = {
  secret: process.env.SESSION_SECRET, // Use session secret from environment variable
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 30 * 60 * 1000, // Session expiration time (30 minutes)
  },
};

// Set secure cookie in production
if (process.env.NODE_ENV === "production") {
  sessionOptions.cookie.secure = true;
}

// Use express-session middleware with the configured options
app.use(session(sessionOptions));

app.use(flash());
const logSession = (req, res, next) => {
  // console.log("Session Data:", req.session);
  next();
};
app.use(logSession);

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.get("/", authenticateTokenPublic, async (req, res) => {
  try {
    const { blogs, randomBlogByCategory, blogsByCategory } =
      await blogController.getAllBlogs();
    res.render("blog/guestBlog", {
      blogs,
      randomBlogByCategory,
      blogsByCategory,
    });
  } catch (error) {
    console.error("Error getting blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});
app.use("/api", authRouter);
app.use("/blog", blogRouter);

app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// Middleware to handle 404 errors
app.use(function (req, res, next) {
  res.status(404).render("error", { error: { status: 404 } });
});

// Middleware to handle 500 errors
app.use(function (err, req, res, next) {
  console.error("Error handling middleware encountered an error:", err);
  console.error(err.stack);
  const statusCode = err.status || 500; // Use the status code from the error, or default to 500
  res.status(statusCode).render("error-ms", { error: err });
});

module.exports = app;
