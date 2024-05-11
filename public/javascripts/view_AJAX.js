function handleFormSubmission(form, event) {
  event.preventDefault();

  const formData = $(form).serialize();

  $.ajax({
    url: form.action,
    type: "POST",
    data: formData,
    success: function (data) {
      console.log("Data received from server:", data);

      const likesSpan = $("#likesCount");
      const dislikesSpan = $("#dislikesCount");

      likesSpan.text(
        data.likesCount + (data.likesCount === 1 ? " Like" : " Likes")
      );
      dislikesSpan.text(
        data.dislikesCount +
          (data.dislikesCount === 1 ? " Dislike" : " Dislikes")
      );

      if (data.userLiked) {
        $(".likeButton").addClass("text-red-500");
      } else {
        $(".likeButton").removeClass("text-red-500");
      }

      if (data.userDisliked) {
        $(".dislikeButton").addClass("text-blue-500");
      } else {
        $(".dislikeButton").removeClass("text-blue-500");
      }
    },
    error: function (xhr, status, error) {
      console.error("Error:", error);
    },
  });
}

$("#likeForm").submit(function (event) {
  handleFormSubmission(this, event);
});

$("#dislikeForm").submit(function (event) {
  handleFormSubmission(this, event);
});
