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
  EUR: 0,
  USD: 0,
  RON: 1
};

/**
 * Fetches XML feed from BNR and extracts RON conversion values.
 * Uses browser DOMParser to read <Rate currency="EUR"> and <Rate currency="USD">.
 */
async function getRates() {
  try {
    const response = await fetch("https://www.bnr.ro/nbrfxrates.xml");
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    const eur = xml.querySelector('Rate[currency="EUR"]');
    const usd = xml.querySelector('Rate[currency="USD"]');

    if (eur && usd) {
      exchangeRates.EUR = parseFloat(eur.textContent);
      exchangeRates.USD = parseFloat(usd.textContent);
    }

    console.log("BNR exchange rates updated:", exchangeRates);
  } catch (err) {
    console.error("Failed to fetch BNR rates:", err);
  }
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
  if (typeof syncUtilitatiMediaToLunar === "function") syncUtilitatiMediaToLunar();
  if (typeof syncAdministratieToLunar === "function") syncAdministratieToLunar();
  if (typeof syncSupermarketMediaToLunar === "function") syncSupermarketMediaToLunar();
  if (typeof syncCarMediaToLunar === "function") syncCarMediaToLunar();

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
    if (typeof updateCarTotals === "function") updateCarTotals();
    if (typeof updateCarSummary === "function") updateCarSummary();
    if (typeof updateCarLastOdometru === "function") updateCarLastOdometru();
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



// === HELPERS ===
function getDataFor(type){ return (type==='lunar') ? data_lunar : data_anual; }
function getTableFor(type){ return (type==='lunar') ? document.querySelector('#tableServiciiHome tbody') : document.querySelector('#tableServiciiAnual tbody'); }
function getChartFor(type){ return (type==='lunar') ? chartHomePie : chartAnual; }

function computeTotals(type){
  const data = getDataFor(type).servicii;
  const rates = getRates();
  const sums = { RON:0, EUR:0, USD:0 };
  data.forEach(s=>{
    if(s.categorie || !s.activ) return;
    const c = parseFloat(s.cost) || 0;
    if(s.moneda==='EUR') sums.EUR += c;
    else if(s.moneda==='USD') sums.USD += c;
    else sums.RON += c;
  });
  const totalRON = sums.RON + sums.EUR*rates.EUR + sums.USD*rates.USD;
  return { sums, totalRON };
}
function formatPerCurrencyString(sums){
  return ['RON','EUR','USD']
    .filter(m=>sums[m])
    .map(m=>`${m} ${fmt(sums[m])}`).join('  |  ');
}

// === CRUD: MONTHLY / ANNUAL ===
function addItem(type){
  const name = document.getElementById(type==='lunar'?'newServiceName':'newServiceNameAnual').value.trim();
  const cost = parseFloat(document.getElementById(type==='lunar'?'newServiceCost':'newServiceCostAnual').value);
  const moneda = document.getElementById(type==='lunar'?'newServiceCurrency':'newServiceCurrencyAnual').value;
  if(!name || isNaN(cost)) return alert('Completează nume și cost');
  getDataFor(type).servicii.push({nume:name, cost:cost, moneda:moneda, activ:true, note:''});
  updateAll();
}

function addCategory(type){
  const name = document.getElementById(type==='lunar'?'newCategoryName':'newCategoryNameAnual').value.trim();
  if(!name) return alert('Completează numele!');
  getDataFor(type).servicii.push({categorie:true, nume:name});
  updateAll();
}

function toggleService(type,i){
  const arr = getDataFor(type).servicii;
  if(arr[i].util_media || arr[i].util_admin) return;
  arr[i].activ=!arr[i].activ;
  updateAll();
}

function deleteItem(type,i){
  const arr = getDataFor(type).servicii;
  if (
	  arr[i].util_media ||
	  arr[i].util_admin ||
	  arr[i].util_media_supermarket ||
	  arr[i].util_media_car
  ) return alert('Această linie este automată');
  arr.splice(i,1);
  updateAll();
}

function updateNote(type,i,v){ getDataFor(type).servicii[i].note=v; saveDataLocal(); }
function updateCost(type,i,v){ if(!getDataFor(type).servicii[i].util_media && !getDataFor(type).servicii[i].util_admin){ getDataFor(type).servicii[i].cost=parseFloat(v)||0; updateAll(); }}

function updateCostInline(type, i, val) {
  let cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
  let num = parseFloat(cleaned);
  if (isNaN(num)) num = 0;

  getDataFor(type).servicii[i].cost = parseFloat(num.toFixed(2));

  saveDataLocal();
  updateAll(); 
}

function updateMoneda(type,i,v){ if(!getDataFor(type).servicii[i].util_media && !getDataFor(type).servicii[i].util_admin){ getDataFor(type).servicii[i].moneda=v; updateAll(); }}
function deleteCategory(type,i){ getDataFor(type).servicii.splice(i,1); updateAll(); }

// === BNR FX AUTO-UPDATE ===
async function updateRatesFromBNR() {
  try {
    const response = await fetch('https://www.bnr.ro/nbrfxrates.xml');
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const rates = xmlDoc.getElementsByTagName('Rate');
    let eur = null, usd = null;
    for (let r of rates) {
      const currency = r.getAttribute('currency');
      if (currency === 'EUR') eur = parseFloat(r.textContent.replace(',', '.'));
      if (currency === 'USD') usd = parseFloat(r.textContent.replace(',', '.'));
    }

    if (!eur || !usd) throw new Error('Missing FX rates in BNR XML');

    document.getElementById('rateEUR').value = eur.toFixed(4);
    document.getElementById('rateUSD').value = usd.toFixed(4);
    console.log(`BNR exchange rates updated: EUR ${eur} / USD ${usd}`);

  } catch (e) {
    console.warn('Error fetching BNR exchange rates — using default values.', e);
    // Fallback default values
    const eur = 4.95;
    const usd = 4.50;
    document.getElementById('rateEUR').value = eur.toFixed(4);
    document.getElementById('rateUSD').value = usd.toFixed(4);
  }

  const info = document.getElementById('ratesInfo');
  if (info) {
    const now = new Date();
    info.innerText = `Ultima actualizare automată: ${now.toLocaleString('ro-RO')} (BNR)`;
  }

  updateAll();
}

// === RENDER TABLE ===
function renderTable(type){
  const tbody = getTableFor(type);
  if (!tbody) return;
  tbody.innerHTML='';
  const arr = getDataFor(type).servicii;
  const rates=getRates();
  const totalRON = computeTotals(type).totalRON||0;

  arr.forEach((s,i)=>{
    if(s.categorie){
      const tr=document.createElement('tr');
      tr.innerHTML=`<td colspan="8" style="font-weight:700;text-align:center;background:#f8f8f8;">
        ${s.nume} <span class="dragHandle">≡</span>
        <button class="deleteBtn" onclick="deleteCategory('${type}',${i})">🗑️</button>
      </td>`;
      tbody.appendChild(tr);
      return;
    }
    const rowRON=(s.cost||0)*(rates[s.moneda||'RON']||1);
    const percent=!s.activ?'0%':totalRON?((rowRON/totalRON)*100).toFixed(1)+'%':'-';
    const dis = (
	  s.util_media ||
	  s.util_admin ||
	  s.util_media_supermarket ||
	  s.util_media_car
	) ? 'disabled' : '';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td style="text-align:left">
		  ${s.nume}
		  ${(s.util_media || s.util_media_supermarket || s.util_media_car)
			? '<span style="color:#6b7280">(auto)</span>': ''}
		  ${s.util_admin ? '<span style="color:#6b7280">(Admin)</span>' : ''}
	  </td>
	  <td 
		contenteditable="true"
		onkeydown="if(event.key==='Enter'){ event.preventDefault(); this.blur(); }"
		onblur="updateCostInline('${type}', ${i}, this.innerText)">
		${s.cost || 0}
	  </td>
      <td>
        <select ${dis} onchange="updateMoneda('${type}',${i},this.value)">
          <option ${s.moneda==='RON'?'selected':''}>RON</option>
          <option ${s.moneda==='EUR'?'selected':''}>EUR</option>
          <option ${s.moneda==='USD'?'selected':''}>USD</option>
        </select>
      </td>
      <td>${percent}</td>
      <td><textarea class="noteInput" ${dis} onchange="updateNote('${type}',${i},this.value)">${s.note||''}</textarea></td>
      <td><button class="switchBtn ${s.activ?'active':'inactive'}" ${dis} onclick="toggleService('${type}',${i})">${s.activ?'On':'Off'}</button></td>
      <td class="dragHandle">≡</td>
      <td><button class="deleteBtn" onclick="deleteItem('${type}',${i})">🗑️</button></td>`;
    tbody.appendChild(tr);
  });

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
  }
  else {
    if(!sortableAnual)
      sortableAnual=new Sortable(tbody,{handle:'.dragHandle',animation:150,onEnd:e=>{
        const arr=data_anual.servicii;arr.splice(e.newIndex,0,arr.splice(e.oldIndex,1)[0]);updateAll();
      }});
  }

  // --- UPDATE CHART
  const chart = getChartFor(type);
  if (chart) {
    const labels = arr.filter(s => !s.categorie).map(s => s.nume);
    const values = arr
      .filter(s => !s.categorie)
      .map(s => s.activ ? (s.cost || 0) * (rates[s.moneda || 'RON'] || 1) : 0);

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    if (chart.config.type === 'pie') {
      chart.data.datasets[0].backgroundColor = labels.map(() => getRandomColor());
    }

    chart.update();
  }
  saveDataLocal();
}

// === TOTALS ===
function updateTotalsUI(){
  const tL=computeTotals('lunar');
  const tA=computeTotals('anual');

  const elL = document.getElementById('totalsPerCurrencyLunar');
  if (elL) elL.innerText = formatPerCurrencyString(tL.sums);

  const totalAnualHome = document.getElementById('totalAnualHome');
  if (totalAnualHome) totalAnualHome.innerText = `RON ${fmt(tA.totalRON)}`;

  const oblig=(tL.totalRON||0)+(tA.totalRON||0)/12;
  const obligEl=document.getElementById('obligatiiLunare');
  if (obligEl) obligEl.innerText=`RON ${fmt(oblig)}`;
}

// === UTILITIES ===
function computeUtilitatiMediaRON(){
  const rates=getRates();
  if(!data_utilitati.plati.length) return 0;
  const total=data_utilitati.plati.reduce((a,p)=>a+(p.suma||0)*(rates[p.moneda]||1),0);
  return total/data_utilitati.plati.length;
}

function syncUtilitatiMediaToLunar(){
  const media=computeUtilitatiMediaRON();
  let idx=data_lunar.servicii.findIndex(s=>s.util_media);
  if(idx===-1){
    let pos=data_lunar.servicii.findIndex(s=>s.categorie&&s.nume.toLowerCase().includes('utilitati'));
    if(pos===-1) pos=data_lunar.servicii.length;
    data_lunar.servicii.splice(pos+1,0,{nume:'Media utilități',cost:media,moneda:'RON',activ:true,util_media:true});
  } 
  else data_lunar.servicii[idx].cost=media;
}

function renderUtilPlati(){
  const tbody=document.querySelector('#tableUtilPlati tbody');
  if (!tbody) return;
  tbody.innerHTML='';
  const items=[...data_utilitati.plati].sort((a,b)=>a.luna.localeCompare(b.luna));
  items.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.luna}</td><td>${fmt(p.suma)}</td><td>${p.moneda}</td>
      <td><button class="deleteBtn" onclick="deleteUtilPlata('${p.luna}',${p.suma},'${p.moneda}')">🗑️</button></td>`;
    tbody.appendChild(tr);
  });
  const media=computeUtilitatiMediaRON();
  const mEl=document.getElementById('utilitatiMediaRON');
  if (mEl) mEl.innerText=`RON ${fmt(media)}`;
  const rates=getRates();
  const labels=items.map(p=>p.luna);
  const values=items.map(p=>(p.suma||0)*(rates[p.moneda]||1));
  if (chartUtilPlati) {
    chartUtilPlati.data.labels=labels;
    chartUtilPlati.data.datasets[0].data=values;
    chartUtilPlati.update();
  }
  saveDataLocal();
}
function addUtilPlata(){
  const luna=document.getElementById('utilPlataLuna').value;
  const suma=parseFloat(document.getElementById('utilPlataSuma').value);
  const moneda=document.getElementById('utilPlataMoneda').value;
  if(!luna||isNaN(suma)) return alert('Completează luna și suma');
  data_utilitati.plati.push({luna,suma,moneda});
  syncUtilitatiMediaToLunar();
  updateAll();
}
function deleteUtilPlata(luna,suma,moneda){
  const i=data_utilitati.plati.findIndex(p=>p.luna===luna&&Number(p.suma)===Number(suma)&&p.moneda===moneda);
  if(i>-1) data_utilitati.plati.splice(i,1);
  syncUtilitatiMediaToLunar(); updateAll();
}

// === ELECTRICITY READINGS ===
function renderUtilCurent(){
  const tb=document.querySelector('#tableUtilCurent tbody');
  if (!tb) return;
  tb.innerHTML='';
  const items=[...data_utilitati.citiri_curent].sort((a,b)=>a.luna.localeCompare(b.luna));
  let prev=null, labels=[], diffs=[];
  items.forEach(c=>{
    const rawDiff = prev ? (c.valoare - prev.valoare) : 0;
    const diff = rawDiff < 0 ? 0 : rawDiff;
    diffs.push(diff); labels.push(c.luna);
    tb.innerHTML+=`<tr><td>${c.luna}</td><td>${fmt(c.valoare)}</td><td>${fmt(diff)}</td>
      <td><button class="deleteBtn" onclick="deleteUtilCurent('${c.luna}',${c.valoare})">🗑️</button></td></tr>`;
    prev=c;
  });
  if (chartUtilCurent) {
    chartUtilCurent.data.labels=labels;
    chartUtilCurent.data.datasets[0].data=diffs;
    chartUtilCurent.update();
  }
  saveDataLocal();
}

function addUtilCurent(){
  const luna=document.getElementById('utilCurentLuna').value;
  const val=parseFloat(document.getElementById('utilCurentValoare').value);
  if(!luna||isNaN(val)) return alert('Completează luna și valoarea');
  const idx=data_utilitati.citiri_curent.findIndex(x=>x.luna===luna);
  if(idx>-1) data_utilitati.citiri_curent[idx].valoare=val;
  else data_utilitati.citiri_curent.push({luna,valoare:val});
  renderUtilCurent();
}

function deleteUtilCurent(luna,val){
  const i=data_utilitati.citiri_curent.findIndex(c=>c.luna===luna&&c.valoare===val);
  if(i>-1) data_utilitati.citiri_curent.splice(i,1);
  renderUtilCurent();
}

// === GAS READINGS ===
function renderUtilGaz(){
  const tb=document.querySelector('#tableUtilGaz tbody');
  if (!tb) return;
  tb.innerHTML='';
  const items=[...data_utilitati.citiri_gaz].sort((a,b)=>a.luna.localeCompare(b.luna));
  let prev=null, labels=[], diffs=[];
  items.forEach(c=>{
    const rawDiff = prev ? (c.valoare - prev.valoare) : 0;
    const diff = rawDiff < 0 ? 0 : rawDiff;
    diffs.push(diff); labels.push(c.luna);
    tb.innerHTML+=`<tr><td>${c.luna}</td><td>${fmt(c.valoare)}</td><td>${fmt(diff)}</td>
      <td><button class="deleteBtn" onclick="deleteUtilGaz('${c.luna}',${c.valoare})">🗑️</button></td></tr>`;
    prev=c;
  });
  if (chartUtilGaz) {
    chartUtilGaz.data.labels=labels;
    chartUtilGaz.data.datasets[0].data=diffs;
    chartUtilGaz.update();
  }
  saveDataLocal();
}
function addUtilGaz(){
  const luna=document.getElementById('utilGazLuna').value;
  const val=parseFloat(document.getElementById('utilGazValoare').value);
  if(!luna||isNaN(val)) return alert('Completează luna și valoarea');
  const idx=data_utilitati.citiri_gaz.findIndex(x=>x.luna===luna);
  if(idx>-1) data_utilitati.citiri_gaz[idx].valoare=val;
  else data_utilitati.citiri_gaz.push({luna,valoare:val});
  renderUtilGaz();
}
function deleteUtilGaz(luna,val){
  const i=data_utilitati.citiri_gaz.findIndex(c=>c.luna===luna&&c.valoare===val);
  if(i>-1) data_utilitati.citiri_gaz.splice(i,1);
  renderUtilGaz();
}

// === ADMIN: SYNC WITH MONTHLY ===
function syncAdministratieToLunar(){
  const rates=getRates();
  const sorted=[...data_administratie.plati].sort((a,b)=>a.luna.localeCompare(b.luna));
  const last=sorted[sorted.length-1];
  const ron = last ? (last.suma || 0) * (rates[last.moneda] || 1) : 0;

  let idx=data_lunar.servicii.findIndex(s=>s.util_admin);
  if(idx===-1){
    let pos=data_lunar.servicii.findIndex(s=>s.categorie&&s.nume.toLowerCase().includes('utilitati'));
    if(pos===-1) pos=data_lunar.servicii.length;
    data_lunar.servicii.splice(pos+1,0,{nume:'Administratie',cost:ron,moneda:'RON',activ:true,util_admin:true, note:''});
  } else {
    data_lunar.servicii[idx].cost = ron;
    data_lunar.servicii[idx].moneda = 'RON';
    data_lunar.servicii[idx].activ = true;
  }
}

// === ADMIN: PAYMENTS ===
function renderAdminPlati(){
  const tbody=document.querySelector('#tableAdminPlati tbody');
  if (!tbody) return;
  tbody.innerHTML='';
  const rates=getRates();
  const items=[...data_administratie.plati].sort((a,b)=>a.luna.localeCompare(b.luna));
  items.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.luna}</td><td>${fmt(p.suma)}</td><td>${p.moneda}</td>
      <td><button class='deleteBtn' onclick="deleteAdminPlata('${p.luna}',${p.suma},'${p.moneda}')">🗑️</button></td>`;
    tbody.appendChild(tr);
  });

  // Chart in RON
  if (chartAdminPlati) {
    chartAdminPlati.data.labels = items.map(p=>p.luna);
    chartAdminPlati.data.datasets[0].data = items.map(p=>(p.suma||0)*(rates[p.moneda]||1));
    chartAdminPlati.update();
  }
  saveDataLocal();
}

function addAdminPlata(){
  const luna = document.getElementById('adminPlataLuna')?.value;
  const suma = parseFloat(document.getElementById('adminPlataSuma')?.value);
  const moneda = document.getElementById('adminPlataMoneda')?.value;
  if(!luna || isNaN(suma)) return alert('Completează luna și suma');
  data_administratie.plati.push({luna, suma, moneda});
  syncAdministratieToLunar();
  updateAll();
}

function updateAdminCostFactura(luna, val) {
  const valNum = parseFloat(val.replace(',', '.')) || 0;
  const item = data_administratie.apa.find(r => r.luna === luna);
  if (item) item.cost_factura = valNum;
  saveDataLocal();
  renderAdminApa(); 
}

function addAdminApa() {
  const luna = document.getElementById('adminApaLuna').value;
  const c1 = parseFloat(document.getElementById('adminApaContor1').value);
  const c2 = parseFloat(document.getElementById('adminApaContor2').value);

  if (!luna || isNaN(c1) || isNaN(c2)) {
    return alert('Completează luna și contoarele');
  }

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
  saveDataLocal();  // Persist to localStorage
}

function deleteAdminPlata(luna,suma,moneda){
  const i=data_administratie.plati.findIndex(p=>p.luna===luna&&Number(p.suma)===Number(suma)&&p.moneda===moneda);
  if(i>-1) data_administratie.plati.splice(i,1);
  syncAdministratieToLunar();
  updateAll();
}

// === ADMIN: WATER ===
function renderAdminApa(){
  const tbody=document.querySelector('#tableAdminApa tbody');
  if (!tbody) return;
  tbody.innerHTML='';
  const items=[...data_administratie.apa].sort((a,b)=>a.luna.localeCompare(b.luna));
  let prev=null;
  let labels=[], consumuri=[];
  items.forEach(row=>{
    const d1 = prev ? (row.contor1 - prev.contor1) : 0;
    const d2 = prev ? (row.contor2 - prev.contor2) : 0;
    const dif1 = d1 < 0 ? 0 : d1;
    const dif2 = d2 < 0 ? 0 : d2;
    const total = dif1 + dif2;
    const costCalc = total * (data_administratie.cost_pe_mc || 0);
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${row.luna}</td>
      <td>${fmt(row.contor1)}</td>
      <td>${fmt(dif1)}</td>
      <td>${fmt(row.contor2)}</td>
      <td>${fmt(dif2)}</td>
      <td>${fmt(total)}</td>
      <td>RON ${fmt(costCalc)}</td>
      <td contenteditable="true" onblur="updateAdminCostFactura('${row.luna}', this.innerText)">
		${fmt(row.cost_factura || 0)}
	  </td>
      <td><button class='deleteBtn' onclick="deleteAdminApa('${row.luna}',${row.contor1},${row.contor2},${row.cost_factura||0})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
    labels.push(row.luna);
    consumuri.push(total);
    prev=row;
  });

  if (chartAdminApa) {
    chartAdminApa.data.labels = labels;
    chartAdminApa.data.datasets[0].data = consumuri;
    chartAdminApa.update();
  }
  saveDataLocal();
}

function updateZilnicView() {
  const rates = getRates();

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

  let mediaGenerala = 0;
  if (luni.length) {
    const totaluri = luni.map(l => byMonth[l].total);
    mediaGenerala = totaluri.reduce((a, b) => a + b, 0) / luni.length;
  }

  const m = document.getElementById('zilnicMediaRON');
  if (m) m.innerText = `RON ${fmt(mediaGenerala)}`;

  const labels = luni;
  const valori = luni.map(l => byMonth[l].total);

  if (chartZilnic) {
    chartZilnic.data.labels = labels;
    chartZilnic.data.datasets[0].data = valori;
    chartZilnic.update();
  }

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

  const s = document.getElementById('zilnicSummary');
  if (s) s.innerHTML = rez || 'Sumar';
}


function updateZilnicPie() {
  const rates = getRates();

  const byMonth = {};
  const totalAll = {};

  data_zilnic.tranzactii
    .filter(t => t.tip === 'supermarket')        // ✅ DOAR supermarket
    .forEach(t => {
      const key = t.luna;
      const val = (t.suma || 0) * ((rates[t.moneda] || 1));
      const sm = t.supermarket || 'Altele';

      if (!byMonth[key]) byMonth[key] = {};
      if (!byMonth[key][sm]) byMonth[key][sm] = 0;
      byMonth[key][sm] += val;

      if (!totalAll[sm]) totalAll[sm] = 0;
      totalAll[sm] += val;
    });

  const luniSortate = Object.keys(byMonth).sort();
  if (!luniSortate.length) {
    const t = document.getElementById('zilnicPieMonthTitle');
    if (t) t.innerText = 'Latest month distribution';

    if (chartZilnicPieMonth) { chartZilnicPieMonth.data.labels = []; chartZilnicPieMonth.data.datasets[0].data = []; chartZilnicPieMonth.update(); }
    if (chartZilnicPieAll)   { chartZilnicPieAll.data.labels = [];   chartZilnicPieAll.data.datasets[0].data = [];   chartZilnicPieAll.update(); }
    return;
  }

  const l = luniSortate[luniSortate.length - 1];
  const lunaFrumoasa = formatLunaAn(l);

  const titleEl = document.getElementById('zilnicPieMonthTitle');
  if (titleEl) titleEl.innerText = lunaFrumoasa;

  const dataMonth = byMonth[l] || {};
  const labelsM = Object.keys(dataMonth);
  const valuesM = labelsM.map(sm => dataMonth[sm]);

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

  const labelsA = Object.keys(totalAll);
  const valuesA = labelsA.map(sm => totalAll[sm]);

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


function formatLunaAn(luna) {
  const [year, month] = luna.split('-');
  return new Date(year, month - 1).toLocaleString('ro-RO', {
    month: 'long',
    year: 'numeric'
  });
}


function deleteAdminApa(luna,c1,c2,cf){
  const i=data_administratie.apa.findIndex(r=>r.luna===luna && r.contor1===c1 && r.contor2===c2 && Number(r.cost_factura||0)===Number(cf||0));
  if(i>-1) data_administratie.apa.splice(i,1);
  renderAdminApa();
}

function renderZilnicTable() {
  const tbody = document.querySelector('#zilnicTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const sorted = [...data_zilnic.tranzactii]
    .filter(t => t.tip === 'supermarket')   
    .sort((a, b) => a.luna.localeCompare(b.luna));

  let lastYear = null;

  sorted.forEach((t, i) => {
    const [year, month] = t.luna.split('-');
    if (year !== lastYear) {
      const sep = document.createElement('tr');
      sep.innerHTML = `<td colspan="4" 
          style="background:#f0f3f1; color:#333; font-weight:700;
                 text-align:center; border-top:2px solid #cfd6cf;">
        ${year}
      </td>`;
      tbody.appendChild(sep);
      lastYear = year;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatLunaAn(t.luna)}</td>
      <td>${t.supermarket}</td>
      <td contenteditable="true" onblur="updateZilnicSuma(${i}, this.innerText)">
        ${fmt(t.suma)}
      </td>
      <td><button class="deleteBtn" onclick="deleteZilnicTranzactie(${i})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}


function addZilnicTranzactie() {
  const luna = document.getElementById('zilnicLuna').value;
  const supermarket = document.getElementById('zilnicSupermarket').value;
  const suma = parseFloat(document.getElementById('zilnicSuma').value);

  if (!luna || isNaN(suma)) return alert('Completează luna și suma');

  data_zilnic.tranzactii.push({ 
    tip: 'supermarket',
    luna, 
    supermarket, 
    suma 
  });

  updateAll();
}

function updateZilnicSuma(index, newVal) {
  const cleaned = parseFloat(newVal.replace(',', '.'));
  if (!isNaN(cleaned)) {
    data_zilnic.tranzactii[index].suma = cleaned;
    updateAll();
  }
}

function deleteZilnicTranzactie(index) {
  data_zilnic.tranzactii.splice(index, 1);
  updateAll();
}


// === SIMPLE ROUTER — DYNAMIC PAGE LOAD ===
async function loadPage(page) {
  try{
   
    const res = await fetch(`${page}.html`);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    document.getElementById('content').innerHTML = html;
	
	if (page === 'zilnic') {
	  const carTip = document.getElementById('carTip');
	  if (carTip) {
		const rebind = () => {
		  const isFuel = carTip.value === 'benzina';
		  document.getElementById('carFuelFields').style.display = isFuel ? 'flex' : 'none';
		  document.getElementById('carAltFields').style.display  = isFuel ? 'none' : 'flex';
		  switchCarTable(isFuel ? 'fuel' : 'alt');
		};
		carTip.onchange = rebind;   
		rebind(); 
	  }
	}

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`btn${page.charAt(0).toUpperCase()+page.slice(1)}`);
    if (activeBtn) activeBtn.classList.add('active');

    currentPage = page;
    saveDataLocal();

    initChartsFor(page);

    setTimeout(enableColumnResize, 0);

    updateAll();
  }catch(e){
    console.error('Eroare la încărcarea paginii', page, e);
    document.getElementById('content').innerHTML = `<p style="color:#b91c1c;background:#fee2e2;padding:8px;border-radius:8px;">Eroare la încărcarea paginii <b>${page}.html</b>. </p>`;
  }
}

// === INIT CHARTS AFTER INJECTION ===
function initChartsFor(page){
  if(page==='lunar'){
    const ctxHome = document.getElementById('chartHomePie')?.getContext('2d');
    if (ctxHome) {
      if (chartHomePie) chartHomePie.destroy();
      chartHomePie = new Chart(ctxHome, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: { responsive: true, plugins: { legend: { display: false } },
          layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } } }
      });
    }

    const ctxAnual = document.getElementById('chartAnual')?.getContext('2d');
    if (ctxAnual) {
      if (chartAnual) chartAnual.destroy();
      chartAnual = new Chart(ctxAnual, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: { responsive: true, plugins: { legend: { display: false } },
          layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } } }
      });
    }
  }

  if(page==='utilitati'){
    const ctxUP=document.getElementById('chartUtilPlati')?.getContext('2d');
    if (ctxUP) {
      if (chartUtilPlati) chartUtilPlati.destroy();
      chartUtilPlati=new Chart(ctxUP,{type:'bar',data:{labels:[],datasets:[{label:'Plăți utilități (RON)',data:[],backgroundColor:'#2ecc71'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }

    const ctxUC=document.getElementById('chartUtilCurent')?.getContext('2d');
    if (ctxUC) {
      if (chartUtilCurent) chartUtilCurent.destroy();
      chartUtilCurent=new Chart(ctxUC,{type:'bar',data:{labels:[],datasets:[{label:'Consum curent (kWh)',data:[],backgroundColor:'#3498db'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }

    const ctxUG=document.getElementById('chartUtilGaz')?.getContext('2d');
    if (ctxUG) {
      if (chartUtilGaz) chartUtilGaz.destroy();
      chartUtilGaz=new Chart(ctxUG,{type:'bar',data:{labels:[],datasets:[{label:'Consum gaz (m³)',data:[],backgroundColor:'#e67e22'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }
  }

  if(page==='administratie'){
    const ctxAP=document.getElementById('chartAdminPlati')?.getContext('2d');
    if (ctxAP) {
      if (chartAdminPlati) chartAdminPlati.destroy();
      chartAdminPlati=new Chart(ctxAP,{type:'bar',data:{labels:[],datasets:[{label:'Plăți administrație (RON)',data:[],backgroundColor:'#9b59b6'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }

    const ctxAA=document.getElementById('chartAdminApa')?.getContext('2d');
    if (ctxAA) {
      if (chartAdminApa) chartAdminApa.destroy();
      chartAdminApa=new Chart(ctxAA,{type:'bar',data:{labels:[],datasets:[{label:'Consum apă (m³)',data:[],backgroundColor:'#1abc9c'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }

    // Set cost-per-m³ input from stored state
    const costInput=document.getElementById('adminCostPeMc');
    if (costInput) costInput.value = Number(data_administratie.cost_pe_mc||0);
  }
  
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
			  backgroundColor: 'rgba(39,193,122,0.5)',   // pastel green
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
					callback: function(value) {
					  const raw = this.chart.data.labels[value]; 
					  if (!raw) return '';
					  // Month label to full locale string:
					  return formatLunaAn(raw);
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
				formatter: (value) => `RON ${fmt(value)}`,  // Numeric data label
				font: { weight: 'bold' }
			  }
			},
			layout: {
			  padding: {
				top: 30, 
				bottom: 30
			  }
			}
		  },
		  plugins: [ChartDataLabels]  
		});
	  }
	  
	  const ctxCarBars = document.getElementById('chartCarBars')?.getContext('2d');
	  if (ctxCarBars) {
		if (window.chartCarBars && typeof window.chartCarBars.destroy === "function") {
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

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  loadDataLocal();

  // Nav buttons: attach events instead of inline onclick
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const page = btn.getAttribute('data-page');
    if (!page) return;
    btn.addEventListener('click', () => {
      loadPage(page);
    });
  });

  const btnRates = document.getElementById('applyRates');
  if (btnRates) btnRates.addEventListener('click', updateAll);

  const btnAutoRates = document.getElementById('autoRates');
  if (btnAutoRates) {
    btnAutoRates.addEventListener('click', async () => {
      await updateRatesFromBNR();
    });
  }

  let last = (localStorage.getItem('lastPage') || 'lunar').toLowerCase();
  if (!['lunar', 'utilitati', 'administratie', 'zilnic'].includes(last)) {
    last = 'lunar';
  }

  loadPage(last);
});

// === COLUMN RESIZE ===
function enableColumnResize() {
  document.querySelectorAll('.services-table').forEach((table, tableIndex) => {
    table.querySelectorAll('th').forEach((th, colIndex) => {
      if (th.querySelector('.col-resizer')) return;

      const resizer = document.createElement('div');
      resizer.classList.add('col-resizer');
      th.appendChild(resizer);

      const minW = parseInt(getComputedStyle(th).minWidth) || 60;

      const savedWidth = localStorage.getItem(`colWidth_${tableIndex}_${colIndex}`);
      if (savedWidth) th.style.width = savedWidth;

      let startX, startWidth;

      resizer.addEventListener('mousedown', function (e) {
        startX = e.pageX;
        startWidth = th.offsetWidth;
        document.documentElement.style.cursor = 'col-resize';

        function onMouseMove(e) {
          const newWidth = startWidth + (e.pageX - startX);
          if (newWidth >= minW) { 
            th.style.width = newWidth + 'px';
          }
        }

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

setTimeout(enableColumnResize, 500);

// === UTILS ===
function getRandomColor(){
  const r=Math.floor(Math.random()*120+80);
  const g=Math.floor(Math.random()*160+80);
  const b=Math.floor(Math.random()*140+100);
  return `rgb(${r},${g},${b})`;
}

// === ADMIN: APPLY WATER COST ===
function applyAdminCost(){
  const v=parseFloat(document.getElementById('adminCostPeMc').value);
  if (isNaN(v)) return;
  data_administratie.cost_pe_mc = v;
  renderAdminApa();
  saveDataLocal();
}

function switchZilnicTab(tab, event) {
	
  // save selected tab
  localStorage.setItem("zilnicTab", tab);
	
  // deactivate all buttons
  document.querySelectorAll(".zilnic-tab").forEach(btn => btn.classList.remove("active"));
  if (event?.target) event.target.classList.add("active");

  // hide all pages
  document.getElementById("pageSupermarket").style.display = "none";
  document.getElementById("pageCar").style.display = "none";
  document.getElementById("pageBarsTrips").style.display = "none";
  document.getElementById("pageWants").style.display = "none";

  const supForm   = document.querySelector('#zilnicSupermarket')?.closest('.formRow');
  const supCard   = document.getElementById('zilnicMediaRON')?.parentElement?.parentElement;
  const content   = document.getElementById("zilnicContent");
  const chart     = document.getElementById("chartZilnic");
  const summary   = document.getElementById("zilnicVizual");
  const pieCharts = document.querySelector(".zilnic-charts");

  const carForm   = document.getElementById('carForm');
  const carSwitch = document.getElementById('carSwitch');
  const carTables = document.getElementById('carTablesContainer');

  if (tab === 'supermarket') {
	
	// show selected
    pageSupermarket.style.display = 'block';
    pageCar.style.display         = 'none';
	pageBarsTrips.style.display   = 'none';
	pageWants.style.display       = 'none';

    if (content)   content.style.display   = "block";
    if (chart)     chart.style.display     = "block";
    if (summary)   summary.style.display   = "block";
    if (pieCharts) pieCharts.style.display = "flex";
    if (supCard)   supCard.style.display   = "block";
    if (supForm)   supForm.style.display   = "flex";

    if (carForm)   carForm.style.display   = "none";
    if (carSwitch) carSwitch.style.display = "none";
    if (carTables) carTables.style.display = "none";

    updateZilnicView?.();
    updateZilnicPie?.();
    return;
  } 

  if (tab === 'car') {
	
	// show selected
    pageSupermarket.style.display = 'none';
    pageCar.style.display         = 'block';
	pageBarsTrips.style.display   = 'none';
	pageWants.style.display       = 'none';

    if (content)   content.style.display   = "none";
    if (chart)     chart.style.display     = "none";
    if (summary)   summary.style.display   = "none";
    if (pieCharts) pieCharts.style.display = "none";
    if (supCard)   supCard.style.display   = "none";
    if (supForm)   supForm.style.display   = "none";

    if (carForm)   carForm.style.display   = "flex";
    if (carSwitch) carSwitch.style.display = "flex";
    if (carTables) carTables.style.display = "block";

    renderCarTables();
    updateCarTotals();
    updateCarSummary();
    updateCarLastOdometru();

    // rebind change after page exists
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
  }
  
  if (tab === 'BarsTrips') {
	 
	// show selected
    pageSupermarket.style.display = 'none';
    pageCar.style.display         = 'none';
	pageBarsTrips.style.display   = 'block';
	pageWants.style.display       = 'none';
	
    document.getElementById('pageBarsTrips').style.display = 'block';
    document.getElementById('pageWants').style.display = 'none';
    return;
  }

  if (tab === 'Wants') {
	
	// show selected
    pageSupermarket.style.display = 'none';
    pageCar.style.display         = 'none';
	pageBarsTrips.style.display   = 'none';
	pageWants.style.display       = 'block';
	
    document.getElementById('pageBarsTrips').style.display = 'none';
    document.getElementById('pageWants').style.display = 'block';
    return;
  }
}


function syncSupermarketMediaToLunar() {
  const el = document.getElementById('zilnicMediaRON');
  if (!el) return;

  let raw = el.innerText.replace("RON", "").trim();
  if (raw === "—" || raw === "" || raw === "-") return;
  raw = raw.replace(/\./g, "").replace(",", ".");
  
  const val = parseFloat(raw) || 0;

  let idx = data_lunar.servicii.findIndex(s => s.util_media_supermarket === true);

  if (idx === -1) {
    data_lunar.servicii.push({
      nume: "Media supermarket",
      cost: val,
      moneda: "RON",
      activ: true,
      util_media_supermarket: true
    });
  } else {
    data_lunar.servicii[idx].cost = val;
  }
}


// === ADD CAR TRANZACTIE ===
function addCarTranzactie() {
  const tip = document.getElementById('carTip').value;

  if (tip === 'benzina') {
    const data = document.getElementById('carData').value;
    const odo  = parseFloat(document.getElementById('carOdometru').value);
    const litri= parseFloat(document.getElementById('carLitri').value);
    const pret = parseFloat(document.getElementById('carPret').value);
    const fuel = document.getElementById('carFuelType').value;
    if (!data || isNaN(odo) || isNaN(litri) || isNaN(pret))
      return alert('Completează câmpurile pentru combustibil');

    const luna = data.slice(0,7);
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

  } else {
    const data = document.getElementById('carData2').value;
    const nume = document.getElementById('carDenumire').value;
    const cost = parseFloat(document.getElementById('carCost2').value);
    if (!data || !nume || isNaN(cost))
      return alert('Completează câmpurile pentru Service/Taxe');

    const luna = data.slice(0,7);
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
  updateCarSummary();
  updateCarLastOdometru();
}


var carDateEl = document.getElementById('carData');
if (carDateEl) carDateEl.addEventListener('change', function(){ updateCarSummary(); updateCarTotals(); });

function calcCarCost() {
  var litri = parseFloat(document.getElementById('carLitri').value) || 0;
  var pret  = parseFloat(document.getElementById('carPret').value) || 0;
  var out   = document.getElementById('carCost');
  if (out) out.value = (litri * pret).toFixed(2) + ' RON';
}
['carLitri','carPret'].forEach(function(id){
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', calcCarCost);
});

function switchCarTable(which){
  document.getElementById("carTabFuelBtn").classList.toggle("active", which === "fuel");
  document.getElementById("carTabServBtn").classList.toggle("active", which === "alt");

  const tblFuel = document.getElementById("carTableFuel");
  const tblAlt  = document.getElementById("carTableAlt");
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



function renderCarTables(){
  // Global sort by date (ascending)
  var items = data_car.tranzactii
  .sort((a,b)=>(a.data||'').localeCompare(b.data||''));

  // FUEL
  var tbodyF = document.querySelector('#carTableFuel tbody');
  if (tbodyF) {
    tbodyF.innerHTML = '';
    var prevFuel = null;
    var rowsForAvg = []; 

    items.filter(t => t.subt === 'fuel').forEach(t => {
      var deltaKm = (prevFuel && typeof t.odometru === 'number' && typeof prevFuel.odometru === 'number')
        ? (t.odometru - prevFuel.odometru) : 0;
      var pricePerKm = (deltaKm > 0) ? (t.suma / deltaKm) : null;

      // Row
      var tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.data || ''}</td>
        <td>${typeof t.odometru==='number' ? fmt(t.odometru) : ''}</td>
        <td>${t.fuelType || ''}</td>
        <td>${typeof t.litri==='number' ? fmt(t.litri) : ''}</td>
        <td>${typeof t.pret_litru==='number' ? fmt(t.pret_litru) : ''}</td>
        <td>${pricePerKm!=null ? (Number(pricePerKm).toFixed(2)) : '—'}</td>
        <td>RON ${fmt(t.suma || 0)}</td>
        <td><button class="deleteBtn" onclick="deleteCarItem(${t._id})">🗑️</button></td>
      `;
      tbodyF.appendChild(tr);

      prevFuel = t;
    });
  }

  // ALT (service/taxes)
  var tbodyA = document.querySelector('#carTableAlt tbody');
  if (tbodyA) {
    tbodyA.innerHTML = '';
    items.filter(t => t.subt === 'alt').forEach(t => {
      var tr = document.createElement('tr');
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

function deleteCarItem(id){
  var idx = data_car.tranzactii.findIndex(x => x._id === id);
  if (idx > -1) {
    data_car.tranzactii.splice(idx,1);
    saveDataLocal();
    renderCarTables();
    updateCarTotals();
    updateCarSummary();
  }
}

function updateCarSummary(){
  var currentMonth = '';
  var dateEl = document.getElementById('carData');
  if (dateEl && dateEl.value) currentMonth = dateEl.value.slice(0,7);

  var carItems = data_car.tranzactii
    .filter(t => t.tip === 'car')
    .sort((a,b) => (a.data||'').localeCompare(b.data||''));

  if (!currentMonth) {
    var last = carItems[carItems.length-1];
    if (last && last.luna) currentMonth = last.luna;
  }
  if (!currentMonth) {
    var el = document.getElementById('carSummaryText');
    if (el) el.innerHTML = '—';
    return;
  }

  // Monthly total
  var monthItems = carItems.filter(t => t.luna === currentMonth);
  var total = monthItems.reduce((s,t)=>s+(t.suma||0),0);

  // Breakdown: fuel vs other
  var totalFuel = monthItems.filter(t=>t.subt==='fuel').reduce((s,t)=>s+(t.suma||0),0);
  var totalAlt  = monthItems.filter(t=>t.subt==='alt' ).reduce((s,t)=>s+(t.suma||0),0);

  var fuelMonth = monthItems.filter(t=>t.subt==='fuel').sort((a,b)=>(a.data||'').localeCompare(b.data||''));
  var prev = null, prices = [];
  fuelMonth.forEach(t=>{
    var delta = (prev && typeof t.odometru==='number' && typeof prev.odometru==='number')
      ? (t.odometru - prev.odometru) : 0;
    if (delta > 0 && (t.suma||0) > 0) {
      prices.push((t.suma / delta));
    }
    prev = t;
  });
  var avg = prices.length ? (prices.reduce((a,b)=>a+b,0) / prices.length) : 0;

  var txt = `
	<span class="month">${formatLunaAn(currentMonth)}</span>: 
	<span class="total">RON ${fmt(total)}</span>
	<span class="meta">Consum mediu: <b>${avg ? avg.toFixed(2) : '—'}</b> lei/km</span>
	<span class="break">Combustibil: RON ${fmt(totalFuel)} • Service & taxe: RON ${fmt(totalAlt)}</span>
  `;
	
	document.getElementById('carSummaryText').innerHTML = txt;
	
  var el = document.getElementById('carSummaryText');
  if (el) el.innerHTML = txt;

  var card = document.getElementById('carMediaRON');
  if (card) card.innerText = `RON ${fmt(total)}`;
  
  // Update Car bar chart (monthly sum trend)
	if (window.chartCarBars) {
	  const months = [...new Set(data_car.tranzactii.map(t => t.luna))].sort();
	  const sums = months.map(m => 
		data_car.tranzactii
		  .filter(t => t.luna === m)
		  .reduce((s,t)=>s+(t.suma||0),0)
	  );

	  window.chartCarBars.data.labels = months.map(formatLunaAn);
	  window.chartCarBars.data.datasets[0].data = sums;
	  window.chartCarBars.update();
	}
}

function updateCarTotals() {
  const currentMonth = (document.getElementById('carData').value || '').slice(0, 7);
  if (!currentMonth) return;

  const total = data_car.tranzactii
    .filter(t => t.tip === 'car' && t.luna === currentMonth)
    .reduce((sum, t) => sum + (t.suma || 0), 0);

  const el = document.getElementById('carMediaRON');
  if (el) el.innerText = `RON ${fmt(total)}`;
}

function calcCarCost() {
  const litri = parseFloat(document.getElementById('carLitri').value) || 0;
  const pret = parseFloat(document.getElementById('carPret').value) || 0;
  document.getElementById('carCost').value = (litri * pret).toFixed(2) + ' RON';
}

function updateCarLastOdometru() {
  const last = localStorage.getItem('lastCarOdo');
  const odoInput = document.getElementById('carOdometru');
  const span = document.getElementById('carLastOdo');

  if (!odoInput || !span) return;

  if (last) {
    odoInput.placeholder = `Odometru. înainte: ${last}`;
  } else {
    odoInput.placeholder = "Odometru";
  }
}

function syncCarMediaToLunar() {
  const el = document.getElementById('carMediaRON');
  if (!el) return;

  const raw = el.innerText.replace(/[^\d,.-]/g, "").replace(",", ".");
  const val = parseFloat(raw) || 0;

  let idx = data_lunar.servicii.findIndex(s => s.util_media_car === true);

  if (idx === -1) {
    data_lunar.servicii.push({
      nume: "Media Car",
      cost: val,
      moneda: "RON",
      activ: true,
      util_media_car: true
    });
  } else {
    data_lunar.servicii[idx].cost = val;
  }
}


function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.addEventListener('scroll', e => {
  const container = document.querySelector('#zilnicTableContainer');
  if (!container) return;
  if (container.scrollTop > 5) container.classList.add('scrolled');
  else container.classList.remove('scrolled');
}, true);


// === ZOOM functions === 

let zoomLevel = 1;

function applyZoom() {
  document.getElementById('zoomWrapper').style.transform = `scale(${zoomLevel})`;
}

// Ctrl + scroll → zoom page
window.addEventListener('wheel', function (e) {
  if (!e.ctrlKey) return; // do nothing unless CTRL pressed

  e.preventDefault(); // stop default browser zoom
  if (e.deltaY < 0) {
    zoomLevel += 0.05; // scroll up -> zoom in
  } else {
    zoomLevel -= 0.05; // scroll down -> zoom out
    zoomLevel = Math.max(0.5, zoomLevel);
  }
  applyZoom();
}, { passive: false });

// Ctrl + 0 -> reset zoom
window.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === '0') {
    zoomLevel = 1;
    applyZoom();
    e.preventDefault();
  }
});

// === EXPOSE ===
window.loadPage=loadPage;

window.addItem=addItem;
window.addCategory=addCategory;
window.toggleService=toggleService;
window.deleteItem=deleteItem;
window.updateNote=updateNote;
window.updateCost=updateCost;
window.updateMoneda=updateMoneda;
window.deleteCategory=deleteCategory;

window.addUtilPlata=addUtilPlata;
window.deleteUtilPlata=deleteUtilPlata;
window.addUtilCurent=addUtilCurent;
window.deleteUtilCurent=deleteUtilCurent;
window.addUtilGaz=addUtilGaz;
window.deleteUtilGaz=deleteUtilGaz;

window.addAdminPlata=addAdminPlata;
window.deleteAdminPlata=deleteAdminPlata;
window.addAdminApa=addAdminApa;
window.deleteAdminApa=deleteAdminApa;
window.applyAdminCost=applyAdminCost;

window.switchZilnicTab = switchZilnicTab;
