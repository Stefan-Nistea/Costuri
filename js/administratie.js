/**
 * ADMINISTRATION MODULE — HOA and water meter management.
 * Renders administration payments, water readings, consumption,
 * invoice values and updates related charts.
 */
 
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
  
  // === Set placeholders with last values ===
  const last = items[items.length - 1];
  if (last) {
    const c1 = document.getElementById("adminApaContor1");
    const c2 = document.getElementById("adminApaContor2");

    if (c1) c1.placeholder = `${fmt(last.contor1)} m³`;
    if (c2) c2.placeholder = `${fmt(last.contor2)} m³`;
  }

  // Persist latest data state
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
    data_administratie.apa[existingIndex].contor1 = c1;
    data_administratie.apa[existingIndex].contor2 = c2;
  } else {
    data_administratie.apa.push({
      luna,
      contor1: c1,
      contor2: c2,
      cost_factura: 0
    });
  }

  renderAdminApa();
  saveDataLocal();
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
