const blogController = require("../../controllers/blogController");
const {
  authenticateToken,
  checkSessionExpiration,
  authenticateTokenPublic,
} = require("../../middleware/authenticate");

const { blogUpload } = require("../../middleware/image.config");

const express = require("express");
const router = express.Router();
// Define CRUD routes
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { blogs, randomBlogByCategory, blogsByCategory } =
      await blogController.getAllBlogs();
    res.render("blog/blog", {
      blogs,
      randomBlogByCategory,
      blogsByCategory,
      user: req.user,
    });
  } catch (error) {
    console.error("Error getting blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/categories", authenticateToken, async (req, res) => {
  try {
    let blogsByCategory = await blogController.getBlogsGroupedByCategory();
    res.render("category/categories", {
      blogsByCategory,
      user: req.user,
    });
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

router.get("/article", authenticateTokenPublic, async (req, res) => {
  try {
    const article = await blogController.getBlogsByCategory("Article");
    console.log(article);
    const randomBlogsByCategory = await blogController.getRandomBlogsByCategory(
      "Article"
    );
    const latest = article.slice(0, 10);
    const recent = article.slice(10);
    res.render("category/article", {
      category: "Article",
      latest,
      recent,
      blogs: article,
      randomBlogByCategory: randomBlogsByCategory,
    });
  } catch (error) {
    console.error("Error getting article blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/guide", async (req, res) => {
  try {
    const guide = await blogController.getBlogsByCategory("Guide");
    const randomBlogsByCategory = await blogController.getRandomBlogsByCategory(
      "Guide"
    );
    const latest = guide.slice(0, 10);
    const recent = guide.slice(10);
    res.render("category/guide", {
      category: "Guide",
      latest,
      recent,
      blogs: guide,
      randomBlogByCategory: randomBlogsByCategory,
    });
  } catch (error) {
    console.error("Error getting guide blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/news", async (req, res) => {
  try {
    const news = await blogController.getBlogsByCategory("News");
    const randomBlogsByCategory = await blogController.getRandomBlogsByCategory(
      "News"
    );
    const latest = news.slice(0, 10);
    const recent = news.slice(10);
    res.render("category/news", {
      category: "News",
      latest,
      recent,
      blogs: news,
      randomBlogByCategory: randomBlogsByCategory,
    });
  } catch (error) {
    console.error("Error getting news blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/opinion", async (req, res) => {
  try {
    const opinion = await blogController.getBlogsByCategory("Opinion");
    const randomBlogsByCategory = await blogController.getRandomBlogsByCategory(
      "Opinion"
    );
    const latest = opinion.slice(0, 10);
    const recent = opinion.slice(10);
    res.render("category/opinion", {
      category: "Opinion",
      blogs: opinion,
      latest,
      recent,
      randomBlogByCategory: randomBlogsByCategory,
    });
  } catch (error) {
    console.error("Error getting opinion blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/review", async (req, res) => {
  try {
    const review = await blogController.getBlogsByCategory("Review");
    const randomBlogsByCategory = await blogController.getRandomBlogsByCategory(
      "Review"
    );
    const latest = review.slice(0, 10);
    const recent = review.slice(10);
    res.render("category/review", {
      category: "Review",
      latest,
      recent,
      blogs: review,
      randomBlogByCategory: randomBlogsByCategory,
    });
  } catch (error) {
    console.error("Error getting review blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/tutorial", async (req, res) => {
  try {
    const tutorial = await blogController.getBlogsByCategory("Tutorial");
    const randomBlogsByCategory = await blogController.getRandomBlogsByCategory(
      "Tutorial"
    );
    const latest = tutorial.slice(0, 10);
    const recent = tutorial.slice(10);
    res.render("category/tutorial", {
      category: "Tutorial",
      latest,
      recent,
      blogs: tutorial,
      randomBlogByCategory: randomBlogsByCategory,
    });
  } catch (error) {
    console.error("Error getting tutorial blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

router.get("/technology", async (req, res) => {
  try {
    const technology = await blogController.getBlogsByCategory("Technology");
    const randomBlogsByCategory = await blogController.getRandomBlogsByCategory(
      "Technology"
    );
    const latest = technology.slice(0, 10);
    const recent = technology.slice(10);
    res.render("category/technology", {
      category: "Technology",
      latest,
      recent,
      blogs: technology,
      randomBlogByCategory: randomBlogsByCategory,
    });
  } catch (error) {
    console.error("Error getting technology blogs:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
});

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
