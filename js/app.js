"use strict";

/**
 * app.js — Personal Finance SPA (Client-side)
 *
 * Core client-side logic for:
 * - Monthly (lunar) and yearly (anual) recurring services
 * - Utilities and administration payments
 * - Daily supermarket & car expenses
 * - Charts, summaries and cross-section synchronization
 *
 */

/* =========================
 * SEED DATA
 * ========================= */
 
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

/* ========================
 * SEED DATA: YEARLY (ANUAL)
 * ======================== */


let data_anual = {
  servicii: [
    { categorie: true, nume: "Abonamente" },
    { nume: "Bitdefender", cost: 330,  moneda: "RON", activ: true, note: "" },
    { nume: "Sala",        cost: 1700, moneda: "RON", activ: true, note: "" },
    { nume: "Genius",      cost: 99,   moneda: "RON", activ: true, note: "" }
  ]
};


/* ==========================
 * SEED DATA: UTILITIES (BILL)
 * ========================== */
 

let data_utilitati = {
  // Monthly payments (e.g. electricity, gas, water), aggregated as simple rows
  plati: [],
  // Electricity readings by month
  citiri_curent: [],
  // Gas readings by month
  citiri_gaz: []
};

/* ===============================
 * SEED DATA: ADMINISTRATION (HOA)
 * =============================== */
 
let data_administratie = {
  // Admin payments: { luna, suma, moneda }
  plati: [],
  // Water meter readings: { luna, contor1, contor2, cost_factura }
  apa: [],
  // Global cost per m³ used for auto-calculation in UI
  cost_pe_mc: 10
};


/* ==========================
 * SEED DATA: DAILY SUPERMARKET
 * ========================== */
 

let data_zilnic = {
  // Daily / monthly supermarket entries:
  // { tip: 'supermarket', luna: 'YYYY-MM', supermarket: 'Lidl', suma: Number }
  tranzactii: []
};

/* ======================
 * SEED DATA: CAR EXPENSES
 * ====================== */

let data_car = {
  // Car transactions:
  // - Fuel rows: { tip:'car', subt:'fuel', data, luna, odometru, litri, pret_litru, fuelType, suma }
  // - Service/Tax rows: { tip:'car', subt:'alt', data, luna, denumire, suma }
  tranzactii: []
};

/* ================
 * GLOBAL REFERENCES
 * ================ */

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


/* =====================
   Language System
   ===================== */

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


/* =================
 * LOCAL STORAGE I/O
 * ================= */

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

/* =================
 * FORMAT HELPERS
 * ================= */

/**
 * Format number as RON-style with 2 decimals using ro-RO locale.
 */
