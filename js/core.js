/**
 * CORE MODULE — Core infrastructure for the entire SPA.
 * Provides base datasets, global state, language system,
 * persistent storage, exchange rate management, utilities,
 * UI helpers and the main application router.
 *
 * This module must load first, before all others.
 */


/* ============================================
   SEED DATA — Base application datasets
   --------------------------------------------
   These objects store all application data:
   monthly, yearly, utilities, administration,
   daily expenses and car-related entries.
   They form the global state loaded/saved
   through localStorage.
   ============================================ */

// Lunar

let data_lunar = {
  servicii: [
    { categorie: true, nume: "Utilitati" },
    { nume: "Internet si TV", cost: 66, moneda: "RON", activ: true, note: "" },

    { categorie: true, nume: "Servicii online" },
    { nume: "Google Drive",      cost: 10, moneda: "RON", activ: true, note: "" },
    { nume: "Youtube Premium",   cost: 29, moneda: "RON", activ: true, note: "" },
    { nume: "Amazon Prime",      cost: 20, moneda: "RON", activ: true, note: "" },
    { nume: "Spotify",           cost: 24, moneda: "RON", activ: true, note: "" },
    { nume: "Netflix",           cost: 56, moneda: "RON", activ: true, note: "" },
    { nume: "Disney Plus",       cost: 45, moneda: "RON", activ: true, note: "" },
    { nume: "HBO Max",           cost: 15, moneda: "RON", activ: true, note: "" },
    { nume: "GeoGuesser",        cost: 15, moneda: "RON", activ: true, note: "" },
    { nume: "Audiable",          cost: 48, moneda: "RON", activ: true, note: "" },
    { nume: "Microsoft",         cost: 48, moneda: "RON", activ: true, note: "" },

    { categorie: true, nume: "Consumabile" }
  ]
};


// Anual

let data_anual = {
  servicii: [
    { categorie: true, nume: "Abonamente" },
    { nume: "Bitdefender", cost: 330,  moneda: "RON", activ: true, note: "" },
    { nume: "Sala",        cost: 1700, moneda: "RON", activ: true, note: "" },
    { nume: "Genius",      cost: 99,   moneda: "RON", activ: true, note: "" }
  ]
};

// Utilities

let data_utilitati = {
  // Monthly payments (e.g. electricity, gas, water), aggregated as simple rows
  plati: [],
  // Electricity readings by month
  citiri_curent: [],
  // Gas readings by month
  citiri_gaz: []
};


// Administration

let data_administratie = {
  // Admin payments: { luna, suma, moneda }
  plati: [],
  // Water meter readings: { luna, contor1, contor2, cost_factura }
  apa: [],
  // Global cost per m³ used for auto-calculation in UI
  cost_pe_mc: 10
};


// Daily

let data_zilnic = {
  // Daily / monthly supermarket entries:
  // { tip: 'supermarket', luna: 'YYYY-MM', supermarket: 'Lidl', suma: Number }
  tranzactii: []
};


let data_car = {
  // Car transactions:
  // - Fuel rows: { tip:'car', subt:'fuel', data, luna, odometru, litri, pret_litru, fuelType, suma }
  // - Service/Tax rows: { tip:'car', subt:'alt', data, luna, denumire, suma }
  tranzactii: []
};


/* ============================================
   GLOBAL REFERENCES — Shared runtime state
   --------------------------------------------
   Chart.js instances, sortable handlers,
   current active page and other runtime
   variables used across the entire SPA.
   ============================================ */
   
// Charts
let chartHomePie, chartAnual;
let chartUtilPlati, chartUtilCurent, chartUtilGaz;
let chartAdminPlati, chartAdminApa;
let chartZilnic;
let chartZilnicPieMonth, chartZilnicPieAll;

// Sortable instances
let sortableHome = null;
let sortableAnual = null;

// Current visible SPA "page" key: 'lunar' | 'utilitati' | 'administratie' | 'zilnic'
let currentPage = 'lunar';

/* Tracks whether the user has unsaved changes */
let hasUnsavedChanges = false;

/* ============================================
   LANGUAGE SYSTEM (i18n)
   --------------------------------------------
   Detects initial language, caches translation
   files, applies translations to UI elements,
   and exposes language loader globally.
   ============================================ */

