/**
 * LUNAR & ANUAL MODULE — Monthly and yearly service management.
 * Handles rendering tables, adding items, categories, inline editing,
 * activation toggles, deletion, percentage calculation and chart refresh.
 */
 
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
  
  enableColumnResize();
}


/**
 * Formats currency subtotals as a readable string (e.g. "RON 320 | EUR 50").
 *
 * @param {Object} sums - Object with numeric values per currency {RON, EUR, USD}.
 * @returns {string} Human-readable string containing all non-zero currencies.
 */
function formatPerCurrencyString(sums) {
  return ['RON', 'EUR', 'USD']
    .filter(curr => sums[curr])
    .map(curr => `${curr} ${fmt(sums[curr])}`)
    .join('  |  ');
}

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

// =======================================
// 		Compact View Toggle (Lunar Page)
// =======================================

let lunarCompact = false;

/* Update button text depending on language + current mode */
function updateLunarCompactButton() {
  const btn = document.getElementById("lunarCompactToggle");
  if (!btn) return;

  if (lunarCompact) {
    btn.textContent = currentLang === "ro" ? "Vezi tabele: Extinse" : "View: extended tables";
  } else {
    btn.textContent = currentLang === "ro" ? "Vezi tabele: Compacte" : "View: compact tables";
  }
}

/* Toggle compact/extended mode */
function toggleLunarCompact() {
  lunarCompact = !lunarCompact;

  const sec = document.getElementById("lunar");
  
  // FIX: Verificăm dacă secțiunea 'lunar' există în DOM
  if (sec) {
    if (lunarCompact) {
      sec.classList.add("lunar-compact");
    } else {
      sec.classList.remove("lunar-compact");
    }
  }

  updateLunarCompactButton();
  localStorage.setItem("lunarCompactMode", lunarCompact ? "1" : "0");
}

/* On page load */
window.addEventListener("DOMContentLoaded", () => {
  lunarCompact = localStorage.getItem("lunarCompactMode") === "1";

  if (lunarCompact) {
    document.getElementById("lunar").classList.add("lunar-compact");
  }

  updateLunarCompactButton();

  const btn = document.getElementById("lunarCompactToggle");
  if (btn) btn.onclick = toggleLunarCompact;
});
