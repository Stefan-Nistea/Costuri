/* ==============================
   GOOGLE LOGIN + FIREBASE AUTH
   ============================== */

window.handleGoogleLogin = function (response) {
  try {
    const idToken = response.credential;
    if (!idToken) {
      console.error("Google login error: Missing ID token.");
      return;
    }

    const payload = JSON.parse(atob(idToken.split('.')[1] || ""));
    const googleUID = payload.sub;

    if (!googleUID) {
      console.error("Google login error: Missing 'sub'.");
      return;
    }

    localStorage.setItem("userGoogleToken", idToken);
    localStorage.setItem("userID", googleUID);
    localStorage.removeItem("visitorMode");

    const firebaseCredential =
      firebase.auth.GoogleAuthProvider.credential(idToken, null);

    firebase.auth()
      .signInWithCredential(firebaseCredential)
      .then(() => window.location.href = "index.html")
      .catch(err => {
        console.error("Firebase Auth error:", err);
        alert("Login error: Firebase authentication failed.");
      });

  } catch (err) {
    console.error("Google login error:", err);
    alert("Login error: Unexpected issue during sign-in.");
  }
};


/* =========================================
   GOOGLE IDENTITY SERVICES INITIALIZATION 
   ========================================= */

function onGoogleLibraryLoad() {

  google.accounts.id.initialize({
    client_id: "889298108360-kfn17tvq3qc3qkm4f1lm0of14ilsuo0p.apps.googleusercontent.com",
    callback: window.handleGoogleLogin
  });

  const btn = document.getElementById("customGoogleBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      google.accounts.id.prompt();
    });
  }
}

window.onGoogleLibraryLoad = onGoogleLibraryLoad;


/* ==============
   VISITOR MODE
   ============== */

function continueAsVisitor() {
  localStorage.removeItem("userGoogleToken");
  localStorage.removeItem("userID");
  localStorage.setItem("visitorMode", "true");
  window.location.href = "index.html";
}


/* =================
   LANGUAGE SYSTEM
   ================= */

const loginTexts = {
  en: {
    title: "Welcome!",
    subtitle: "Choose a login option",
    visitor_btn: "Continue as visitor",
    visitor_info: "Visitor mode keeps data only locally and will be lost when you close the browser.",
    legal_text: "By continuing, you agree to the",
    legal_and: "and",
    terms: "T&A/terms.html",
    privacy: "T&A/privacy.html"
  },
  ro: {
    title: "Bun venit!",
    subtitle: "Alege o opțiune de autentificare",
    visitor_btn: "Continuă ca vizitator",
    visitor_info: "Modul vizitator păstrează datele doar local și vor fi pierdute când închizi browserul.",
    legal_text: "Continuând, ești de acord cu",
    legal_and: "și",
    terms: "T&A/terms_ro.html",
    privacy: "T&A/privacy_ro.html"
  }
};


function applyLoginLang(lang) {
  const t = loginTexts[lang] || loginTexts.en;

  document.getElementById("login_title").textContent = t.title;
  document.getElementById("login_subtitle").textContent = t.subtitle;
  document.getElementById("visitor_btn").textContent = t.visitor_btn;
  document.getElementById("visitor_info").textContent = t.visitor_info;
  document.getElementById("legal_text").textContent = t.legal_text;
  document.getElementById("legal_and").textContent = t.legal_and;

  document.getElementById("link_terms").href = t.terms;
  document.getElementById("link_privacy").href = t.privacy;

  document.querySelectorAll(".lang-switch button")
    .forEach(b => b.classList.remove("active"));

  document
    .querySelector(`.lang-switch button[data-lang="${lang}"]`)
    .classList.add("active");

  localStorage.setItem("loginLang", lang);
}


const browserLang = navigator.language.startsWith("ro") ? "ro" : "en";
const savedLang = localStorage.getItem("loginLang") || browserLang;


document.addEventListener("DOMContentLoaded", () => {
  applyLoginLang(savedLang);

  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      applyLoginLang(btn.dataset.lang);
    });
  });
});
