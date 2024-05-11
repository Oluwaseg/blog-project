const modeSwitchIcon = document.getElementById("modeSwitchIcon");
let darkMode = false;

modeSwitchIcon.addEventListener("click", function () {
  darkMode = !darkMode;
  if (darkMode) {
    modeSwitchIcon.classList.remove("fa-sun");
    modeSwitchIcon.classList.add("fa-moon");
    modeSwitchIcon.classList.remove("text-yellow-500");
    modeSwitchIcon.classList.add("text-gray-300");
  } else {
    modeSwitchIcon.classList.remove("fa-moon");
    modeSwitchIcon.classList.add("fa-sun");
    modeSwitchIcon.classList.remove("text-gray-300");
    modeSwitchIcon.classList.add("text-yellow-500");
  }
  document.body.classList.toggle("dark");
  document.body.classList.toggle("transition");
});