function fmt(n) {
  return Number(n || 0).toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ================================
 * EXCHANGE RATES — BNR XML PARSER
 * ================================
 *
 * Fetches official daily exchange rates (RON-EUR-USD) from BNR feed.
 * Updates the global conversion object and refreshes the UI if needed.
 */

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


/* ============================================
 * GENERAL UTILITIES & ADMIN WATER HANDLERS
 * ============================================ */

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


/**
 * Updates the stored cost per cubic meter (m³) for water in the Administration module.
 * Reads the value from the input field, validates it, saves it to the dataset,
 * re-renders the water readings table, and persists the data locally.
 */
function applyAdminCost() {
  const v = parseFloat(document.getElementById('adminCostPeMc').value);
  if (isNaN(v)) return;

  data_administratie.cost_pe_mc = v;
  renderAdminApa();
  saveDataLocal();
}


/* =========================================
 * GLOBAL REFRESH — RECOMPUTE & RE-RENDER UI
 * =========================================
 *
 * Triggered whenever data changes or after page load.
 * Responsibilities:
 *  - Persist data in localStorage
 *  - Update per-page summaries and charts
 *  - Keep media values (supermarket / car / utilitati) in sync
 */

function updateAll() {
  // --- Keep cross-page data synced ---
  syncAllToLunar();

  // --- Refresh main tables ---
  if (typeof renderTable === "function") renderTable("lunar");
  if (typeof renderTable === "function") renderTable("anual");
  if (typeof updateTotalsUI === "function") updateTotalsUI();

  // --- Refresh utilities ---
  if (typeof renderUtilPlati === "function") renderUtilPlati();
  if (typeof renderUtilCurent === "function") renderUtilCurent();
  if (typeof renderUtilGaz === "function") renderUtilGaz();

  // --- Refresh administration ---
  if (typeof renderAdminPlati === "function") renderAdminPlati();
  if (typeof renderAdminApa === "function") renderAdminApa();

  // --- Refresh daily supermarket & car ---
  if (typeof renderZilnicTable === "function") renderZilnicTable();

  if (currentPage === "zilnic") {
    if (typeof updateZilnicView === "function") updateZilnicView();
    if (typeof updateZilnicPie === "function") updateZilnicPie();

    if (typeof renderCarTables === "function") renderCarTables();
    if (typeof updateCarSummary === "function") updateCarSummary();
    if (typeof updateCarLastOdometru === "function") updateCarLastOdometru();
    if (typeof updateCarMedia === "function") updateCarMedia();
  }

  // --- Update averages ---
  if (typeof computeSupermarketAverage === "function") computeSupermarketAverage();
  if (typeof computeCarAverage === "function") computeCarAverage();

  // --- Charts ---
  if (typeof updateHomeCharts === "function") updateHomeCharts();

  // --- Persist changes ---
  saveDataLocal();

  console.log("All data updated (full sync).");
}

/* =================
 *     HELPERS
 * ================= */

/**
 * Returns the data object corresponding to the given type.
 * Used to abstract between monthly and annual datasets.
 
 * @param {string} type - Either "lunar" or "anual".
 
 * @returns {Object} Data object for the requested type.
 */
function getDataFor(type) { 
  return type === 'lunar' ? data_lunar : data_anual; 
}

/**
 * Returns the correct table element (tbody) for the given type.
 * Allows shared functions to target the right DOM structure.
 
 * @param {string} type - Either "lunar" or "anual".
 
 * @returns {HTMLElement} Reference to the corresponding table body.
 */
function getTableFor(type) { 
  return type === 'lunar'
    ? document.querySelector('#tableServiciiHome tbody')
    : document.querySelector('#tableServiciiAnual tbody');
}

/**
 * Returns the appropriate chart instance for the given type.
 * Used to update pie charts dynamically after data changes.
 
 * @param {string} type - Either "lunar" or "anual".
 
 * @returns {Object} Chart.js instance bound to the corresponding dataset.
 */
function getChartFor(type) { 
  return type === 'lunar' ? chartHomePie : chartAnual; 
}

/**
 * Computes total expenses for a given service type, converting all values to RON.
 * The function ignores inactive or categorized entries.
 
 * @param {string} type - The data category to process (e.g., "utilitati", "administratie").
 
 * @returns {Object} Object containing:
 * 		 - sums: subtotal per currency {RON, EUR, USD}
 * 		 - totalRON: total converted to RON
 */
function computeTotals(type) {
  // Retrieve the data set and currency exchange rates
  const data = getDataFor(type).servicii;
  const rates = getRates();

  // Initialize accumulators for each currency
  const sums = { RON: 0, EUR: 0, USD: 0 };

  // Iterate through all records
  data.forEach(entry => {
    // Skip if the entry has a category or is inactive
    if (entry.categorie || !entry.activ) return;

    // Parse cost safely as a float
    const cost = parseFloat(entry.cost) || 0;

    // Accumulate per currency
    switch (entry.moneda) {
      case 'EUR': sums.EUR += cost; break;
      case 'USD': sums.USD += cost; break;
      default:    sums.RON += cost; break;
    }
  });

  // Convert all values to RON using current rates
  const totalRON = sums.RON + sums.EUR * rates.EUR + sums.USD * rates.USD;

  return { sums, totalRON };
}

/**
 * Formats currency subtotals as a readable string (e.g. "RON 320 | EUR 50").
 
 * @param {Object} sums - Object with numeric values per currency {RON, EUR, USD}.
 
 * @returns {string} Human-readable string containing all non-zero currencies.
 */
function formatPerCurrencyString(sums) {
  return ['RON', 'EUR', 'USD']
    .filter(curr => sums[curr])                 // Include only currencies with non-zero values
    .map(curr => `${curr} ${fmt(sums[curr])}`)  // Format each
    .join('  |  ');                             // Separate visually
}


function setDefaultMonth(id){
  const ym = new Date().toISOString().slice(0,7);
  const el = document.getElementById(id);
  if (el) el.value = ym;
}

/* =========================
 * DAILY TABLE FUNCTIONALITY
 * ========================= */

/**
 * Adds a new service entry (monthly or annual) to the dataset.
 * Reads user input from corresponding fields, validates it,
 * and appends the new record to the appropriate data collection.
 
 * @param {string} type - Either "lunar" or "anual".
 */
function addItem(type) {
  // Select correct input elements depending on the context (monthly vs annual)
  const nameInput   = document.getElementById(type === 'lunar' ? 'newServiceName' : 'newServiceNameAnual');
  const costInput   = document.getElementById(type === 'lunar' ? 'newServiceCost' : 'newServiceCostAnual');
  const currencySel = document.getElementById(type === 'lunar' ? 'newServiceCurrency' : 'newServiceCurrencyAnual');

  const name   = nameInput.value.trim();
  const cost   = parseFloat(costInput.value);
  const currency = currencySel.value;

  // Simple validation
  if (!name || isNaN(cost)) {
    alert('Completează nume și cost');
    return;
  }

  // Append new service record
  getDataFor(type).servicii.push({
    nume: name,
    cost: cost,
    moneda: currency,
    activ: true,
    note: ''
  });

  // Refresh all dependent UI and summaries
  updateAll();
}

/**
 * Adds a new category entry (monthly or annual) to the dataset.
 * Used for grouping services under category headers in tables.
 
 * @param {string} type - Either "lunar" or "anual".
 */
function addCategory(type) {
  // Select correct input element
  const nameInput = document.getElementById(type === 'lunar' ? 'newCategoryName' : 'newCategoryNameAnual');
  const name = nameInput.value.trim();

  // Validate input
  if (!name) {
    alert('Completează numele!');
    return;
  }

  // Add new category record (only category flag and name are stored)
  getDataFor(type).servicii.push({
    categorie: true,
    nume: name
  });

  // Update the UI and all dependent calculations
  updateAll();
}


/**
 * Toggles the active/inactive state of a specific service entry.
 * Skips automatic or system-generated rows (e.g., utility averages or admin totals).
 
 * @param {string} type - Data category ("lunar", "anual", etc.).
 * @param {number} i - Index of the service in the array.
 */
function toggleService(type, i) {
  const arr = getDataFor(type).servicii;

  // Skip rows that are automatically calculated and should not be toggled
  if (arr[i].util_media || arr[i].util_admin) return;

  // Toggle active flag (true ↔ false)
  arr[i].activ = !arr[i].activ;

  // Re-render all dependent sections
  updateAll();
}

/**
 * Deletes a specific service or category entry by index.
 * Prevents deletion of automatically generated summary rows.
 
 * @param {string} type - Data category ("lunar", "anual", etc.).
 * @param {number} i - Index of the item to remove.
 */
function deleteItem(type, i) {
  const arr = getDataFor(type).servicii;

  // Block deletion for automatic summary lines
  if (
    arr[i].util_media ||
    arr[i].util_admin ||
    arr[i].util_media_supermarket ||
    arr[i].util_media_car
  ) {
    alert('Această linie este automată');
    return;
  }

  // Remove item at index `i`
  arr.splice(i, 1);

  // Refresh calculations and UI
  updateAll();
}


/**
 * Updates the table's text note
 * Saves the modified data to local storage immediately.
 
 * @param {string} type - Data category ("lunar", "anual", etc.).
 * @param {number} i - Index of the service in the array.
 * @param {string} v - New note text.
 */
function updateNote(type, i, v) { 
  getDataFor(type).servicii[i].note = v;
  saveDataLocal();
}


/**
 * Updates the cost value of a service entry if it is not an automatic line.
 * Automatically refreshes calculations and UI after modification.
 
 * @param {string} type - Data category ("lunar", "anual", etc.).
 * @param {number} i - Index of the service in the array.
 * @param {string|number} v - New cost value (string from input or numeric).
 */
function updateCost(type, i, v) { 
  const item = getDataFor(type).servicii[i];

  // Skip automatic summary or admin lines
  if (!item.util_media && !item.util_admin) {
    item.cost = parseFloat(v) || 0;
    updateAll();
  }
}


/**
 * Updates a cost field directly when edited inline (from table input).
 * Cleans up formatting (commas, symbols), parses to float,
 * and saves both locally and visually.
 
 * @param {string} type - Data category ("lunar", "anual", etc.).
 * @param {number} i - Index of the service in the array.
 * @param {string} val - Raw user input from inline edit.
 */
function updateCostInline(type, i, val) {
  // Clean input: allow only digits, dots, commas
  let cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
  let num = parseFloat(cleaned);

  // Fallback to 0 if input is invalid
  if (isNaN(num)) num = 0;

  // Store cost rounded to 2 decimals
  getDataFor(type).servicii[i].cost = parseFloat(num.toFixed(2));

  // Persist and refresh
  saveDataLocal();
  updateAll(); 
}


/**
 * Updates the currency of a specific service entry.
 * Skips automatic rows (e.g., utility averages or admin totals).
 * Triggers full recalculation and UI refresh after update.
 
 * @param {string} type - Data category ("lunar", "anual", etc.).
 * @param {number} i - Index of the service in the array.
 * @param {string} v - New currency value (e.g., "RON", "EUR", "USD").
 */
function updateMoneda(type, i, v) {
  const item = getDataFor(type).servicii[i];

  // Prevent updates on automatic/system rows
  if (!item.util_media && !item.util_admin) {
    item.moneda = v;
    updateAll();
  }
}


/**
 * Deletes a category entry by index.
 * Used for removing category headers from the list.
 * Automatically refreshes all computed data and UI elements.
 
 * @param {string} type - Data category ("lunar", "anual", etc.).
 * @param {number} i - Index of the category in the array.
 */
function deleteCategory(type, i) {
  getDataFor(type).servicii.splice(i, 1);
  updateAll();
}


/**
 * Renders the service table for either monthly or annual data.
 * Dynamically creates rows for both categories and service entries,
 * applies event bindings for inline editing, toggling, sorting, and deleting,
 * and updates the related chart afterward.
 
 * @param {string} type - Data type ("lunar" or "anual").
 */
function renderTable(type) {
  const tbody = getTableFor(type);
  if (!tbody) return;

  // Clear previous table content
  tbody.innerHTML = '';

  const arr = getDataFor(type).servicii;
  const rates = getRates();
  const totalRON = computeTotals(type).totalRON || 0;

  // --- BUILD ROWS ---
  arr.forEach((s, i) => {

    // === CATEGORY ROW ===
    if (s.categorie) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="8" style="font-weight:700;text-align:center;background:#f8f8f8;">
          ${s.nume} <span class="dragHandle">≡</span>
          <button class="deleteBtn" onclick="deleteCategory('${type}', ${i})">🗑️</button>
        </td>`;
      tbody.appendChild(tr);
      return;
    }

    // === SERVICE ROW ===
    const rowRON = (s.cost || 0) * (rates[s.moneda || 'RON'] || 1);
    const percent = !s.activ
      ? '0%'
      : totalRON
        ? ((rowRON / totalRON) * 100).toFixed(1) + '%'
        : '-';

    // Disable certain fields for automatically generated rows
    const disabled = (
      s.util_media ||
      s.util_admin ||
      s.util_media_supermarket ||
      s.util_media_car
    ) ? 'disabled' : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align:left">
        ${s.nume}
        ${(s.util_media || s.util_media_supermarket || s.util_media_car)
          ? '<span style="color:#6b7280">(auto)</span>' : ''}
        ${s.util_admin ? '<span style="color:#6b7280">(Admin)</span>' : ''}
      </td>

      <td contenteditable="true"
          onkeydown="if(event.key==='Enter'){ event.preventDefault(); this.blur(); }"
          onblur="updateCostInline('${type}', ${i}, this.innerText)">
        ${s.cost || 0}
      </td>

      <td>
        <select ${disabled} onchange="updateMoneda('${type}', ${i}, this.value)">
          <option ${s.moneda === 'RON' ? 'selected' : ''}>RON</option>
          <option ${s.moneda === 'EUR' ? 'selected' : ''}>EUR</option>
          <option ${s.moneda === 'USD' ? 'selected' : ''}>USD</option>
        </select>
      </td>

      <td>${percent}</td>

      <td>
        <textarea class="noteInput" ${disabled}
          onchange="updateNote('${type}', ${i}, this.value)">
          ${s.note || ''}
        </textarea>
      </td>

      <td>
        <button class="switchBtn ${s.activ ? 'active' : 'inactive'}"
          ${disabled}
          onclick="toggleService('${type}', ${i})">
          ${s.activ ? 'On' : 'Off'}
        </button>
      </td>

      <td class="dragHandle">≡</td>
      <td><button class="deleteBtn" onclick="deleteItem('${type}', ${i})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });

  // --- ENABLE DRAG-AND-DROP REORDERING ---
  if (type === 'lunar') {
    sortableHome && sortableHome.destroy();
    sortableHome = new Sortable(tbody, {
      handle: '.dragHandle',
      animation: 150,
      onEnd: e => {
        const arr = data_lunar.servicii;
        arr.splice(e.newIndex, 0, arr.splice(e.oldIndex, 1)[0]);
        saveDataLocal();
        renderTable('lunar');
        updateTotalsUI();
      }
    });
  } else {
    if (!sortableAnual) {
      sortableAnual = new Sortable(tbody, {
        handle: '.dragHandle',
        animation: 150,
        onEnd: e => {
          const arr = data_anual.servicii;
          arr.splice(e.newIndex, 0, arr.splice(e.oldIndex, 1)[0]);
          updateAll();
        }
      });
    }
  }

  // --- UPDATE CHART DATA ---
  const chart = getChartFor(type);
  if (chart) {
    const labels = arr.filter(s => !s.categorie).map(s => s.nume);
    const values = arr
      .filter(s => !s.categorie)
      .map(s => s.activ ? (s.cost || 0) * (rates[s.moneda || 'RON'] || 1) : 0);

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    // Assign random colors for pie chart visualization
    if (chart.config.type === 'pie') {
      chart.data.datasets[0].backgroundColor = labels.map(() => getRandomColor());
    }

    chart.update();
  }

  // --- SAVE CHANGES LOCALLY ---
  saveDataLocal();
}


/* ===============================
 * BNR FX AUTO-UPDATE - AUTO-RATES
 * ===============================*/

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


/* ======================
 * GET NEEDED CARD VALUES
 * ====================== */


// === TOTALS ===

/**
 * Updates the UI elements displaying totals and summaries
 * for both monthly ("lunar") and annual ("anual") sections.
 * Recomputes sums in all currencies, formats them,
 * and updates related cards or summary fields in the interface.
 */
function updateTotalsUI() {
  // Compute fresh totals for both data sets
  const tL = computeTotals('lunar');
  const tA = computeTotals('anual');

  // --- MONTHLY (LUNAR) DISPLAY ---
  const elL = document.getElementById('totalsPerCurrencyLunar');
  if (elL) elL.innerText = formatPerCurrencyString(tL.sums);

  // --- ANNUAL (ANUAL) DISPLAY ---
  const totalAnualHome = document.getElementById('totalAnualHome');
  if (totalAnualHome)
    totalAnualHome.innerText = `RON ${fmt(tA.totalRON)}`;

  // --- COMBINED MONTHLY OBLIGATIONS (annual / 12 + monthly) ---
  const oblig = (tL.totalRON || 0) + (tA.totalRON || 0) / 12;
  const obligEl = document.getElementById('obligatiiLunare');
  if (obligEl)
    obligEl.innerText = `RON ${fmt(oblig)}`;

  loadLanguage(currentLang);
}


// === UTILITIES ===

/**
 * Computes the average utilities payment in RON.
 * Converts all utility payments (gas, electricity, etc.) to RON using current FX rates,
 * then returns the arithmetic mean of all payments.
 * @returns {number} Average value in RON (0 if no payments exist).
 */
function computeUtilitatiMediaRON() {
  const rates = getRates();

  // Return 0 if no utility payments exist
  if (!data_utilitati.plati.length) return 0;

  // Sum all payments converted to RON
  const total = data_utilitati.plati.reduce(
    (sum, payment) => sum + (payment.suma || 0) * (rates[payment.moneda] || 1),
    0
  );

  // Return average value
  return total / data_utilitati.plati.length;
}


function insertOrUpdateAutoRow({ flag, labelRO, labelEN, cost }) {
  const arr = data_lunar.servicii;
  const idx = arr.findIndex(s => s[flag] === true);

  const label = currentLang === "en" ? labelEN : labelRO;

  if (idx === -1) {
    // Category insert positions
    let pos = arr.findIndex(s => s.categorie && s.nume.toLowerCase().includes('utilitati'));

    if (flag === 'util_media_supermarket') 
      pos = arr.findIndex(s => s.categorie && s.nume.toLowerCase().includes('supermarket'));

    if (flag === 'util_media_car') 
      pos = arr.findIndex(s => s.categorie && s.nume.toLowerCase().includes('auto'));

    if (flag === 'util_admin')
      pos = arr.findIndex(s => s.categorie && s.nume.toLowerCase().includes('utilitati'));

    if (pos === -1) pos = arr.length;

    arr.splice(pos + 1, 0, {
      nume: label,
      cost: cost,
      moneda: 'RON',
      activ: true,
      [flag]: true
    });
  } else {
    arr[idx].nume = label;
    arr[idx].cost = cost;
    arr[idx].moneda = 'RON';
    arr[idx].activ = true;
  }
}


function syncAllToLunar() {
  const rates = getRates();

  // UTILITATI
  const utilMedia = computeUtilitatiMediaRON();
  insertOrUpdateAutoRow({
    flag: 'util_media',
    labelRO: 'Media Utilități',
    labelEN: 'Utilities Average',
    cost: utilMedia
  });

  // ADMINISTRATIE (cea mai recenta plata)
  const adminSorted = [...data_administratie.plati].sort((a,b)=>a.luna.localeCompare(b.luna));
  const lastAdmin = adminSorted[adminSorted.length-1];
  const adminRON = lastAdmin ? (lastAdmin.suma || 0) * (rates[lastAdmin.moneda] || 1) : 0;

  insertOrUpdateAutoRow({
    flag: 'util_admin',
    labelRO: 'Administrație',
    labelEN: 'Administration',
    cost: adminRON
  });

	// === SUPERMARKET ===
	let smMedia = 0;
	const smMonths = {};

	data_zilnic.tranzactii
	  .filter(t => t.tip === 'supermarket')
	  .forEach(t => {
		const luna = t.luna;
		const val = (t.suma || 0) * (rates[t.moneda] || 1);

		if (!smMonths[luna]) smMonths[luna] = 0;
		smMonths[luna] += val;
	  });

	const smVals = Object.values(smMonths);
	if (smVals.length) smMedia = smVals.reduce((a, b) => a + b, 0) / smVals.length;

	insertOrUpdateAutoRow({
	  flag: 'util_media_supermarket',
	  labelRO: 'Media Supermarket',
	  labelEN: 'Supermarket Average',
	  cost: smMedia
	});


	// === CAR ===
	let carMedia = 0;
	const carMonths = {};

	data_car.tranzactii
	  .filter(t => t.tip === 'car')
	  .forEach(t => {
		const luna = t.luna || (t.data ? t.data.slice(0, 7) : '');
		if (!luna) return;

		const val = (t.suma || t.cost_total || 0) * (rates[t.moneda] || 1);

		if (!carMonths[luna]) carMonths[luna] = 0;
		carMonths[luna] += val;
	  });

	const carVals = Object.values(carMonths);
	if (carVals.length) carMedia = carVals.reduce((a, b) => a + b, 0) / carVals.length;

	insertOrUpdateAutoRow({
	  flag: 'util_media_car',
	  labelRO: 'Media Car',
	  labelEN: 'Car Average',
	  cost: carMedia
	});

}


/* ==============================================
 * UTILITIES PAGE — TABLE RENDERING & CHART LOGIC
 * ============================================== */


/**
 * Renders the utilities payments table and corresponding chart.
 * Displays each recorded payment (month, amount, currency) and
 * dynamically updates the computed average and visualization.
 */
function renderUtilPlati() {
  const tbody = document.querySelector('#tableUtilPlati tbody');
  if (!tbody) return;

  // Clear previous rows
  tbody.innerHTML = '';

  // Sort utility payments by month
  const items = [...data_utilitati.plati].sort((a, b) => a.luna.localeCompare(b.luna));

  // Build table rows
  items.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.luna}</td>
      <td>${fmt(p.suma)}</td>
      <td>${p.moneda}</td>
      <td>
        <button class="deleteBtn" onclick="deleteUtilPlata('${p.luna}', ${p.suma}, '${p.moneda}')">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });

  // --- Update average value display ---
  const media = computeUtilitatiMediaRON();
  const mEl = document.getElementById('utilitatiMediaRON');
  if (mEl) mEl.innerText = `RON ${fmt(media)}`;

  // --- Update chart data ---
  const rates = getRates();
  const labels = items.map(p => p.luna);
  const values = items.map(p => (p.suma || 0) * (rates[p.moneda] || 1));

  if (chartUtilPlati) {
    chartUtilPlati.data.labels = labels;
    chartUtilPlati.data.datasets[0].data = values;
    chartUtilPlati.update();
  }

  // Save all data changes locally
  saveDataLocal();
}


/**
 * Adds a new utility payment to the dataset.
 * Reads values from input fields, validates data, then updates
 * the utilities list, chart, and linked "Lunar" average automatically.
 */
function addUtilPlata() {
  const luna = document.getElementById('utilPlataLuna').value;
  const suma = parseFloat(document.getElementById('utilPlataSuma').value);
  const moneda = document.getElementById('utilPlataMoneda').value;

  // Validation
  if (!luna || isNaN(suma)) {
    alert('Completează luna și suma');
    return;
  }

  // Add new payment record
  data_utilitati.plati.push({ luna, suma, moneda });

  // Update the linked "Lunar" table and UI
  updateAll();
}


/**
 * Deletes a specific utility payment based on its unique combination
 * of month, amount, and currency. Updates related averages and UI.
 
 * @param {string} luna - Month of the payment.
 * @param {number} suma - Amount paid.
 * @param {string} moneda - Currency of the payment.
 */
function deleteUtilPlata(luna, suma, moneda) {
  const i = data_utilitati.plati.findIndex(
    p => p.luna === luna && Number(p.suma) === Number(suma) && p.moneda === moneda
  );

  if (i > -1) data_utilitati.plati.splice(i, 1);

  // Resync automatic average and refresh
  updateAll();
}


// === ELECTRICITY READINGS ===

/**
 * Renders the electricity readings table and updates the corresponding chart.
 * Calculates the monthly consumption difference between consecutive readings,
 * ensuring negative values (from rollovers or errors) are treated as zero.
 * Also refreshes chart data and saves changes locally.
 */
function renderUtilCurent() {
  const tb = document.querySelector('#tableUtilCurent tbody');
  if (!tb) return;

  // Clear table
  tb.innerHTML = '';

  // Sort readings by month
  const items = [...data_utilitati.citiri_curent].sort((a, b) => a.luna.localeCompare(b.luna));
  let prev = null, labels = [], diffs = [];

  // Build table rows and compute monthly differences
  items.forEach(c => {
    const rawDiff = prev ? (c.valoare - prev.valoare) : 0;
    const diff = rawDiff < 0 ? 0 : rawDiff; // prevent negative differences
    diffs.push(diff);
    labels.push(c.luna);

    tb.innerHTML += `
      <tr>
        <td>${c.luna}</td>
        <td>${fmt(c.valoare)}</td>
        <td>${fmt(diff)}</td>
        <td>
          <button class="deleteBtn" onclick="deleteUtilCurent('${c.luna}', ${c.valoare})">🗑️</button>
        </td>
      </tr>`;
    prev = c;
  });

  // --- Update chart ---
  if (chartUtilCurent) {
    chartUtilCurent.data.labels = labels;
    chartUtilCurent.data.datasets[0].data = diffs;
    chartUtilCurent.update();
  }

  // Save all data locally
  saveDataLocal();
}


/**
 * Adds or updates an electricity reading.
 * If the month already exists, replaces the value;
 * otherwise, appends a new record and refreshes the table.
 */
function addUtilCurent() {
  const luna = document.getElementById('utilCurentLuna').value;
  const val = parseFloat(document.getElementById('utilCurentValoare').value);

  // Basic validation
  if (!luna || isNaN(val)) {
    alert('Completează luna și valoarea');
    return;
  }

  // Check for existing month entry and update or insert
  const idx = data_utilitati.citiri_curent.findIndex(x => x.luna === luna);
  if (idx > -1) data_utilitati.citiri_curent[idx].valoare = val;
  else data_utilitati.citiri_curent.push({ luna, valoare: val });

  renderUtilCurent();
}


/**
 * Deletes a specific electricity reading identified by month and value.
 * Refreshes the table and chart after removal.
 
 * @param {string} luna - The month of the reading.
 * @param {number} val - The numeric value of the reading.
 */
function deleteUtilCurent(luna, val) {
  const i = data_utilitati.citiri_curent.findIndex(c => c.luna === luna && c.valoare === val);
  if (i > -1) data_utilitati.citiri_curent.splice(i, 1);
  renderUtilCurent();
}


// === GAS READINGS ===

/**
 * Renders the gas meter readings table and updates its corresponding chart.
 * Calculates monthly gas consumption differences, preventing negative values.
 * Also refreshes visualization and saves all data locally.
 */
function renderUtilGaz() {
  const tb = document.querySelector('#tableUtilGaz tbody');
  if (!tb) return;

  // Clear current table content
  tb.innerHTML = '';

  // Sort readings chronologically by month
  const items = [...data_utilitati.citiri_gaz].sort((a, b) => a.luna.localeCompare(b.luna));
  let prev = null, labels = [], diffs = [];

  // Build table rows and compute monthly differences
  items.forEach(c => {
    const rawDiff = prev ? (c.valoare - prev.valoare) : 0;
    const diff = rawDiff < 0 ? 0 : rawDiff; // Prevent negative deltas
    diffs.push(diff);
    labels.push(c.luna);

    tb.innerHTML += `
      <tr>
        <td>${c.luna}</td>
        <td>${fmt(c.valoare)}</td>
        <td>${fmt(diff)}</td>
        <td>
          <button class="deleteBtn" onclick="deleteUtilGaz('${c.luna}', ${c.valoare})">🗑️</button>
        </td>
      </tr>`;
    prev = c;
  });

  // --- Update chart data ---
  if (chartUtilGaz) {
    chartUtilGaz.data.labels = labels;
    chartUtilGaz.data.datasets[0].data = diffs;
    chartUtilGaz.update();
  }

  // Persist updated data
  saveDataLocal();
}


/**
 * Adds or updates a gas meter reading for a specific month.
 * If the month already exists, the value is replaced; otherwise, a new record is appended.
 * Refreshes the table and chart immediately after update.
 */
function addUtilGaz() {
  const luna = document.getElementById('utilGazLuna').value;
  const val = parseFloat(document.getElementById('utilGazValoare').value);

  // Basic validation
  if (!luna || isNaN(val)) {
    alert('Completează luna și valoarea');
    return;
  }

  // Find existing month entry or insert new one
  const idx = data_utilitati.citiri_gaz.findIndex(x => x.luna === luna);
  if (idx > -1) data_utilitati.citiri_gaz[idx].valoare = val;
  else data_utilitati.citiri_gaz.push({ luna, valoare: val });

  renderUtilGaz();
}


/**
 * Deletes a gas reading by month and value, then refreshes the table and chart.
 
 * @param {string} luna - The month of the reading.
 * @param {number} val - The recorded meter value.
 */
function deleteUtilGaz(luna, val) {
  const i = data_utilitati.citiri_gaz.findIndex(c => c.luna === luna && c.valoare === val);
  if (i > -1) data_utilitati.citiri_gaz.splice(i, 1);
  renderUtilGaz();
}


/* ======================================
 * ADMINISTRATION PAGE — TABLES & CHART
 * ====================================== */

/**
 * Renders the administration payments table and updates its chart.
 * Displays each payment with its month, amount, and currency,
 * converts values to RON for visualization, and saves data locally.
 */
function renderAdminPlati() {
  const tbody = document.querySelector('#tableAdminPlati tbody');
  if (!tbody) return;

  // Clear existing table rows
  tbody.innerHTML = '';

  const rates = getRates();

  // Sort all administration payments by month
  const items = [...data_administratie.plati].sort((a, b) => a.luna.localeCompare(b.luna));

  // Build table rows
  items.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.luna}</td>
      <td>${fmt(p.suma)}</td>
      <td>${p.moneda}</td>
      <td>
        <button class="deleteBtn" onclick="deleteAdminPlata('${p.luna}', ${p.suma}, '${p.moneda}')">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });

  // --- Update chart in RON ---
  if (chartAdminPlati) {
    chartAdminPlati.data.labels = items.map(p => p.luna);
    chartAdminPlati.data.datasets[0].data = items.map(
      p => (p.suma || 0) * (rates[p.moneda] || 1)
    );
    chartAdminPlati.update();
  }

  // Save updated data locally
  saveDataLocal();
}


/**
 * Adds a new administration payment record.
 * Reads input values from the form, validates them,
 * appends the new record to the dataset, synchronizes
 * the "Lunar" page with the latest data, and refreshes the UI.
 */
function addAdminPlata() {
  const luna = document.getElementById('adminPlataLuna')?.value;
  const suma = parseFloat(document.getElementById('adminPlataSuma')?.value);
  const moneda = document.getElementById('adminPlataMoneda')?.value;

  // Validate input
  if (!luna || isNaN(suma)) {
    alert('Completează luna și suma');
    return;
  }

  // Add new payment entry
  data_administratie.plati.push({ luna, suma, moneda });

  // Sync with "Lunar" and update UI
  updateAll();
}


/**
 * Updates the invoice cost for a specific month in the water readings section.
 * Parses and sanitizes the new value, saves changes, and re-renders the table.
 
 * @param {string} luna - The month identifier.
 * @param {string} val - The new value from user input.
 */
function updateAdminCostFactura(luna, val) {
  const valNum = parseFloat(val.replace(',', '.')) || 0;
  const item = data_administratie.apa.find(r => r.luna === luna);

  if (item) item.cost_factura = valNum;

  saveDataLocal();
  renderAdminApa();
}


/**
 * Adds or updates water meter readings (Contor 1 and Contor 2)
 * for a specific month. Ensures both fields are valid numbers.
 * Initializes "cost_factura" with 0 when a new record is created.
 */
function addAdminApa() {
  const luna = document.getElementById('adminApaLuna').value;
  const c1 = parseFloat(document.getElementById('adminApaContor1').value);
  const c2 = parseFloat(document.getElementById('adminApaContor2').value);

  // Validate input
  if (!luna || isNaN(c1) || isNaN(c2)) {
    alert('Completează luna și contoarele');
    return;
  }

  // Check if entry for this month already exists
  const existingIndex = data_administratie.apa.findIndex(x => x.luna === luna);

  if (existingIndex > -1) {
    // Update existing entry
    data_administratie.apa[existingIndex].contor1 = c1;
    data_administratie.apa[existingIndex].contor2 = c2;
  } else {
    // Add new entry
    data_administratie.apa.push({
      luna,
      contor1: c1,
      contor2: c2,
      cost_factura: 0
    });
  }

  // Refresh table and persist data
  renderAdminApa();
  saveDataLocal();
}


/**
 * Deletes an administration payment by matching month, amount, and currency.
 * After deletion, updates the monthly synchronization and recalculates totals.
 
 * @param {string} luna - The payment month.
 * @param {number} suma - The payment amount.
 * @param {string} moneda - The payment currency.
 */
function deleteAdminPlata(luna, suma, moneda) {
  const i = data_administratie.plati.findIndex(
    p => p.luna === luna && Number(p.suma) === Number(suma) && p.moneda === moneda
  );

  if (i > -1) data_administratie.plati.splice(i, 1);

  updateAll();
}


// === ADMIN: WATER ===

/**
 * Renders the administration water readings table and updates the water consumption chart.
 * Calculates consumption differences between consecutive readings for two meters,
 * computes total usage and estimated cost, and allows inline editing of invoice values.
 */
function renderAdminApa() {
  const tbody = document.querySelector('#tableAdminApa tbody');
  if (!tbody) return;

  // Clear table content
  tbody.innerHTML = '';

  // Sort readings chronologically by month
  const items = [...data_administratie.apa].sort((a, b) => a.luna.localeCompare(b.luna));

  let prev = null;
  let labels = [], consumuri = [];

  // Build rows dynamically
  items.forEach(row => {
    // Compute consumption differences for both meters
    const d1 = prev ? (row.contor1 - prev.contor1) : 0;
    const d2 = prev ? (row.contor2 - prev.contor2) : 0;

    // Prevent negative values
    const dif1 = d1 < 0 ? 0 : d1;
    const dif2 = d2 < 0 ? 0 : d2;

    // Compute totals
    const total = dif1 + dif2;
    const costCalc = total * (data_administratie.cost_pe_mc || 0);

    // Build HTML row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.luna}</td>
      <td>${fmt(row.contor1)}</td>
      <td>${fmt(dif1)}</td>
      <td>${fmt(row.contor2)}</td>
      <td>${fmt(dif2)}</td>
      <td>${fmt(total)}</td>
      <td>RON ${fmt(costCalc)}</td>
      <td contenteditable="true"
          onblur="updateAdminCostFactura('${row.luna}', this.innerText)">
        ${fmt(row.cost_factura || 0)}
      </td>
      <td>
        <button class="deleteBtn"
                onclick="deleteAdminApa('${row.luna}', ${row.contor1}, ${row.contor2}, ${row.cost_factura || 0})">
          🗑️
        </button>
      </td>
    `;

    tbody.appendChild(tr);

    // Track values for chart
    labels.push(row.luna);
    consumuri.push(total);

    prev = row;
  });

  // --- Update chart ---
  if (chartAdminApa) {
    chartAdminApa.data.labels = labels;
    chartAdminApa.data.datasets[0].data = consumuri;
    chartAdminApa.update();
  }

  // Persist latest data state
  saveDataLocal();
}


/* ===============================================
 * ZILNIC PAGE — SUPERMARKET, CAR, Travels & WANTS
 * =============================================== */


/**
 * Updates the daily ("Zilnic") supermarket summary view.
 * Aggregates transactions by month and supermarket,
 * computes the monthly and overall averages, updates the
 * summary card and chart, and renders a readable breakdown.
 */
function updateZilnicView() {
  const rates = getRates();

  // --- Aggregate transactions by month and supermarket ---
  let byMonth = {};

  data_zilnic.tranzactii
    .filter(t => t.tip === 'supermarket') 
    .forEach(t => {
      const key = t.luna;
      if (!byMonth[key]) byMonth[key] = { total: 0, breakdown: {} };
      byMonth[key].total += t.suma * (rates[t.moneda] || 1);

      if (!byMonth[key].breakdown[t.supermarket]) 
        byMonth[key].breakdown[t.supermarket] = 0;

      byMonth[key].breakdown[t.supermarket] += t.suma * (rates[t.moneda] || 1);
    });

  const luni = Object.keys(byMonth).sort();

  // --- Compute average spending ---
  let mediaGenerala = 0;
  if (luni.length) {
    const totaluri = luni.map(l => byMonth[l].total);
    mediaGenerala = totaluri.reduce((a, b) => a + b, 0) / luni.length;
  }

  // --- Update average display ---
  const m = document.getElementById('zilnicMediaRON');
  if (m) m.innerText = `RON ${fmt(mediaGenerala)}`;

  // --- Update chart ---
  const labels = luni;
  const valori = luni.map(l => byMonth[l].total);

  if (chartZilnic) {
    chartZilnic.data.labels = labels;
    chartZilnic.data.datasets[0].data = valori;
    chartZilnic.update();
  }

  // --- Build textual monthly summary ---
  let rez = '';
  luni.forEach((l, idx) => {
    rez += `
      ${idx > 0 ? '<hr style="border:0; border-top:1px solid #e5e5e5; margin:10px 0;">' : ''}

      <div style="margin:6px 0; font-size:15px; line-height:1.45;">
        <b style="color:#222">${formatLunaAn(l)}</b>:
        <span style="font-weight:700; color:#146c43">${fmt(byMonth[l].total)} lei</span>
        <br>
        <span style="opacity:0.8; color:#555">
          ${Object.entries(byMonth[l].breakdown)
            .map(([nume, suma]) => 
              `<span style="color:#555">${nume}: <span style="color:#6a7d65">${fmt(suma)} lei</span></span>`
            )
            .join(' &nbsp;•&nbsp; ')}
        </span>
      </div>
    `;
  });

  // --- Render summary to UI ---
  const s = document.getElementById('zilnicSummary');
  if (s) s.innerHTML = rez || 'Sumar';
}


/**
 * Updates the supermarket spending distribution pie charts for the "Zilnic" page.
 * Generates two charts:
 *  1. Latest month distribution (per supermarket)
 *  2. Overall all-time distribution
 * Uses exchange rates to convert values to RON and updates chart data dynamically.
 */
function updateZilnicPie() {
  const rates = getRates();

  const byMonth = {};  // { '2025-10': { Lidl: 320, Kaufland: 200, ... } }
  const totalAll = {}; // overall totals per supermarket

  // --- Aggregate supermarket transactions ---
  data_zilnic.tranzactii
    .filter(t => t.tip === 'supermarket') // only supermarket category
    .forEach(t => {
      const key = t.luna;
      const val = (t.suma || 0) * (rates[t.moneda] || 1);
      const sm = t.supermarket || 'Altele';

      // Monthly totals
      if (!byMonth[key]) byMonth[key] = {};
      if (!byMonth[key][sm]) byMonth[key][sm] = 0;
      byMonth[key][sm] += val;

      // Global totals
      if (!totalAll[sm]) totalAll[sm] = 0;
      totalAll[sm] += val;
    });

  const luniSortate = Object.keys(byMonth).sort();

  // --- Handle empty dataset ---
  if (!luniSortate.length) {
    const t = document.getElementById('zilnicPieMonthTitle');
    if (t) t.innerText = 'Latest month distribution';

    // Reset both charts
    if (chartZilnicPieMonth) {
      chartZilnicPieMonth.data.labels = [];
      chartZilnicPieMonth.data.datasets[0].data = [];
      chartZilnicPieMonth.update();
    }
    if (chartZilnicPieAll) {
      chartZilnicPieAll.data.labels = [];
      chartZilnicPieAll.data.datasets[0].data = [];
      chartZilnicPieAll.update();
    }
    return;
  }

  // --- Prepare latest month data ---
  const l = luniSortate[luniSortate.length - 1];
  const lunaFrumoasa = formatLunaAn(l);

  const titleEl = document.getElementById('zilnicPieMonthTitle');
  if (titleEl) titleEl.innerText = lunaFrumoasa;

  const dataMonth = byMonth[l] || {};
  const labelsM = Object.keys(dataMonth);
  const valuesM = labelsM.map(sm => dataMonth[sm]);

  // --- Latest month pie chart ---
  const ctxMonth = document.getElementById('zilnicPieByMonth');
  if (ctxMonth) {
    if (!chartZilnicPieMonth) {
      chartZilnicPieMonth = new Chart(ctxMonth, {
        type: 'pie',
        data: { labels: labelsM, datasets: [{ data: valuesM }] },
        options: { plugins: { legend: { position: 'bottom' } } }
      });
    } else {
      chartZilnicPieMonth.data.labels = labelsM;
      chartZilnicPieMonth.data.datasets[0].data = valuesM;
      chartZilnicPieMonth.update();
    }
  }

  // --- All-time totals ---
  const labelsA = Object.keys(totalAll);
  const valuesA = labelsA.map(sm => totalAll[sm]);

  // --- All-time pie chart ---
  const ctxAll = document.getElementById('zilnicPieAllTime');
  if (ctxAll) {
    if (!chartZilnicPieAll) {
      chartZilnicPieAll = new Chart(ctxAll, {
        type: 'pie',
        data: { labels: labelsA, datasets: [{ data: valuesA }] },
        options: { plugins: { legend: { position: 'bottom' } } }
      });
    } else {
      chartZilnicPieAll.data.labels = labelsA;
      chartZilnicPieAll.data.datasets[0].data = valuesA;
      chartZilnicPieAll.update();
    }
  }
}


/* ================================================
 * ZILNIC PAGE — TAB SWITCHING LOGIC
 * ================================================ */

/**
 * Handles switching between "Zilnic" sub-tabs (Supermarket, Car, Bars&Trips, Wants).
 * Updates tab button styles, controls section visibility, and rebinds Car-related inputs.
 * The selected tab is stored in localStorage for persistence between reloads.
 * @param {string} tab - The selected tab key ("supermarket", "car", "BarsTrips", "Wants").
 * @param {Event} [event] - Optional click event for activating the correct button.
 */
function switchZilnicTab(tab, event) {
  // --- Persist selected tab ---
  localStorage.setItem("zilnicTab", tab);

  // --- Deactivate all tab buttons ---
  document.querySelectorAll(".zilnic-tab").forEach(btn => btn.classList.remove("active"));
  if (event?.target) event.target.classList.add("active");

  // --- Hide all main tab sections ---
  document.getElementById("pageSupermarket").style.display = "none";
  document.getElementById("pageCar").style.display = "none";
  document.getElementById("pageBarsTrips").style.display = "none";
  document.getElementById("pageWants").style.display = "none";

  // --- Common UI references ---
  const supForm   = document.querySelector('#zilnicSupermarket')?.closest('.formRow');
  const supCard   = document.getElementById('zilnicMediaRON')?.parentElement?.parentElement;
  const content   = document.getElementById("zilnicContent");
  const chart     = document.getElementById("chartZilnic");
  const summary   = document.getElementById("zilnicVizual");
  const pieCharts = document.querySelector(".zilnic-charts");

  const carForm   = document.getElementById('carForm');
  const carSwitch = document.getElementById('carSwitch');
  const carTables = document.getElementById('carTablesContainer');

  // --- SUPERMARKET TAB ---
  if (tab === 'supermarket') {
    pageSupermarket.style.display = 'block';
    pageCar.style.display         = 'none';
    pageBarsTrips.style.display   = 'none';
    pageWants.style.display       = 'none';

    // Show supermarket components
    if (content)   content.style.display   = "block";
    if (chart)     chart.style.display     = "block";
    if (summary)   summary.style.display   = "block";
    if (pieCharts) pieCharts.style.display = "flex";
    if (supCard)   supCard.style.display   = "block";
    if (supForm)   supForm.style.display   = "flex";

    // Hide car components
    if (carForm)   carForm.style.display   = "none";
    if (carSwitch) carSwitch.style.display = "none";
    if (carTables) carTables.style.display = "none";

    // Update visuals
    updateZilnicView?.();
    updateZilnicPie?.();
    return;
  }

  // --- CAR TAB ---
  if (tab === 'car') {
    pageSupermarket.style.display = 'none';
    pageCar.style.display         = 'block';
    pageBarsTrips.style.display   = 'none';
    pageWants.style.display       = 'none';

    // Hide supermarket UI
    if (content)   content.style.display   = "none";
    if (chart)     chart.style.display     = "none";
    if (summary)   summary.style.display   = "none";
    if (pieCharts) pieCharts.style.display = "none";
    if (supCard)   supCard.style.display   = "none";
    if (supForm)   supForm.style.display   = "none";

    // Show car UI
    if (carForm)   carForm.style.display   = "flex";
    if (carSwitch) carSwitch.style.display = "flex";
    if (carTables) carTables.style.display = "block";

    // Render car data and summaries
    renderCarTables();
    updateCarTotals();
    updateCarSummary();
    updateCarLastOdometru();

    // Bind change event for car fuel/service selector
    const carTip = document.getElementById('carTip');
    if (carTip) {
      carTip.onchange = () => {
        const isFuel = carTip.value === 'benzina';
        document.getElementById('carFuelFields').style.display = isFuel ? 'flex' : 'none';
        document.getElementById('carAltFields').style.display  = isFuel ? 'none' : 'flex';
        switchCarTable(isFuel ? 'fuel' : 'alt');
      };

      const isFuel = carTip.value === 'benzina';
      switchCarTable(isFuel ? 'fuel' : 'alt');
    }
    return;
  }

  // --- BARS & TRIPS TAB ---
  if (tab === 'BarsTrips') {
    pageSupermarket.style.display = 'none';
    pageCar.style.display         = 'none';
    pageBarsTrips.style.display   = 'block';
    pageWants.style.display       = 'none';
    return;
  }

  // --- WANTS TAB ---
  if (tab === 'Wants') {
    pageSupermarket.style.display = 'none';
    pageCar.style.display         = 'none';
    pageBarsTrips.style.display   = 'none';
    pageWants.style.display       = 'block';
    return;
  }
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
 * Deletes a water reading record from the Administration module.
 * Matches the entry by month, both meter readings, and invoice cost.
 * After deletion, refreshes the water readings table and chart.
 
 * @param {string} luna - The reading month.
 * @param {number} c1 - First meter value.
 * @param {number} c2 - Second meter value.
 * @param {number} cf - Invoice cost.
 */
function deleteAdminApa(luna, c1, c2, cf) {
  const i = data_administratie.apa.findIndex(
    r =>
      r.luna === luna &&
      r.contor1 === c1 &&
      r.contor2 === c2 &&
      Number(r.cost_factura || 0) === Number(cf || 0)
  );

  if (i > -1) data_administratie.apa.splice(i, 1);

  renderAdminApa();
}


/* ================================================
 * ZILNIC PAGE — SUPERMARKET TRANSACTIONS TABLE
 * ================================================ */

/**
 * Renders the daily ("Zilnic") supermarket transactions table.
 * Displays all transactions grouped by year, sorted by month,
 * and allows inline editing of amounts and deletion of entries.
 */
function renderZilnicTable() {
  const tbody = document.querySelector('#zilnicTable tbody');
  if (!tbody) return;

  // Clear table before rendering
  tbody.innerHTML = '';

  // Filter only supermarket transactions and sort by month
  const sorted = [...data_zilnic.tranzactii]
    .filter(t => t.tip === 'supermarket')
    .sort((a, b) => a.luna.localeCompare(b.luna));

  let lastYear = null;

  // Build table rows grouped by year
  sorted.forEach((t, i) => {
    const [year, month] = t.luna.split('-');

    // Add year separator row when the year changes
    if (year !== lastYear) {
      const sep = document.createElement('tr');
      sep.innerHTML = `
        <td colspan="4"
            style="background:#f0f3f1; color:#333; font-weight:700;
                   text-align:center; border-top:2px solid #cfd6cf;">
          ${year}
        </td>`;
      tbody.appendChild(sep);
      lastYear = year;
    }

    // Create transaction row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatLunaAn(t.luna)}</td>
      <td>${t.supermarket}</td>
      <td contenteditable="true"
          onblur="updateZilnicSuma(${i}, this.innerText)">
        ${fmt(t.suma)}
      </td>
      <td>
        <button class="deleteBtn" onclick="deleteZilnicTranzactie(${t._id})">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}


/**
 * Adds a new supermarket transaction to the daily ("Zilnic") dataset.
 * Reads input values from the form, validates them, then pushes
 * a new record into the transactions array and refreshes all visuals.
 */
function addZilnicTranzactie() {
  const luna = document.getElementById('zilnicLuna').value;
  const supermarket = document.getElementById('zilnicSupermarket').value;
  const suma = parseFloat(document.getElementById('zilnicSuma').value);

  // Validate input fields
  if (!luna || isNaN(suma)) {
    alert('Completează luna și suma');
    return;
  }

  // Append new transaction
  data_zilnic.tranzactii.push({
    _id: Date.now(),   // ← nou
    tip: 'supermarket',
    luna,
    supermarket,
    suma
  });

  // Refresh UI and dependent components
  updateAll();
}


/**
 * Updates the amount ("suma") of a specific transaction when edited inline.
 * Sanitizes user input, updates the dataset, and re-renders dependent views.
 
 * @param {number} index - Index of the transaction in the array.
 * @param {string} newVal - New amount value from the editable cell.
 */
 
 
function updateZilnicSuma(index, newVal) {
  const cleaned = parseFloat(newVal.replace(',', '.'));
  if (!isNaN(cleaned)) {
    data_zilnic.tranzactii[index].suma = cleaned;
    updateAll();
  }
}


/**
 * Deletes a supermarket transaction by its index in the dataset.
 * After deletion, recalculates and updates all related views.
 
 * @param {number} index - Index of the transaction to delete.
 */
function deleteZilnicTranzactie(id) {
  const idx = data_zilnic.tranzactii.findIndex(t => t._id === id);
  if (idx > -1) data_zilnic.tranzactii.splice(idx, 1);
  updateAll();
}


/* ================================================
 * APP CORE — CHART INITIALIZATION PER PAGE
 * ================================================ */

/**
 * Initializes or resets Chart.js charts depending on the currently loaded page.
 * Each page gets its own chart configuration and color palette.
 * Old chart instances are destroyed before re-creation to prevent memory leaks.
 
 * @param {string} page - The active page identifier ("lunar", "utilitati", "administratie", "zilnic").
 */
function initChartsFor(page) {
  // === LUNAR & ANUAL ===
  if (page === 'lunar') {
    const ctxHome = document.getElementById('chartHomePie')?.getContext('2d');
    if (ctxHome) {
      if (chartHomePie) chartHomePie.destroy();
      chartHomePie = new Chart(ctxHome, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
        }
      });
    }

    const ctxAnual = document.getElementById('chartAnual')?.getContext('2d');
    if (ctxAnual) {
      if (chartAnual) chartAnual.destroy();
      chartAnual = new Chart(ctxAnual, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
        }
      });
    }
  }

  // === UTILITIES ===
  if (page === 'utilitati') {
    const ctxUP = document.getElementById('chartUtilPlati')?.getContext('2d');
    if (ctxUP) {
      if (chartUtilPlati) chartUtilPlati.destroy();
      chartUtilPlati = new Chart(ctxUP, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Plăți utilități (RON)', data: [], backgroundColor: '#2ecc71' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    const ctxUC = document.getElementById('chartUtilCurent')?.getContext('2d');
    if (ctxUC) {
      if (chartUtilCurent) chartUtilCurent.destroy();
      chartUtilCurent = new Chart(ctxUC, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Consum curent (kWh)', data: [], backgroundColor: '#3498db' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    const ctxUG = document.getElementById('chartUtilGaz')?.getContext('2d');
    if (ctxUG) {
      if (chartUtilGaz) chartUtilGaz.destroy();
      chartUtilGaz = new Chart(ctxUG, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Consum gaz (m³)', data: [], backgroundColor: '#e67e22' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
  }

  // === ADMINISTRATION ===
  if (page === 'administratie') {
    const ctxAP = document.getElementById('chartAdminPlati')?.getContext('2d');
    if (ctxAP) {
      if (chartAdminPlati) chartAdminPlati.destroy();
      chartAdminPlati = new Chart(ctxAP, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Plăți administrație (RON)', data: [], backgroundColor: '#9b59b6' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    const ctxAA = document.getElementById('chartAdminApa')?.getContext('2d');
    if (ctxAA) {
      if (chartAdminApa) chartAdminApa.destroy();
      chartAdminApa = new Chart(ctxAA, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Consum apă (m³)', data: [], backgroundColor: '#1abc9c' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    // Load saved cost-per-m³ into the input field
    const costInput = document.getElementById('adminCostPeMc');
    if (costInput) costInput.value = Number(data_administratie.cost_pe_mc || 0);
  }

  // === ZILNIC ===
  if (page === 'zilnic') {
    const ctxZ = document.getElementById('chartZilnic')?.getContext('2d');
    if (ctxZ) {
      if (chartZilnic) chartZilnic.destroy();
      chartZilnic = new Chart(ctxZ, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Total',
            data: [],
            backgroundColor: 'rgba(39,193,122,0.5)',
            borderColor: 'rgba(39,193,122,1)',
            borderWidth: 1,
            barPercentage: 0.5
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 20 } }
            },
            x: {
              ticks: {
                font: { size: 20 },
                callback: function (value) {
                  const raw = this.chart.data.labels[value];
                  return raw ? formatLunaAn(raw) : '';
                }
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
            datalabels: {
              anchor: 'end',
              align: 'end',
              formatter: value => `RON ${fmt(value)}`,
              font: { weight: 'bold' }
            }
          },
          layout: { padding: { top: 30, bottom: 30 } }
        },
        plugins: [ChartDataLabels]
      });
    }

    const ctxCarBars = document.getElementById('chartCarBars')?.getContext('2d');
    if (ctxCarBars) {
      if (window.chartCarBars && typeof window.chartCarBars.destroy === 'function') {
        window.chartCarBars.destroy();
      }
      window.chartCarBars = new Chart(ctxCarBars, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Total',
            data: [],
            backgroundColor: 'rgba(39,193,122,0.5)',
            borderColor: 'rgba(39,193,122,1)',
            borderWidth: 1,
            barPercentage: 0.5
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }
}


/* ============================================
 * TABLE UI — COLUMN RESIZE HANDLER
 * ============================================ */

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
      const minW = parseInt(getComputedStyle(th).minWidth) || 60;

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

// Initial delayed setup to ensure tables are rendered before resizers attach
setTimeout(enableColumnResize, 500);


/**
 * Loads a given HTML page dynamically into the main content container.
 * Handles navigation highlighting, chart initialization, table resizing,
 * and page-specific logic (e.g., Car tab handling on the "Zilnic" page).
 
 * @param {string} page - The page name (without ".html" extension).
 */
async function loadPage(page) {
  try {
    // --- Fetch page HTML ---
    const res = await fetch(`${page}.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const contentDiv = document.getElementById('content');

    // Inject page HTML
    contentDiv.innerHTML = html;

    // --- Apply language BEFORE any updateAll() regenerates content ---
    loadLanguage(currentLang);

    // --- Page-specific initialization for "Zilnic" ---
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

    // --- Update active navigation button ---
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(
      `btn${page.charAt(0).toUpperCase() + page.slice(1)}`
    );
    if (activeBtn) activeBtn.classList.add('active');

    // --- Track current page and persist state ---
    currentPage = page;
    saveDataLocal();

    // --- Initialize charts & column resizing ---
    initChartsFor(page);
    setTimeout(enableColumnResize, 0);

    // --- Final full UI + data refresh AFTER translation ---
    updateAll();

	setTimeout(() => loadLanguage(currentLang), 10);

  } catch (e) {
    console.error('Error loading page:', page, e);
    document.getElementById('content').innerHTML = `
      <p style="color:#b91c1c; background:#fee2e2; padding:8px; border-radius:8px;">
        Eroare la încărcarea paginii <b>${page}.html</b>.
      </p>`;
  }

  setDefaultMonth("adminPlataLuna");
  setDefaultMonth("utilPlataLuna");
  setDefaultMonth("utilCurentLuna");
  setDefaultMonth("utilGazLuna");
  setDefaultMonth("adminApaLuna");
  setDefaultMonth("zilnicLuna");
  setDefaultMonth("carData");

}


/* ============================================
 * APP INITIALIZATION — EVENT BINDINGS & STARTUP
 * ============================================ */

/**
 * Main initialization routine executed after DOM is fully loaded.
 * Loads data from localStorage, binds navigation buttons dynamically,
 * sets up rate update controls, and restores the last visited page.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load saved data
  loadDataLocal();

  // Detect language first
  currentLang = detectInitialLanguage();
  loadLanguage(currentLang);

  // Navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const page = btn.getAttribute('data-page');
    if (!page) return;
    btn.addEventListener('click', () => loadPage(page));
  });

  // Manual rates refresh
  const btnRates = document.getElementById('applyRates');
  if (btnRates) btnRates.addEventListener('click', updateAll);

  // Auto BNR update
  const btnAutoRates = document.getElementById('autoRates');
  if (btnAutoRates) {
    btnAutoRates.addEventListener('click', async () => {
      await updateRatesFromBNR();
    });
  }

  // Load last visited page
  let last = (localStorage.getItem('lastPage') || 'lunar').toLowerCase();
  if (!['lunar', 'utilitati', 'administratie', 'zilnic'].includes(last)) {
    last = 'lunar';
  }

  loadPage(last);
});



/* ================================================
 * CAR PAGE — TRANSACTIONS, TABLES & INTERACTIONS
 * ================================================ */

/**
 * Adds a new car transaction.
 * Handles both fuel (benzina) and service/tax (alt) entries.
 * Performs field validation, computes totals, updates tables,
 * and persists the result in localStorage.
 */
function addCarTranzactie() {
  const tip = document.getElementById('carTip').value;

  // --- FUEL TRANSACTION ---
  if (tip === 'benzina') {
    const data  = document.getElementById('carData').value;
    const odo   = parseFloat(document.getElementById('carOdometru').value);
    const litri = parseFloat(document.getElementById('carLitri').value);
    const pret  = parseFloat(document.getElementById('carPret').value);
    const fuel  = document.getElementById('carFuelType').value;

    if (!data || isNaN(odo) || isNaN(litri) || isNaN(pret))
      return alert('Completează câmpurile pentru combustibil');

    const luna = data.slice(0, 7);
    const cost = litri * pret;

    data_car.tranzactii.push({
      _id: Date.now(),
      tip: 'car',
      subt: 'fuel',
      data,
      luna,
      odometru: odo,
      litri,
      pret_litru: pret,
      fuelType: fuel,
      suma: cost,
      moneda: 'RON'
    });

    localStorage.setItem('lastCarOdo', odo);
  }

  // --- SERVICE / TAX TRANSACTION ---
  else {
    const data = document.getElementById('carData2').value;
    const nume = document.getElementById('carDenumire').value;
    const cost = parseFloat(document.getElementById('carCost2').value);

    if (!data || !nume || isNaN(cost))
      return alert('Completează câmpurile pentru Service/Taxe');

    const luna = data.slice(0, 7);
    data_car.tranzactii.push({
      _id: Date.now(),
      tip: 'car',
      subt: 'alt',
      data,
      luna,
      denumire: nume,
      suma: cost,
      moneda: 'RON'
    });
  }

  saveDataLocal();
  renderCarTables();
  updateCarTotals();
  updateCarMedia();
  updateCarSummary();
  updateCarLastOdometru();
}

// Bind live update for cost fields
['carLitri', 'carPret'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', calcCarCost);
});

// Update summary and totals when date changes
const carDateEl = document.getElementById('carData');
if (carDateEl) carDateEl.addEventListener('change', () => {
  updateCarSummary();
  updateCarTotals();
});


/**
 * Toggles visibility between Fuel and Service/Tax tables.
 * Also switches active button styles.
 */
function switchCarTable(which) {
  document.getElementById("carTabFuelBtn").classList.toggle("active", which === "fuel");
  document.getElementById("carTabServBtn").classList.toggle("active", which === "alt");

  const tblFuel  = document.getElementById("carTableFuel");
  const tblAlt   = document.getElementById("carTableAlt");
  const wrapFuel = document.getElementById("carTableFuelWrap");
  const wrapAlt  = document.getElementById("carTableAltWrap");

  if (tblFuel && tblAlt && wrapFuel && wrapAlt) {
    if (which === "fuel") {
      wrapFuel.style.display = "block";
      tblFuel.style.display  = "table";
      wrapAlt.style.display  = "none";
      tblAlt.style.display   = "none";
    } else {
      wrapFuel.style.display = "none";
      tblFuel.style.display  = "none";
      wrapAlt.style.display  = "block";
      tblAlt.style.display   = "table";
    }
  }
}


/**
 * Renders both fuel and service/tax tables for car transactions.
 * Computes price per kilometer for fuel entries and builds table rows dynamically.
 */
function renderCarTables() {
  const items = data_car.tranzactii.sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  // --- FUEL TABLE ---
  const tbodyF = document.querySelector('#carTableFuel tbody');
  if (tbodyF) {
    tbodyF.innerHTML = '';
    let prevFuel = null;

    items.filter(t => t.subt === 'fuel').forEach(t => {
      const deltaKm = (prevFuel && typeof t.odometru === 'number' && typeof prevFuel.odometru === 'number')
        ? (t.odometru - prevFuel.odometru)
        : 0;
      const pricePerKm = (deltaKm > 0) ? (t.suma / deltaKm) : null;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.data || ''}</td>
        <td>${typeof t.odometru === 'number' ? fmt(t.odometru) : ''}</td>
        <td>${t.fuelType || ''}</td>
        <td>${typeof t.litri === 'number' ? fmt(t.litri) : ''}</td>
        <td>${typeof t.pret_litru === 'number' ? fmt(t.pret_litru) : ''}</td>
        <td>${pricePerKm != null ? Number(pricePerKm).toFixed(2) : '—'}</td>
        <td>RON ${fmt(t.suma || 0)}</td>
        <td><button class="deleteBtn" onclick="deleteCarItem(${t._id})">🗑️</button></td>
      `;
      tbodyF.appendChild(tr);

      prevFuel = t;
    });
  }

  // --- SERVICE / TAX TABLE ---
  const tbodyA = document.querySelector('#carTableAlt tbody');
  if (tbodyA) {
    tbodyA.innerHTML = '';
    items.filter(t => t.subt === 'alt').forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.data || ''}</td>
        <td>${t.denumire || ''}</td>
        <td>RON ${fmt(t.suma || 0)}</td>
        <td><button class="deleteBtn" onclick="deleteCarItem(${t._id})">🗑️</button></td>
      `;
      tbodyA.appendChild(tr);
    });
  }
}


/**
 * Deletes a car transaction by ID.
 * Removes the record, saves the new state, and refreshes tables and summaries.
 */
function deleteCarItem(id) {
  const idx = data_car.tranzactii.findIndex(x => x._id === id);
  if (idx > -1) {
    data_car.tranzactii.splice(idx, 1);
    saveDataLocal();
    renderCarTables();
    updateCarTotals();
    updateCarSummary();
  }
}


/* ================================================
 * CAR PAGE — MONTHLY SUMMARY & CHART UPDATE
 * ================================================ */

/**
 * Updates the summary panel for the Car page.
 * Calculates monthly totals, fuel vs service breakdown,
 * and average cost per kilometer. Updates both the summary
 * text and the bar chart showing spending trends over time.
 */
function updateCarSummary() {
  let currentMonth = '';

  // Determine current or last active month
  const dateEl = document.getElementById('carData');
  if (dateEl && dateEl.value) currentMonth = dateEl.value.slice(0, 7);

  const carItems = data_car.tranzactii
    .filter(t => t.tip === 'car')
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  if (!currentMonth) {
    const last = carItems[carItems.length - 1];
    if (last && last.luna) currentMonth = last.luna;
  }

  // If still no month available → clear UI
  if (!currentMonth) {
    const el = document.getElementById('carSummaryText');
    if (el) el.innerHTML = '—';
    return;
  }

  // --- Compute monthly totals ---
  const monthItems = carItems.filter(t => t.luna === currentMonth);
  const total = monthItems.reduce((s, t) => s + (t.suma || 0), 0);

  // Split by category
  const totalFuel = monthItems.filter(t => t.subt === 'fuel').reduce((s, t) => s + (t.suma || 0), 0);
  const totalAlt  = monthItems.filter(t => t.subt === 'alt').reduce((s, t) => s + (t.suma || 0), 0);

  // --- Compute average cost per km ---
  const fuelMonth = monthItems
    .filter(t => t.subt === 'fuel')
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  let prev = null, prices = [];
  fuelMonth.forEach(t => {
    const delta = (prev && typeof t.odometru === 'number' && typeof prev.odometru === 'number')
      ? (t.odometru - prev.odometru)
      : 0;
    if (delta > 0 && (t.suma || 0) > 0) prices.push(t.suma / delta);
    prev = t;
  });

  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  // --- Update summary text ---
  const txt = `
    <span class="month">${formatLunaAn(currentMonth)}</span>: 
    <span class="total">RON ${fmt(total)}</span>
    <span class="meta">Consum mediu: <b>${avg ? avg.toFixed(2) : '—'}</b> lei/km</span>
    <span class="break">
      Combustibil: RON ${fmt(totalFuel)} • Service & taxe: RON ${fmt(totalAlt)}
    </span>
  `;

  const summaryEl = document.getElementById('carSummaryText');
  if (summaryEl) summaryEl.innerHTML = txt;

  // --- Update Car bar chart (trend over months) ---
  if (window.chartCarBars) {
    const months = [...new Set(data_car.tranzactii.map(t => t.luna))].sort();
    const sums = months.map(m =>
      data_car.tranzactii
        .filter(t => t.luna === m)
        .reduce((s, t) => s + (t.suma || 0), 0)
    );

    window.chartCarBars.data.labels = months.map(formatLunaAn);
    window.chartCarBars.data.datasets[0].data = sums;
    window.chartCarBars.update();
  }
}


/* ================================================
 * CAR PAGE — TOTALS, COSTS & ODOMETER MANAGEMENT
 * ================================================ */

/**
 * Updates the total car spending for the currently selected month.
 */
function updateCarTotals() {
  const rates = getRates();

  // Determine the current month (e.g. "2025-11")
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Calculate total car expenses for the current month (in RON)
  const total = data_car.tranzactii
    .filter(t => (t.data || t.luna || '').startsWith(currentMonth))
    .reduce((sum, t) => sum + (t.cost_total || t.suma || 0) * (rates[t.moneda] || 1), 0);

  // Keep this function for analytics or charts
  return total;
}

/**
 * Automatically calculates and displays the total cost (RON)
 * for a fuel entry based on "litri" × "preț/litru".
 */
function calcCarCost() {
  const litri = parseFloat(document.getElementById('carLitri').value) || 0;
  const pret  = parseFloat(document.getElementById('carPret').value) || 0;
  const costField = document.getElementById('carCost');
  if (costField) costField.value = (litri * pret).toFixed(2) + ' RON';
}


/**
 * Updates the odometer placeholder with the last recorded value.
 * This helps the user know where they left off last time.
 */
function updateCarLastOdometru() {
  const last = localStorage.getItem('lastCarOdo');
  const odoInput = document.getElementById('carOdometru');
  const span = document.getElementById('carLastOdo');
  if (!odoInput || !span) return;

  odoInput.placeholder = last
    ? `Odometru. înainte: ${last}`
    : "Odometru";
}

/**
 * Calculates and displays the average of total monthly car expenses.
 * Each month is first summed (fuel + service/taxes), and the final card
 * shows the average of those monthly totals.
 * The same value is also synchronized to the "Lunar" page.
 */
function updateCarMedia() {
  const rates = getRates();
  const tranzactii = data_car.tranzactii || [];

  // No data → display empty
  if (!tranzactii.length) {
    const m = document.getElementById('carMediaRON');
    if (m) m.innerText = '—';
    return;
  }

  // --- Group all transactions by month ---
  const byMonth = {};
  tranzactii.forEach(t => {
    const luna = (t.luna || (t.data || '').slice(0, 7));
    if (!luna) return;

    const val = (t.cost_total || t.suma || 0) * (rates[t.moneda] || 1);
    if (!byMonth[luna]) byMonth[luna] = 0;
    byMonth[luna] += val;
  });

  // --- Compute the average of all monthly totals ---
  const totaluriLunare = Object.values(byMonth);
  const mediaGenerala = totaluriLunare.length
    ? totaluriLunare.reduce((a, b) => a + b, 0) / totaluriLunare.length
    : 0;

  // Round to 2 decimals
  const mediaFinala = parseFloat(mediaGenerala.toFixed(2));

  // --- Display in card ---
  const m = document.getElementById('carMediaRON');
  if (m) m.innerText = `RON ${fmt(mediaGenerala)}`;

}


/* ================================================
 * GLOBAL HELPERS — TEXT & SCROLL BEHAVIOR
 * ================================================ */

/**
 * Capitalizes the first character of a string.
 * Example: "hello" → "Hello"
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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


/* ================================================
 * GLOBAL UI — PAGE ZOOM CONTROL (CTRL + SCROLL)
 * ================================================ */

/**
 * Allows zooming the entire page content via Ctrl + scroll.
 * Uses a transform scale on #zoomWrapper for smooth resizing.
 * 
 * - Ctrl + scroll up   → Zoom in
 * - Ctrl + scroll down → Zoom out (min 50%)
 * - Ctrl + 0           → Reset zoom to 100%
 */

let zoomLevel = 1;

/**
 * Applies the current zoom level to the wrapper container.
 */
function applyZoom() {
  const wrapper = document.getElementById('zoomWrapper');
  if (wrapper) wrapper.style.transform = `scale(${zoomLevel})`;
}

// Ctrl + scroll → zoom in/out
window.addEventListener('wheel', function (e) {
  if (!e.ctrlKey) return; // Only active when Ctrl is held
  e.preventDefault();     // Prevent browser's native zoom

  zoomLevel += (e.deltaY < 0 ? 0.05 : -0.05);
  zoomLevel = Math.max(0.5, zoomLevel); // Limit minimum zoom
  applyZoom();
}, { passive: false });

// Ctrl + 0 → reset zoom
window.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === '0') {
    zoomLevel = 1;
    applyZoom();
    e.preventDefault();
  }
});


/* ================================================
 * GLOBAL EXPORTS — EXPOSE FUNCTIONS TO WINDOW
 * ================================================ */

/**
 * Exposes key functions to the global `window` object.
 * This allows HTML inline event attributes (onclick, etc.)
 * and dynamically loaded pages to access them safely.
 */

window.loadPage = loadPage;

// CRUD — Monthly / Annual
window.addItem        = addItem;
window.addCategory    = addCategory;
window.toggleService  = toggleService;
window.deleteItem     = deleteItem;
window.updateNote     = updateNote;
window.updateCost     = updateCost;
window.updateMoneda   = updateMoneda;
window.deleteCategory = deleteCategory;

// Utilities
window.addUtilPlata    = addUtilPlata;
window.deleteUtilPlata = deleteUtilPlata;
window.addUtilCurent   = addUtilCurent;
window.deleteUtilCurent= deleteUtilCurent;
window.addUtilGaz      = addUtilGaz;
window.deleteUtilGaz   = deleteUtilGaz;

// Administration
window.addAdminPlata   = addAdminPlata;
window.deleteAdminPlata= deleteAdminPlata;
window.addAdminApa     = addAdminApa;
window.deleteAdminApa  = deleteAdminApa;
window.applyAdminCost  = applyAdminCost;

// Daily (Zilnic)
window.switchZilnicTab = switchZilnicTab;
