/**
 * SYNC MODULE — Central synchronization logic.
 * Computes totals, averages and auto-generated rows that must
 * appear in the Monthly (Lunar) page based on data from Utilities,
 * Administration, Supermarket and Car pages.
 *
 * updateAll() is the main refresh cycle for the entire SPA.
 */
 


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
      cost: Number(cost.toFixed(2)),
      moneda: 'RON',
      activ: true,
      [flag]: true
    });
  } else {
    arr[idx].nume = label;
    arr[idx].cost = Number(cost.toFixed(2));
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