/**
 * CAR MODULE — Fuel, service and tax expenses.
 * Provides entry creation, table rendering, km-based calculation,
 * monthly summaries, average cost and chart updates.
 */
 
 
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
  
  // mark unsaved changes
  hasUnsavedChanges = true;
  updateCloudSaveButton();

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
	
	// mark unsaved changes
    hasUnsavedChanges = true;
    updateCloudSaveButton();
  
    saveDataLocal();
    renderCarTables();
    updateCarTotals();
    updateCarSummary();
  }
}


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
    <span class="meta">
	  <span data-i18n="car_consum_mediu"></span> :
	  <b>${avg ? avg.toFixed(2) : '—'}</b>
	  <span data-i18n="car_lei_pe_km"></span>
	</span>
    <span class="break">
		<span data-i18n="car_combustibil_label"></span> :
		<span></span> ${fmt(totalFuel)}
		•
		<span data-i18n="car_service_taxe_label"></span>:
		<span></span> ${fmt(totalAlt)}
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
 * Automatically calculates and displays the total cost (RON)
 * for a fuel entry based on "litri" × "preț/litru".
 */
function calcCarCost() {
  const litri = parseFloat(document.getElementById('carLitri').value) || 0;
  const pret  = parseFloat(document.getElementById('carPret').value) || 0;
  const costField = document.getElementById('carCost');
  if (costField) costField.value = (litri * pret).toFixed(2) + ' RON';
}
