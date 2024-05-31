$(document).ready(function () {
  // Function to handle blog reactions
  function handleBlogReaction(form, event) {
    event.preventDefault();

    const formData = $(form).serialize();

    $.ajax({
      url: form.action,
      type: "POST",
      data: formData,
      success: function (data) {
        console.log("Data received from server:", data);

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

        setTimeout(() => {
          const likeButton = $(".likeButton");
          const dislikeButton = $(".dislikeButton");

          console.log("Like Button Selector:", likeButton);
          console.log("Dislike Button Selector:", dislikeButton);
          console.log("User Disliked:", data.userDisliked);
          console.log("Dislikes Count:", data.dislikesCount);

          // Debugging: Log class changes for like and dislike buttons
          console.log("Like Button Classes:", likeButton.attr("class"));
          console.log("Dislike Button Classes:", dislikeButton.attr("class"));

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
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
  }

  // Function to handle comment reactions
  function handleCommentReaction(form, event) {
    event.preventDefault();

    const formData = $(form).serialize();

    $.ajax({
      url: form.action,
      type: "POST",
      data: formData,
      success: function (data) {
        console.log("Data received from server:", data);

        // Update likes and dislikes count for comment
        const commentId = data.commentId;
        const likesSpan = $(`#likesComment${commentId}`);
        const dislikesSpan = $(`#dislikesComment${commentId}`);

        likesSpan.text(
          data.likesComment + (data.likesComment === 1 ? " Like" : " Likes")
        );
        dislikesSpan.text(
          data.dislikesComment +
            (data.dislikesComment === 1 ? " Dislike" : " Dislikes")
        );

        // Delayed update of button colors for comment
        setTimeout(() => {
          const likeButton = $(`#likecomment${commentId} .likeCommentBtn`);
          const dislikeButton = $(
            `#dislikecomment${commentId} .dislikeCommentBtn`
          );
          console.log("Like Button Selector:", likeButton);
          console.log("Dislike Button Selector:", dislikeButton);

          // Ensure buttons are selected correctly
          if (likeButton.length === 0 || dislikeButton.length === 0) {
            console.error("Buttons not found:", {
              likeButton: likeButton.length,
              dislikeButton: dislikeButton.length,
            });
            return;
          }
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
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
  }

  // Event delegation for blog reactions
  $("#likeForm").submit(function (event) {
    handleBlogReaction(this, event);
  });

  $("#dislikeForm").submit(function (event) {
    handleBlogReaction(this, event);
  });

  // Event delegation for comment reactions
  $(document).on("submit", "form[id^='likecomment']", function (event) {
    handleCommentReaction(this, event);
  });

  $(document).on("submit", "form[id^='dislikecomment']", function (event) {
    handleCommentReaction(this, event);
  });
});
