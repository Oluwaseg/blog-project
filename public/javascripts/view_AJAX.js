function handleFormSubmission(form, event, type) {
  event.preventDefault();

  const formData = $(form).serialize();

  $.ajax({
    url: form.action,
    type: "POST",
    data: formData,
    success: function (data) {
      console.log("Data received from server:", data);

      if (type === "blog") {
        // Update likes and dislikes count for blog
        const likesSpan = $("#likesCount");
        const dislikesSpan = $("#dislikesCount");

        likesSpan.text(
          data.likesCount + (data.likesCount === 1 ? " Like" : " Likes")
        );
        dislikesSpan.text(
          data.dislikesCount +
            (data.dislikesCount === 1 ? " Dislike" : " Dislikes")
        );

        // Delayed update of button colors for blog
        setTimeout(() => {
          const likeButton = $(".likeButton");
          const dislikeButton = $(".dislikeButton");

          if (data.userLiked) {
            likeButton.addClass("text-red-500");
          } else {
            likeButton.removeClass("text-red-500");
          }

          if (data.userDisliked) {
            dislikeButton.addClass("text-blue-500");
          } else {
            dislikeButton.removeClass("text-blue-500");
          }
        }, 100); // Adjust the delay time if needed
      } else if (type === "comment") {
        // Update likes and dislikes count for comment
        const likesSpan = $("#likesComment");
        const dislikesSpan = $("#dislikesComment");

        likesSpan.text(
          data.likesComment + (data.likesComment === 1 ? " Like" : " Likes")
        );
        dislikesSpan.text(
          data.dislikesComment +
            (data.dislikesComment === 1 ? " Dislike" : " Dislikes")
        );

        // Delayed update of button colors for comment
        setTimeout(() => {
          const likeButton = $(".likeCommentBtn");
          const dislikeButton = $(".dislikeCommentBtn");

          if (data.likedComment) {
            likeButton.addClass("text-red-500");
          } else {
            likeButton.removeClass("text-red-500");
          }

          if (data.dislikedComment) {
            dislikeButton.addClass("text-blue-500");
          } else {
            dislikeButton.removeClass("text-blue-500");
          }
        }, 100); // Adjust the delay time if needed
      }
    },
    error: function (xhr, status, error) {
      console.error("Error:", error);
    },
  });
}

$("#likeForm").submit(function (event) {
  handleFormSubmission(this, event, "blog");
});

$("#dislikeForm").submit(function (event) {
  handleFormSubmission(this, event, "blog");
});

$("#likecomment").submit(function (event) {
  handleFormSubmission(this, event, "comment");
});

$("#dislikecomment").submit(function (event) {
  handleFormSubmission(this, event, "comment");
});
