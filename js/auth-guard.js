// Hide page until auth state is validated
document.documentElement.style.display = "none";

window.addEventListener("DOMContentLoaded", () => {
  const isVisitor = localStorage.getItem("visitorMode") === "true";
  const token = localStorage.getItem("userGoogleToken");

  // User not logged in → redirect immediately
  if (!token && !isVisitor) {
    window.location.href = "login.html";
    return;
  }

  // Auth OK → show the UI
  document.documentElement.style.display = "block";
});
