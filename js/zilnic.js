/**
 * DAILY EXPENSES MODULE — Supermarket, Wants, Bars & Trips.
 * Manages daily transactions, monthly summaries, pie charts
 * and the internal Zilnic tab system.
 */
 
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
 * Deletes a supermarket transaction by its index in the dataset.
 * After deletion, recalculates and updates all related views.
 
 * @param {number} index - Index of the transaction to delete.
 */
function deleteZilnicTranzactie(id) {
  const idx = data_zilnic.tranzactii.findIndex(t => t._id === id);
  if (idx > -1) data_zilnic.tranzactii.splice(idx, 1);
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