// Detect the best language to use at startup
function detectInitialLanguage() {

  // 1. Check if a language was already saved by the user
  const saved = localStorage.getItem("appLang");
  if (saved) return saved;

  // 2. Read browser language (example: "en-US" → "en")
  const browserLang = navigator.language?.substring(0, 2).toLowerCase();

  // 3. Accept only "ro" or "en" for this app
  if (browserLang === "ro") return "ro";
  if (browserLang === "en") return "en";

  // 4. Fallback language
  return "en";
}

let currentLang = localStorage.getItem("lang") || "ro";

// Cache for both languages to avoid repeated fetch requests
const i18nCache = {};

// Load and apply translations for the selected language with fallback support
async function loadLanguage(lang) {

  // Load primary language into cache
  if (!i18nCache[lang]) {
    const response = await fetch(`i18n/${lang}.json?v=${Date.now()}`);
    i18nCache[lang] = await response.json();
  }

  // Determine fallback language (EN <-> RO)
  const fallbackLang = lang === "ro" ? "en" : "ro";

  // Load fallback language if not already cached
  if (!i18nCache[fallbackLang]) {
    const responseFallback = await fetch(`i18n/${fallbackLang}.json?v=${Date.now()}`);
    i18nCache[fallbackLang] = await responseFallback.json();
  }

  const primaryTexts   = i18nCache[lang];
  const fallbackTexts  = i18nCache[fallbackLang];

  // Apply translations for normal text elements
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");

    // Priority order: primary language → fallback → keep existing
    if (primaryTexts[key]) el.textContent = primaryTexts[key];
    else if (fallbackTexts[key]) el.textContent = fallbackTexts[key];
  });

  // Apply translations for placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");

    if (primaryTexts[key]) el.placeholder = primaryTexts[key];
    else if (fallbackTexts[key]) el.placeholder = fallbackTexts[key];
  });

  // Store language preference
  currentLang = lang;
  localStorage.setItem("appLang", lang);
}

window.loadLanguage = loadLanguage;


/* ============================================
   LOCAL STORAGE — Load & Save
   --------------------------------------------
   Handles persistent storage of all datasets.
   Ensures backward compatibility and safe data
   normalization when older structures are found.
   ============================================ */

/**
 * Load persisted state from localStorage into in-memory structures.
 * Ensures backward compatibility and safe defaults.
 */
function loadDataLocal() {
  try {
    const dl     = localStorage.getItem("data_lunar");
    const da     = localStorage.getItem("data_anual");
    const du     = localStorage.getItem("data_utilitati");
    const dadmin = localStorage.getItem("data_administratie");
    const dz     = localStorage.getItem("data_zilnic");
    const dc     = localStorage.getItem("data_car");

    if (dl) data_lunar = JSON.parse(dl);
    if (da) data_anual = JSON.parse(da);
    if (du) data_utilitati = JSON.parse(du);
    if (dadmin) data_administratie = JSON.parse(dadmin);
    if (dz) data_zilnic = JSON.parse(dz);
    if (dc) data_car = JSON.parse(dc);

    // Normalize / migrate shapes if older data is present

    if (!Array.isArray(data_zilnic.tranzactii)) {
      data_zilnic.tranzactii = [];
    }

    if (!Array.isArray(data_car.tranzactii)) {
      data_car.tranzactii = [];
    }

    if (!data_utilitati.plati) {
      data_utilitati.plati = [];
    }

    // Legacy: `citiri` -> `citiri_curent`
    if (!data_utilitati.citiri_curent && data_utilitati.citiri) {
      data_utilitati.citiri_curent = data_utilitati.citiri;
    }
    if (!data_utilitati.citiri_gaz) {
      data_utilitati.citiri_gaz = [];
    }
    delete data_utilitati.citiri;

    if (!data_administratie.plati) {
      data_administratie.plati = [];
    }
    if (!data_administratie.apa) {
      data_administratie.apa = [];
    }
    if (typeof data_administratie.cost_pe_mc !== "number") {
      data_administratie.cost_pe_mc = 10;
    }

  } catch (e) {
    console.warn("Invalid data in localStorage. Resetting all stored state.", e);
    localStorage.clear();
  }
}


/* Activates or deactivates the cloud save button */
function updateCloudSaveButton() {
  const btn = document.getElementById("cloudSaveBtn");
  if (!btn) return;

  if (hasUnsavedChanges) {
    btn.classList.add("active");
    btn.disabled = false;
  } else {
    btn.classList.remove("active");
    btn.disabled = true;
  }
}

// === FIRESTORE SYNC ===

