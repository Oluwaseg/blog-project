const { Blog, Comment, User } = require("../models/model");
const { JSDOM } = require("jsdom");
const dompurify = require("dompurify");
const { window } = new JSDOM("");
const { sanitize } = dompurify(window);

// Get all blogs
const getAllBlogs = async () => {
  try {
    const blogs = await Blog.find().populate("author", "name username image");
    const randomBlogByCategory = await getRandomBlogsByCategory();
    return { blogs, randomBlogByCategory };
  } catch (error) {
    console.error("Error getting blogs:", error);
    throw error;
  }
};

const getRandomBlogsByCategory = async () => {
  try {
    const categories = await Blog.distinct("category");
    const blogsByCategory = {};

    for (const category of categories) {
      const blogs = await Blog.aggregate([
        { $match: { category } },
        { $sample: { size: Math.floor(Math.random() * 2) + 1 } },
      ]);

      // Map the author field manually and populate it
      const populatedBlogs = await Promise.all(
        blogs.map(async (blog) => {
          const populatedBlog = await Blog.populate(blog, {
            path: "author",
            select: "name username image",
          });
          return populatedBlog;
        })
      );

      blogsByCategory[category] = populatedBlogs;
    }

    return blogsByCategory;
  } catch (error) {
    console.error("Error getting random blogs by category:", error);
    throw error; // Rethrow the error to handle it elsewhere if needed
  }
};

