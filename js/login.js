/* === Google Login + Firebase Auth Integration === */

function handleGoogleLogin(response) {
  try {
    const idToken = response.credential;

    if (!idToken) {
      console.error("Google login error: Missing ID token.");
      return;
    }

    // Decode Google JWT to extract UID ("sub")
    let payload;
    try {
      payload = JSON.parse(atob(idToken.split('.')[1]));
    } catch (err) {
      console.error("Failed to decode Google ID token:", err);
      return;
    }

    const googleUID = payload.sub;
    if (!googleUID) {
      console.error("Google login error: Missing 'sub' in token payload.");
      return;
    }

    // Save raw Google token + UID locally
    localStorage.setItem("userGoogleToken", idToken);
    localStorage.setItem("userID", googleUID);
    localStorage.removeItem("visitorMode"); // Ensure visitor mode is disabled

    // === SIGN IN TO FIREBASE USING GOOGLE ID TOKEN ===
    const firebaseCredential = firebase.auth.GoogleAuthProvider.credential(idToken, null);

    firebase.auth()
      .signInWithCredential(firebaseCredential)
      .then(() => {
        console.log("Firebase Auth successful.");
        window.location.href = "index.html";
      })
      .catch(err => {
        console.error("Firebase Auth error:", err);
        alert("Login error: Firebase authentication failed.");
      });

  } catch (err) {
    console.error("Google login error:", err);
    alert("Login error: Unexpected issue during sign-in.");
  }
}


/* === Visitor Mode (local-only session) === */
function continueAsVisitor() {
  localStorage.removeItem("userGoogleToken");
  localStorage.removeItem("userID");
  localStorage.setItem("visitorMode", "true");

  window.location.href = "index.html";
}