// === Load user data from Firestore ===
async function cloudLoadUserData(uid) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();

  if (!snap.exists) return null;
  return snap.data();
}

// === Save user data to Firestore ===
async function cloudSaveUserData(uid) {
  // Try to get UID from argument or from current Firebase user
  const current = firebase.auth().currentUser;
  const finalUid = uid || (current && current.uid);

  // If we still do not have a UID → skip save safely
  if (!finalUid) {
    console.warn("cloudSaveUserData: missing UID, skipping save.");
    return;
  }

  const ref = db.collection("users").doc(finalUid);

  await ref.set({
    data_lunar,
    data_anual,
    data_utilitati,
    data_administratie,
    data_zilnic,
    data_car,
    last_updated: Date.now()
  }, { merge: true }); // merge prevents accidental deletion
}


// === Synchronize local data with Firestore ===
async function syncWithCloud() {
  const user = firebase.auth().currentUser;
  if (!user) return; // visitor mode → skip cloud sync

  const uid = user.uid;
  console.log("Sync: loading cloud data…");

  // 1. Load existing cloud data
  const cloud = await cloudLoadUserData(uid);

  if (cloud) {
    console.log("Sync: Cloud → Local merge");

    // Merge Cloud → Local only if cloud fields exist
    data_lunar         = cloud.data_lunar         ?? data_lunar;
    data_anual         = cloud.data_anual         ?? data_anual;
    data_utilitati     = cloud.data_utilitati     ?? data_utilitati;
    data_administratie = cloud.data_administratie ?? data_administratie;
    data_zilnic        = cloud.data_zilnic        ?? data_zilnic;
    data_car           = cloud.data_car           ?? data_car;

    saveDataLocal();
  } else {
    console.log("Sync: First login detected → Local → Cloud");
  }

  // 2. Save merged result back into Firestore (always)
  await cloudSaveUserData(uid);

  console.log("Sync: Completed.");
}


/**
 * Persist current in-memory state into localStorage.
 * Called after each mutating operation or global update.
 */
function saveDataLocal() {
  try {
    localStorage.setItem("data_lunar", JSON.stringify(data_lunar));
    localStorage.setItem("data_anual", JSON.stringify(data_anual));
    localStorage.setItem("data_utilitati", JSON.stringify(data_utilitati));
    localStorage.setItem("data_administratie", JSON.stringify(data_administratie));
    localStorage.setItem("data_zilnic", JSON.stringify(data_zilnic));
    localStorage.setItem("data_car", JSON.stringify(data_car));
    localStorage.setItem("lastPage", currentPage);
  } catch (err) {
    console.error("Failed to write to localStorage:", err);
  }

}


/* ============================================
   HELPERS — General purpose utilities
   --------------------------------------------
   Formatting helpers, date converters and other
   functions used throughout multiple modules.
   These contain no business logic.
   ============================================ */

/**
 * Format number as RON-style with 2 decimals using ro-RO locale.
 */
