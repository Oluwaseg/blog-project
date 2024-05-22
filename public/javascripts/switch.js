document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.querySelector(".swap input");
  const htmlElement = document.documentElement;

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  });

  // Initialize based on the current checkbox state
  if (checkbox.checked) {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }
});
