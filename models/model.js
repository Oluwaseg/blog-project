const mongoose = require("mongoose");
const slugify = require("slugify");
const crypto = require("crypto");
const domPurifier = require("dompurify");
const { JSDOM } = require("jsdom");
const htmlPurify = domPurifier(new JSDOM().window);

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  image: {
    type: String,
  },
  tokens: [
    {
      type: String,
    },
  ],
  username: {
    type: String,
    unique: true,
  },
  verificationToken: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
});

schema.pre("save", async function (next) {
  if ((this.isModified("name") || this.isNew) && !this.username) {
    const initials = this.name.substring(0, 3);

    const randomNumber = Math.floor(Math.random() * 9000) + 1000;

    const randomUsername = `${initials}-${randomNumber}`;

    this.username = randomUsername;
  }
  next();
});

const User = mongoose.model("User", schema);

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  reactions: {
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  image: { type: String },
  category: { type: String, required: true, default: "Article" },
  tags: [String],
});

blogSchema.pre("save", async function (next) {
  try {
    if (!this.slug || this.isModified("title")) {
      this.slug = slugify(this.title, { lower: true });

      if (!this.slug) {
        throw new Error("Failed to generate slug.");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

blogSchema.pre("validate", function (next) {
  // Ensure that the slug is set before validatio
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true });

    if (!this.slug) {
      this.invalidate("slug", "Slug is required.");
    }
  }

  next();
});

const Blog = mongoose.model("Blog", blogSchema);

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  reactions: {
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = { User, Blog, Comment };
