/**
 * UTILITIES MODULE — Electricity, gas and generic utilities payments.
 * Provides CRUD operations, table rendering, automatic consumption
 * calculations and updates corresponding charts.
 */
 
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
