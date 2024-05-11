function shareURL() {
  var currentURL = window.location.href;

  if (navigator.share) {
    navigator
      .share({
        title: "Share this link",
        url: currentURL,
      })
      .then(() => console.log("Shared successfully"))
      .catch((error) => console.error("Error sharing:", error));
  } else {
    alert(
      "Web Share API is not supported. You can manually copy the link: " +
        currentURL
    );
  }
}
function copyToClipboard() {
  const divContent = document.getElementById("content").innerText;
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = divContent;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
  showTooltip("tooltip-copy");
}

function downloadFile() {
  const url = window.location.href;
  const filename = url.substring(url.lastIndexOf("/") + 1);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showTooltip("tooltip-download");
}

function showTooltip(id) {
  const tooltip = document.getElementById(id);
  tooltip.classList.remove("invisible");
  tooltip.classList.add("opacity-100");
  setTimeout(() => {
    tooltip.classList.remove("opacity-100");
    tooltip.classList.add("invisible");
  }, 2000);
}