function fmt(n) {
  return Number(n || 0).toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


/**
 * Formats a date key in the format "YYYY-MM" into a readable Romanian month-year string.
 * Example: "2025-10" → "octombrie 2025".
 
 * @param {string} luna - The month identifier in "YYYY-MM" format.
 
 * @returns {string} Localized formatted month and year string.
 */
function formatLunaAn(luna) {
  const [year, month] = luna.split('-');
  return new Date(year, month - 1).toLocaleString('ro-RO', {
    month: 'long',
    year: 'numeric'
  });
}


/**
 * Sets an <input type="month"> element to the current month (YYYY-MM).
 * Example: if today is 2025-11-19 → the field will be set to "2025-11".
 *
 * @param {string} id - The DOM element ID of the month input.
 */
function setDefaultMonth(id){
  const ym = new Date().toISOString().slice(0,7);
  const el = document.getElementById(id);
  if (el) el.value = ym;
}


/**
 * Generates a random pastel-like RGB color.
 * Used for chart segment backgrounds to keep visuals bright yet soft.
 
 * @returns {string} RGB color string (e.g., "rgb(120,180,150)").
 */
function getRandomColor() {
  const r = Math.floor(Math.random() * 120 + 80);
  const g = Math.floor(Math.random() * 160 + 80);
  const b = Math.floor(Math.random() * 140 + 100);
  return `rgb(${r}, ${g}, ${b})`;
}


/* ============================================
   EXCHANGE RATES — BNR + Manual Rates
   --------------------------------------------
   Provides real-time conversion RON/EUR/USD.
   Reads manual values from UI or falls back to
   stored defaults. Includes auto-update from
   BNR XML feed with graceful fallback.
   ============================================ */

let exchangeRates = {
  EUR: 5.08,
  USD: 4.4,
  RON: 1
};


/**
 * Fetches XML feed from BNR and extracts RON conversion values.
 * Uses browser DOMParser to read <Rate currency="EUR"> and <Rate currency="USD">.
 */
function getRates() {
  // Citim din input-uri dacă există valori, altfel folosim fallback-urile
  const eurInput = parseFloat(document.getElementById('rateEUR')?.value);
  const usdInput = parseFloat(document.getElementById('rateUSD')?.value);

  return {
    EUR: !isNaN(eurInput) ? eurInput : exchangeRates.EUR,
    USD: !isNaN(usdInput) ? usdInput : exchangeRates.USD,
    RON: 1
  };
}


/**
 * Fetches and updates the latest EUR and USD exchange rates from the
 * National Bank of Romania (BNR) XML feed.
 * Automatically updates the related input fields in the UI.
 * If the request fails or data is incomplete, default fallback values are used.
 */
async function updateRatesFromBNR() {
  try {
    // Request the official XML feed from BNR
    const response = await fetch('https://www.bnr.ro/nbrfxrates.xml');
    const xmlText = await response.text();

    // Parse XML response into a DOM structure
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Extract <Rate> elements and find EUR and USD
    const rates = xmlDoc.getElementsByTagName('Rate');
    let eur = null, usd = null;

    for (let r of rates) {
      const currency = r.getAttribute('currency');
      if (currency === 'EUR') eur = parseFloat(r.textContent.replace(',', '.'));
      if (currency === 'USD') usd = parseFloat(r.textContent.replace(',', '.'));
    }

    // Ensure both rates were found
    if (!eur || !usd) throw new Error('Missing FX rates in BNR XML');

    // Update UI fields
    document.getElementById('rateEUR').value = eur.toFixed(4);
    document.getElementById('rateUSD').value = usd.toFixed(4);

    console.log(`BNR exchange rates updated: EUR ${eur} / USD ${usd}`);

  } catch (e) {
    // Handle network or parsing errors gracefully
    console.warn('Error fetching BNR exchange rates — using default values.', e);

    // Default fallback exchange rates
    const eur = 5.08;
    const usd = 4.40;

    // Update UI fields with fallback values
    document.getElementById('rateEUR').value = eur.toFixed(4);
    document.getElementById('rateUSD').value = usd.toFixed(4);
  }

  // Update last refresh timestamp in the interface
  const info = document.getElementById('ratesInfo');
  if (info) {
    const now = new Date();
    info.innerText = `Ultima actualizare automată: ${now.toLocaleString('ro-RO')} (BNR)`;
  }

  // Recalculate and re-render all dependent data
  updateAll();
}

/* ============================================
   GLOBAL UI — Layout & Interaction Helpers
   --------------------------------------------
   Column resizing, scroll-based effects and
   full-page zoom (Ctrl + scroll) are defined
   here because they apply to all pages.
   ============================================ */

/**
 * Enables column resizing for all tables with class ".services-table".
 * Adds draggable resizers inside table headers, persists column widths
 * in localStorage, and restores them automatically on reload.
 */
function enableColumnResize() {
  document.querySelectorAll('.services-table').forEach((table, tableIndex) => {
    table.querySelectorAll('th').forEach((th, colIndex) => {
      // Skip if resizer already exists (avoid duplicates)
      if (th.querySelector('.col-resizer')) return;

      // Create and append resizer element
      const resizer = document.createElement('div');
      resizer.classList.add('col-resizer');
      th.appendChild(resizer);

      // Minimum width (fallback 60px)
      const minW = parseInt(getComputedStyle(th).minWidth) || 40;

      // Restore saved column width from localStorage
      const savedWidth = localStorage.getItem(`colWidth_${tableIndex}_${colIndex}`);
      if (savedWidth) th.style.width = savedWidth;

      let startX, startWidth;

      // --- Mouse interaction handlers ---
      resizer.addEventListener('mousedown', function (e) {
        startX = e.pageX;
        startWidth = th.offsetWidth;
        document.documentElement.style.cursor = 'col-resize';

        // Handle column resizing dynamically
        function onMouseMove(e) {
          const newWidth = startWidth + (e.pageX - startX);
          if (newWidth >= minW) {
            th.style.width = newWidth + 'px';
          }
        }

        // Finalize and save column width on mouse release
        function onMouseUp() {
          localStorage.setItem(`colWidth_${tableIndex}_${colIndex}`, th.style.width);
          document.documentElement.style.cursor = '';
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  });
}


/**
 * Adds or removes a `.scrolled` CSS class when
 * the daily transactions table is scrolled vertically.
 * Used to apply subtle shadow or styling effects
 * to the fixed table header on the Zilnic page.
 */
document.addEventListener('scroll', e => {
  const container = document.querySelector('#zilnicTableContainer');
  if (!container) return;
  if (container.scrollTop > 5) container.classList.add('scrolled');
  else container.classList.remove('scrolled');
}, true);


/* ============================================
   ROUTER & APP STARTUP
   --------------------------------------------
   SPA page loader, dynamic HTML injection and
   initial DOMContentLoaded initialization.
   Controls navigation and prepares the UI for
   all modules.
   ============================================ */

/**
 * Loads a given HTML page dynamically into the main content container.
 * Handles navigation highlighting, chart initialization, table resizing,
 * and page-specific logic (e.g., Car tab handling on the "Zilnic" page).
 
 * @param {string} page - The page name (without ".html" extension).
 */
async function loadPage(page) {
  try {
    // Load page HTML
    const res = await fetch(`${page}.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = html;

    // Apply translations before UI updates
    loadLanguage(currentLang);

    // Page-specific for Zilnic
    if (page === 'zilnic') {
      const carTip = document.getElementById('carTip');
      if (carTip) {
        const rebind = () => {
          const isFuel = carTip.value === 'benzina';
          document.getElementById('carFuelFields').style.display = isFuel ? 'flex' : 'none';
          document.getElementById('carAltFields').style.display = isFuel ? 'none' : 'flex';
          switchCarTable(isFuel ? 'fuel' : 'alt');
        };
        carTip.onchange = rebind;
        rebind();
      }
    }

    // Update navigation active state
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(
      `btn${page.charAt(0).toUpperCase() + page.slice(1)}`
    );
    if (activeBtn) activeBtn.classList.add('active');

    // Update current page and persist it
    currentPage = page;
    saveDataLocal();

    // Init charts & column resizing
    initChartsFor(page);
    setTimeout(enableColumnResize, 0);

    // Update UI + auto-rows + totals
    updateAll();

    // Reapply language after DOM updates
    setTimeout(() => loadLanguage(currentLang), 10);

    // ===========================================
    //   RE-ATTACH CLOUD SAVE BUTTON (FIXED)
    // ===========================================
    const cloudBtn = document.getElementById("cloudSaveBtn");

    if (cloudBtn) {
      // Remove old listeners (SPA-safe)
      const newBtn = cloudBtn.cloneNode(true);
      cloudBtn.parentNode.replaceChild(newBtn, cloudBtn);

      newBtn.addEventListener("click", async () => {
        const user = firebase.auth().currentUser;
        const visitorNow = localStorage.getItem("visitorMode") === "true";

        if (!user || visitorNow) {
          alert("Cloud save is available only for logged-in users.");
          return;
        }

        newBtn.textContent = "Saving…";
        newBtn.disabled = true;

        try {
          await cloudSaveUserData(user.uid);
          hasUnsavedChanges = false;
          updateCloudSaveButton();

          newBtn.textContent = "Saved";
          setTimeout(() => newBtn.textContent = "Save changes", 1500);
        } catch (err) {
          console.error("Cloud save error:", err);

          newBtn.textContent = "Error";
          setTimeout(() => newBtn.textContent = "Save changes", 2000);
        }
      });
    }

  } catch (e) {
    console.error('Error loading page:', page, e);
    document.getElementById('content').innerHTML = `
      <p style="color:#b91c1c; background:#fee2e2; padding:8px; border-radius:8px;">
        Eroare la încărcarea paginii <b>${page}.html</b>.
      </p>`;
  }

  // Pre-fill month inputs
  setDefaultMonth("adminPlataLuna");
  setDefaultMonth("utilPlataLuna");
  setDefaultMonth("utilCurentLuna");
  setDefaultMonth("utilGazLuna");
  setDefaultMonth("adminApaLuna");
  setDefaultMonth("zilnicLuna");
  setDefaultMonth("carData");
}



/**
 * Main initialization routine executed after DOM is fully loaded.
 * Loads data from localStorage, binds navigation buttons dynamically,
 * sets up rate update controls, and restores the last visited page.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("App start → waiting for Firebase…");

  currentLang = detectInitialLanguage();
  loadLanguage(currentLang);

  firebase.auth().onAuthStateChanged(async user => {
    const isVisitor = localStorage.getItem("visitorMode") === "true";
    const userDisp = document.getElementById("userDisplay");

    // Display user name / guest
    if (user) {
      userDisp.textContent = user.displayName || user.email || "User";
    } else {
      userDisp.textContent = "Guest";
    }

    // ============================
    // CASE 1: LOGGED IN USER
    // ============================
    if (user && !isVisitor) {
      console.log("Logged in → Cloud is authoritative");

      localStorage.setItem("userID", user.uid);

      try {
        await syncWithCloud();   // CLOUD → LOCAL
        updateAll();             // UI din cloud
      } catch (err) {
        console.error("Cloud sync failed:", err);
        loadDataLocal();
        updateAll();
      }
    }

    // ============================
    // CASE 2: VISITOR or LOGGED OUT
    // ============================
    else {
      console.log("Visitor or logged-out → using LOCAL ONLY");
      loadDataLocal();
      updateAll();
    }

    // ============================
    // NAV + RATES
    // ============================
    document.querySelectorAll('#mainNav .main-nav-btn').forEach(btn => {
      const page = btn.getAttribute('data-page');
      if (!page) return;
      btn.addEventListener('click', () => loadPage(page));
    });

    const btnRates = document.getElementById('applyRates');
    if (btnRates) btnRates.addEventListener('click', updateAll);

    const btnAutoRates = document.getElementById('autoRates');
    if (btnAutoRates) {
      btnAutoRates.addEventListener('click', async () => {
        await updateRatesFromBNR();
      });
    }

    // ============================
    // LOAD INITIAL PAGE
    // ============================
    const hasAuth = localStorage.getItem("userGoogleToken") || 
                    localStorage.getItem("visitorMode");

    if (!hasAuth) {
      loadPage("login");
      return;
    }

    let last = (localStorage.getItem('lastPage') || 'lunar').toLowerCase();
    if (!['lunar', 'utilitati', 'administratie', 'zilnic'].includes(last)) last = 'lunar';
    loadPage(last);

    // ============================
    // CLOUD SAVE BUTTON
    // ============================
    const cloudBtn = document.getElementById("cloudSaveBtnHome") 
              || document.getElementById("cloudSaveBtnLunar");
    if (cloudBtn) {
      cloudBtn.addEventListener("click", async () => {
        const user = firebase.auth().currentUser;
        const visitorNow = localStorage.getItem("visitorMode") === "true";

        if (!user || visitorNow) {
          alert("Cloud save is available only for logged-in users.");
          return;
        }

        cloudBtn.textContent = "Saving…";
        cloudBtn.disabled = true;

        try {
          await cloudSaveUserData(user.uid);
          hasUnsavedChanges = false;
          updateCloudSaveButton();
          cloudBtn.textContent = "Saved";
          setTimeout(() => cloudBtn.textContent = "Save changes", 1500);
        } catch (err) {
          console.error("Cloud save error:", err);
          cloudBtn.textContent = "Error";
          setTimeout(() => cloudBtn.textContent = "Save changes", 2000);
        }
      });
    }

  });
});


// === LOGOUT HANDLER (Safe cloud save + full local cleanup) ===
async function logoutUser() {
  const user = firebase.auth().currentUser;
  console.log("Logout initiated…");

  // If a real authenticated user exists → save data to cloud before clearing
  if (user) {
    try {
      console.log("Saving user data to cloud before logout…");
      await cloudSaveUserData(user.uid);
      console.log("Cloud save completed.");
    } catch (err) {
      console.warn("Cloud save failed during logout:", err);
      // Do not block logout; proceed anyway.
    }
  } else {
    console.log("Visitor logout → no cloud save required.");
  }

  // Sign out from Firebase Auth (if applicable)
  try {
    await firebase.auth().signOut();
  } catch (err) {
    console.warn("Sign-out error (ignored):", err);
  }

  // Clear all local data (both users and visitors)
  localStorage.clear();

  // Redirect back to login page
  window.location.href = "login.html";
}

window.logoutUser = logoutUser;
