// Hide UI until guard check completes (safe for GSI)
document.documentElement.style.visibility = "hidden";

window.addEventListener("DOMContentLoaded", () => {
  const isVisitor = localStorage.getItem("visitorMode") === "true";
  const token = localStorage.getItem("userGoogleToken");

  // If this is the login page 
  const isLoginPage = window.location.pathname.endsWith("login.html");

  if (!isLoginPage) {

    // For internal pages → require login or visitor mode
    if (!token && !isVisitor) {
      window.location.href = "login.html";
      return;
    }
  }

  // Restore UI after successful check
  document.documentElement.style.visibility = "visible";
});
