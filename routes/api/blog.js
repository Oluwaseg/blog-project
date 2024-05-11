const blogController = require("../../controllers/blogController");
const {
  authenticateToken,
  checkSessionExpiration,
  authenticateTokenPublic,
  isLoggedOut,
} = require("../../middleware/authenticate");

const { blogUpload } = require("../../middleware/image.config");

const express = require("express");
const router = express.Router();
// Define CRUD routes
router.get("/", authenticateTokenPublic, async (req, res) => {
  try {
    const { blogs, randomBlogByCategory } = await blogController.getAllBlogs();
    if (!req.user) {
      res.render("blog/guestBlog", { blogs, randomBlogByCategory });
    } else {
      res.render("blog/blog", { blogs, randomBlogByCategory, user: req.user });
    }
  } catch (error) {
    console.error("Error getting blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/create", authenticateToken, checkSessionExpiration, (req, res) => {
  res.render("blog/create", { blog: {} });
});

router.post(
  "/create",

  authenticateToken,
  checkSessionExpiration,
  blogUpload.single("image"),
  blogController.createBlog
);
router.post(
  "/:blogId/comment",
  authenticateToken,
  checkSessionExpiration,
  blogController.addCommentToBlog
);
router.delete(
  "/:id",
  authenticateToken,
  checkSessionExpiration,
  blogController.deleteBlog
);
router.delete(
  "/comment/:commentId", // Route parameter to capture the comment ID
  authenticateToken,
  checkSessionExpiration,
  blogController.deleteComment // Call the deleteComment function when this route is hit
);
router.delete(
  "/:slug/comment/:commentId/delete-reply/:replyId",
  authenticateToken,
  checkSessionExpiration,
  blogController.deleteReply
);

router.post("/:commentId/edit", blogController.editComment);

router.post(
  "/:slug/comment/:commentId/react",
  authenticateToken,
  checkSessionExpiration,
  blogController.addReactionToComment
);
router.post(
  "/:slug/react",
  authenticateToken,
  checkSessionExpiration,
  blogController.addReactionToBlog
);
router.get(
  "/:slug/comment/:commentId/edit-reply/:replyId",
  authenticateToken,
  checkSessionExpiration,
  blogController.getEditReply
);

// Update reply route
router.post(
  "/:slug/comment/:commentId/edit-reply/:replyId",
  authenticateToken,
  checkSessionExpiration,
  blogController.updateReply
);

router.post(
  "/comment/:commentId/reply",
  authenticateToken,
  checkSessionExpiration,
  blogController.replyToComment
);

router.get("/edit-comment/:commentId", blogController.getEditComment);

router.get("/:slug", authenticateTokenPublic, blogController.getBlogBySlug);
router.get(
  "/:slug/edit",

  authenticateToken,
  checkSessionExpiration,
  blogController.getBlogForEdit
);
router.put(
  "/:slug/edit",

  authenticateToken,
  checkSessionExpiration,
  blogController.updateBlog
);

module.exports = router;