const createBlog = async (req, res) => {
  try {
    const { title, description, content, category } = req.body;
    const author = req.user._id;

    if (!title || !description || !content || !category) {
      return res.status(400).render("error", {
        error:
          "Title, description, and content can't be empty. Category are required.",
      });
    }

    const sanitizedContent = sanitize(content);

    let image;
    if (req.file) {
      // Check if file is uploaded
      image = req.file.path; // This should be the path of the uploaded image
    }

    const blog = new Blog({
      title,
      description,
      content: sanitizedContent,
      author,
      image: image ? image : undefined,
      category,
    });

    if (!blog.title) {
      return res.status(400).render("error", { error: "Title is required." });
    }

    await blog.save();

    res.redirect("/blog");
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const formatTimeDifference = (createdAt) => {
  const currentTime = new Date();
  const timeDifference = currentTime - createdAt;

  // Convert milliseconds to hours
  const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

  if (hoursDifference < 1) {
    // If less than an hour, show minutes
    const minutesDifference = Math.floor(timeDifference / (1000 * 60));
    return `${minutesDifference} minutes ago`;
  } else {
    // Otherwise, show hours
    return `${hoursDifference} hours ago`;
  }
};

// Get a blog by ID
const displayedReplies = 3;
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("author", "name username image")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name image",
        },
      })
      .populate({
        path: "comments",
        populate: {
          path: "replies",
          populate: {
            path: "author",
            select: "name image",
          },
        },
      });

    if (!blog) {
      return res.status(404).render("error", { error: "Blog not found" });
    }

    const relatedBlog = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
    }).limit(3);

    const blogsByCategory = await getRandomBlogsByCategory();

    const commentCount = blog.comments.length;

    const comment = blog.comments[0];
    const isOwner =
      req.user && req.user._id.toString() === blog.author._id.toString();

    res.render("blog/view", {
      blog,
      isOwner,
      commentCount,
      user: req.user,
      comment,
      formatTimeDifference: formatTimeDifference,
      relatedBlog: relatedBlog,
      blogsByCategory: blogsByCategory,

      displayedReplies: displayedReplies,
    });
  } catch (error) {
    console.error("Error getting blog by ID:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const getBlogForEdit = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).render("error", { error: "Blog not found" });
    }

    res.render("blog/edit", { blog });
  } catch (error) {
    console.error("Error getting blog for edit:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { title, description, content } = req.body;

    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { title, description, content },
      { new: true }
    );

    if (!blog) {
      return res.status(404).render("error", { error: "Blog not found" });
    }

    res.redirect("/blog/" + blog.slug);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

// Delete a blog by ID
const deleteBlog = async (req, res) => {
  try {
    console.log(req.params.id);
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).render("error", { error: "Blog not found" });
    }

    res.redirect("/blog");
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const addCommentToBlog = async (req, res) => {
  try {
    const { content } = req.body;
    const { blogId } = req.params;
    const authorId = req.user._id;

    // Fetch the full author information
    const author = await User.findById(authorId);

    if (!author) {
      return res
        .status(404)
        .json({ success: false, error: "Author not found" });
    }

    const comment = new Comment({
      content,
      author: {
        _id: author._id,
        name: author.name,
        image: author.image,
      },
    });

    await comment.save();

    const blog = await Blog.findByIdAndUpdate(
      blogId,
      { $push: { comments: comment._id } },
      { new: true }
    );

    res.redirect("/blog/" + blog.slug);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const editComment = async (req, res) => {
  try {
    const { commentId } = req.params; // Retrieve the comment ID from request parameters
    const { content } = req.body; // Retrieve the updated content from request body

    // Find the comment to update
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).render("error", { error: "Comment not found" });
    }

    // Update the comment content
    comment.content = content;
    await comment.save();

    // Fetch the associated blog post
    const blog = await Blog.findOne({ comments: commentId });

    if (!blog) {
      return res.status(404).render("error", { error: "Blog post not found" });
    }

    // Redirect to the blog post page after successfully editing the comment
    res.redirect("/blog/" + blog.slug);
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const getEditComment = async (req, res) => {
  try {
    // Retrieve the comment from the database or wherever it's stored
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).render("error", { error: "Comment not found" });
    }

    const blog = await Blog.findOne({ comments: commentId });

    if (!blog) {
      return res.status(404).render("error", { error: "Blog post not found" });
    }

    res.render("blog/edit-comment", { comment, blog });
  } catch (error) {
    console.error("Error getting comment for edit:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Find and delete the comment by its ID
    await Comment.findByIdAndDelete(commentId);

    // Fetch the associated blog post
    const blog = await Blog.findOneAndUpdate(
      { comments: commentId },
      { $pull: { comments: commentId } },
      { new: true }
    );

    // Redirect to the blog post page after successfully deleting the comment
    res.redirect("/blog/" + blog.slug);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const addReactionToComment = async (req, res) => {
  try {
    const { reactionType } = req.body;
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).render("error", { error: "Comment not found" });
    }

    // Check if the user has already reacted with the opposite reactionType
    const oppositeReactionType =
      reactionType === "likes" ? "dislikes" : "likes";
    if (comment.reactions[oppositeReactionType].includes(userId)) {
      // Remove the user from the opposite reaction array
      comment.reactions[oppositeReactionType] = comment.reactions[
        oppositeReactionType
      ].filter((id) => id.toString() !== userId.toString());
    }

    // Check if the user has already reacted with the same reactionType
    if (comment.reactions[reactionType].includes(userId)) {
      // If the user has already reacted, remove their reaction
      comment.reactions[reactionType] = comment.reactions[reactionType].filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // If the user hasn't reacted, add their reaction
      comment.reactions[reactionType].push(userId);
    }

    await comment.save();

    const blog = await Blog.findOne({ comments: commentId });

    if (!blog) {
      return res.status(404).render("error", { error: "Blog post not found" });
    }

    res.redirect("/blog/" + blog.slug);
  } catch (error) {
    console.error("Error adding reaction to comment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const addReactionToBlog = async (req, res) => {
  try {
    const { reactionType } = req.body;
    const { slug } = req.params;
    const userId = req.user._id;

    // Find the blog by slug
    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return res.status(404).render("error", { error: "Blog not found" });
    }

    // Check if the user has already reacted with the opposite reactionType
    const oppositeReactionType =
      reactionType === "likes" ? "dislikes" : "likes";
    if (blog.reactions[oppositeReactionType].includes(userId)) {
      blog.reactions[oppositeReactionType] = blog.reactions[
        oppositeReactionType
      ].filter((id) => id.toString() !== userId.toString());
    }

    // Check if the user has already reacted with the same reactionType
    if (blog.reactions[reactionType].includes(userId)) {
      // If the user has already reacted, remove their reaction
      blog.reactions[reactionType] = blog.reactions[reactionType].filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // If the user hasn't reacted, add their reaction
      blog.reactions[reactionType].push(userId);
    }

    await blog.save();

    if (req.xhr) {
      // If the request was made via AJAX, send JSON response
      res.json({
        userLiked: blog.reactions.likes.includes(userId),
        userDisliked: blog.reactions.dislikes.includes(userId),
        likesCount: blog.reactions.likes.length,
        dislikesCount: blog.reactions.dislikes.length,
      });
    } else {
      // If not AJAX, redirect to the blog page
      res.redirect(`/blog/${blog.slug}`);
    }
  } catch (error) {
    console.error("Error adding reaction to blog:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const replyToComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { commentId } = req.params;
    const authorId = req.user._id;

    // Fetch the full author information
    const author = await User.findById(authorId);

    if (!author) {
      return res
        .status(404)
        .json({ success: false, error: "Author not found" });
    }

    const reply = new Comment({
      content,
      author: {
        _id: author._id,
        name: author.name,
        image: author.image,
      },
    });

    await reply.save();

    // Find the parent comment and push the reply to its replies array
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res
        .status(404)
        .json({ success: false, error: "Parent comment not found" });
    }

    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Find the parent blog associated with the comment
    const parentBlog = await Blog.findOne({ comments: commentId });
    if (!parentBlog) {
      return res
        .status(404)
        .json({ success: false, error: "Parent blog not found" });
    }

    res.redirect("/blog/" + parentBlog.slug); // Redirect to the parent blog page
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const getEditReply = async (req, res) => {
  try {
    const { slug, commentId, replyId } = req.params;
    const reply = await Comment.findById(replyId);
    const comment = await Comment.findById(commentId); // Retrieve the comment object
    const blog = await Blog.findOne({ comments: commentId });

    if (!reply) {
      return res.status(404).render("error", { error: "Reply not found" });
    }

    if (!comment) {
      return res.status(404).render("error", { error: "Comment not found" });
    }

    if (!blog) {
      return res.status(404).render("error", { error: "Blog not found" });
    }

    res.render("blog/edit-reply", { reply, slug, commentId, blog, comment }); // Pass the 'comment' object to the template
  } catch (error) {
    console.error("Error getting reply for edit:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const updateReply = async (req, res) => {
  try {
    const { replyId } = req.params; // Extract the reply ID from the request parameters
    const { content } = req.body; // Extract the updated content from the request body

    console.log("Reply ID:", replyId);
    console.log("Updated content:", content);

    // Find the reply in the database by its ID
    const reply = await Comment.findById(replyId);

    console.log("Reply found:", reply);

    // Check if the reply exists
    if (!reply) {
      // If the reply doesn't exist, render an error page
      console.log("Reply not found");
      return res.status(404).render("error", { error: "Reply not found" });
    }

    // Check if the authenticated user is the author of the reply
    if (req.user._id.toString() !== reply.author._id.toString()) {
      // If the user is not the author, render an error page indicating lack of authorization
      console.log("User not authorized to edit this reply");
      return res.status(403).render("error", {
        error: "You are not authorized to edit this reply",
      });
    }

    // Update the content of the reply
    reply.content = content;

    console.log("Updated reply:", reply);

    // Save the updated reply to the database
    await reply.save();

    // Redirect back to the blog page after successfully updating the reply
    res.redirect(`/blog/${req.params.slug}`);
  } catch (error) {
    // Handle any errors that occur during the update process
    console.error("Error updating reply:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;

    // Find and delete the reply by its ID
    await Comment.findByIdAndDelete(replyId);

    // Redirect back to the blog page
    res.redirect(`/blog/${req.params.slug}`);
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).render("error", { error: "Internal Server Error" });
  }
};

// Controller function to add a reaction to a reply
const addReactionToReply = async (req, res) => {
  try {
    const { reactionType } = req.body;
    const { replyId } = req.params;
    const userId = req.user._id;

    const reply = await Comment.findById(replyId);

    if (!reply) {
      return res.status(404).json({ success: false, error: "Reply not found" });
    }

    // Check if the user has already reacted with the opposite reactionType
    const oppositeReactionType =
      reactionType === "likes" ? "dislikes" : "likes";
    if (reply.reactions[oppositeReactionType].includes(userId)) {
      reply.reactions[oppositeReactionType] = reply.reactions[
        oppositeReactionType
      ].filter((id) => id.toString() !== userId.toString());
    }

    // Check if the user has already reacted with the same reactionType
    if (reply.reactions[reactionType].includes(userId)) {
      // If the user has already reacted, remove their reaction
      reply.reactions[reactionType] = reply.reactions[reactionType].filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // If the user hasn't reacted, add their reaction
      reply.reactions[reactionType].push(userId);
    }

    await reply.save();

    // Redirect back to the blog page or send JSON response
    res.redirect(`/blog/${req.params.slug}`);
  } catch (error) {
    console.error("Error adding reaction to reply:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

module.exports = {
  getAllBlogs,
  createBlog,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  getBlogForEdit,
  addCommentToBlog,
  editComment,
  deleteComment,
  getEditComment,
  addReactionToComment,
  addReactionToBlog,
  replyToComment,
  getEditReply,
  updateReply,
  deleteReply,
  addReactionToReply,
};
