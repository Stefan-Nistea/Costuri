/* === Google Login + Visitor Flow === */

/**
 * Handles Google Identity Services credential response.
 * This function is triggered when Google login succeeds.
 */
function handleGoogleLogin(response) {
  try {
    // Save token for cloud-linked user session
    localStorage.setItem("userGoogleToken", response.credential);

    // Redirect to the main app
    window.location.href = "index.html";
  } catch (err) {
    console.error("Google login error:", err);
  }
}

/**
 * Visitor mode: Clears any previous login info and continues.
 * Data will be kept only in localStorage and lost after closing browser.
 */
function continueAsVisitor() {
  localStorage.removeItem("userGoogleToken");
  localStorage.setItem("visitorMode", "true");

  window.location.href = "index.html";
}
