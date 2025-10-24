// === DATE PREDEFINITE ===
let data_lunar = {
  servicii: [
    {categorie:true, nume:'Servicii online'},
    {nume:'Google Drive', cost:10, moneda:'RON', activ:true, note:''},
    {nume:'Youtube Premium', cost:29, moneda:'RON', activ:true, note:''},
    {nume:'Amazon Prime', cost:20, moneda:'RON', activ:true, note:''},
    {nume:'Spotify', cost:24, moneda:'RON', activ:true, note:''},
    {nume:'Netflix', cost:56, moneda:'RON', activ:true, note:''},
    {nume:'Disney Plus', cost:45, moneda:'RON', activ:true, note:''},
    {nume:'HBO Max', cost:15, moneda:'RON', activ:true, note:''},
    {nume:'GeoGuesser', cost:15, moneda:'RON', activ:true, note:''},
    {nume:'Audiable', cost:48, moneda:'RON', activ:true, note:''},
    {nume:'Microsoft', cost:48, moneda:'RON', activ:true, note:''},

    {categorie:true, nume:'Utilitati'},
    {nume:'Internet si TV', cost:66, moneda:'RON', activ:true, note:''},
    {nume:'Administratie', cost:100, moneda:'RON', activ:true, note:''}
  ]
};

let data_anual = {
  servicii: [
    {categorie:true, nume:'Exemplu categorii'},
    {nume:'Bitdefender', cost:330, moneda:'RON', activ:true, note:''},
    {nume:'Exemplu', cost:100, moneda:'RON', activ:true, note:''}
  ]
};

// === DATE UTILITATI ===
let data_utilitati = {
  plati: [],
  citiri_curent: [],
  citiri_gaz: []
};

// === DATE ADMINISTRATIE ===
let data_administratie = {
  plati: [],                   // {luna, suma, moneda}
  apa: [],                     // {luna, contor1, contor2, cost_factura}
  cost_pe_mc: 10               // lei / m³ (global pentru calcule)
};

// === VARIABILE GLOBALE ===
let chartHomePie, chartAnual;
let chartUtilPlati, chartUtilCurent, chartUtilGaz;
let chartAdminPlati, chartAdminApa;
let sortableHome = null, sortableAnual = null;

// === STORAGE ===
function saveDataLocal(){
  localStorage.setItem('data_lunar', JSON.stringify(data_lunar));
  localStorage.setItem('data_anual', JSON.stringify(data_anual));
  localStorage.setItem('data_utilitati', JSON.stringify(data_utilitati));
  localStorage.setItem('data_administratie', JSON.stringify(data_administratie));
  localStorage.setItem('lastPage', currentPage);
}

function loadDataLocal(){
  try {
    const dl = localStorage.getItem('data_lunar');
    const da = localStorage.getItem('data_anual');
    const du = localStorage.getItem('data_utilitati');
    const dadmin = localStorage.getItem('data_administratie');

    if(dl) data_lunar = JSON.parse(dl);
    if(da) data_anual = JSON.parse(da);
    if(du) data_utilitati = JSON.parse(du);
    if(dadmin) data_administratie = JSON.parse(dadmin);

    if(!data_utilitati.plati) data_utilitati.plati = [];
    if(!data_utilitati.citiri_curent && data_utilitati.citiri)
      data_utilitati.citiri_curent = data_utilitati.citiri;
    if(!data_utilitati.citiri_gaz) data_utilitati.citiri_gaz = [];
    delete data_utilitati.citiri;

    if(!data_administratie.plati) data_administratie.plati = [];
    if(!data_administratie.apa) data_administratie.apa = [];
    if(typeof data_administratie.cost_pe_mc !== 'number') data_administratie.cost_pe_mc = 10;
  } catch(e){
    console.warn('Resetare localStorage (date invalide)', e);
    localStorage.clear();
  }
}

// === FORMAT ===
function fmt(n){
  return Number(n || 0).toLocaleString('ro-RO', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

// === CURS VALUTAR ===
function getRates(){
  const eur = parseFloat(document.getElementById('rateEUR')?.value) || 0;
  const usd = parseFloat(document.getElementById('rateUSD')?.value) || 0;
  return { EUR: eur, USD: usd, RON: 1 };
}

// === HELPER ===
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

// === CRUD LUNAR/ANUAL ===
function addItem(type){
  const name = document.getElementById(type==='lunar'?'newServiceName':'newServiceNameAnual').value.trim();
  const cost = parseFloat(document.getElementById(type==='lunar'?'newServiceCost':'newServiceCostAnual').value);
  const moneda = document.getElementById(type==='lunar'?'newServiceCurrency':'newServiceCurrencyAnual').value;
  if(!name || isNaN(cost)) return alert('Completează nume și cost!');
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
  if(arr[i].util_media || arr[i].util_admin) return alert('Această linie e automată!');
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

// === ACTUALIZARE AUTOMATĂ CURS BNR ===
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

    if (!eur || !usd) throw new Error('Cursuri lipsă în XML');

    document.getElementById('rateEUR').value = eur.toFixed(4);
    document.getElementById('rateUSD').value = usd.toFixed(4);
    console.log(`BNR exchange rates updated: EUR ${eur} / USD ${usd}`);

  } catch (e) {
    console.warn('Error fetching BNR exchange rates — using default values.', e);
    // Fallback valori default
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
    const dis=(s.util_media||s.util_admin)?'disabled':'';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td style="text-align:left">${s.nume}${s.util_media?' <span style="color:#6b7280">(auto)</span>':''}${s.util_admin?' <span style="color:#6b7280">(Admin)</span>':''}</td>
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

  if(type==='lunar' && !sortableHome)
    sortableHome=new Sortable(tbody,{handle:'.dragHandle',animation:150,onEnd:e=>{
      const arr=data_lunar.servicii;arr.splice(e.newIndex,0,arr.splice(e.oldIndex,1)[0]);updateAll();
    }});
  if(type==='anual' && !sortableAnual)
    sortableAnual=new Sortable(tbody,{handle:'.dragHandle',animation:150,onEnd:e=>{
      const arr=data_anual.servicii;arr.splice(e.newIndex,0,arr.splice(e.oldIndex,1)[0]);updateAll();
    }});

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
  // ---
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

// === UTILITATI ===
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
  } else data_lunar.servicii[idx].cost=media;
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
  if(!luna||isNaN(suma)) return alert('Completează luna și suma!');
  data_utilitati.plati.push({luna,suma,moneda});
  syncUtilitatiMediaToLunar();
  updateAll();
}
function deleteUtilPlata(luna,suma,moneda){
  const i=data_utilitati.plati.findIndex(p=>p.luna===luna&&Number(p.suma)===Number(suma)&&p.moneda===moneda);
  if(i>-1) data_utilitati.plati.splice(i,1);
  syncUtilitatiMediaToLunar(); updateAll();
}

// === CITIRI CURENT ===
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
  if(!luna||isNaN(val)) return alert('Completează luna și valoarea!');
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

// === CITIRI GAZ ===
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
  if(!luna||isNaN(val)) return alert('Completează luna și valoarea!');
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

// === ADMINISTRAȚIE: SYNC CU LUNAR ===
function syncAdministratieToLunar(){
  // folosim ULTIMA plată (după lună) și o scriem ca RON în linia „Administratie” (auto)
  if (!data_administratie.plati.length) {
    // dacă nu există plăți, menținem linia (dacă există) dar cost 0
  }
  const rates=getRates();
  const sorted=[...data_administratie.plati].sort((a,b)=>a.luna.localeCompare(b.luna));
  const last=sorted[sorted.length-1];
  const ron = last ? (last.suma || 0) * (rates[last.moneda] || 1) : 0;

  let idx=data_lunar.servicii.findIndex(s=>s.util_admin);
  if(idx===-1){
    // căutăm categoria „Utilitati”
    let pos=data_lunar.servicii.findIndex(s=>s.categorie&&s.nume.toLowerCase().includes('utilitati'));
    if(pos===-1) pos=data_lunar.servicii.length;
    data_lunar.servicii.splice(pos+1,0,{nume:'Administratie',cost:ron,moneda:'RON',activ:true,util_admin:true, note:''});
  } else {
    data_lunar.servicii[idx].cost = ron;
    data_lunar.servicii[idx].moneda = 'RON';
    data_lunar.servicii[idx].activ = true;
  }
}

// === ADMINISTRAȚIE: PLĂȚI ===
function renderAdminPlati(){
  const tbody=document.querySelector('#tableAdminPlati tbody');
  if (!tbody) return;
  tbody.innerHTML='';
  const rates=getRates();
  const items=[...data_administratie.plati].sort((a,b)=>a.luna.localeCompare(b.luna));
  items.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.luna}</td><td>${fmt(p.suma)}</td><td>${p.moneda}</td>
      <td><button class='deleteBtn' onclick=\"deleteAdminPlata('${p.luna}',${p.suma},'${p.moneda}')\">🗑️</button></td>`;
    tbody.appendChild(tr);
  });

  // chart in RON
  if (chartAdminPlati) {
    chartAdminPlati.data.labels = items.map(p=>p.luna);
    chartAdminPlati.data.datasets[0].data = items.map(p=>(p.suma||0)*(rates[p.moneda]||1));
    chartAdminPlati.update();
  }
  saveDataLocal();
}

function updateAdminCostFactura(luna, val) {
  const valNum = parseFloat(val.replace(',', '.')) || 0;
  const item = data_administratie.apa.find(r => r.luna === luna);
  if (item) item.cost_factura = valNum;
  saveDataLocal();
  renderAdminApa(); // reface tabelul frumos formatat
}

function addAdminApa() {
  const luna = document.getElementById('adminApaLuna').value;
  const c1 = parseFloat(document.getElementById('adminApaContor1').value);
  const c2 = parseFloat(document.getElementById('adminApaContor2').value);

  if (!luna || isNaN(c1) || isNaN(c2)) {
    return alert('Completează luna și contoarele!');
  }

  const existingIndex = data_administratie.apa.findIndex(x => x.luna === luna);

  if (existingIndex > -1) {
    // actualizează valori pentru luna existentă, păstrând cost_factura
    data_administratie.apa[existingIndex].contor1 = c1;
    data_administratie.apa[existingIndex].contor2 = c2;
  } else {
    // adaugă nouă înregistrare cu cost_factura = 0 (va fi editat în tabel)
    data_administratie.apa.push({
      luna,
      contor1: c1,
      contor2: c2,
      cost_factura: 0
    });
  }

  renderAdminApa(); // reafișează tabelul
  saveDataLocal();  // salvează
}

function deleteAdminPlata(luna,suma,moneda){
  const i=data_administratie.plati.findIndex(p=>p.luna===luna&&Number(p.suma)===Number(suma)&&p.moneda===moneda);
  if(i>-1) data_administratie.plati.splice(i,1);
  syncAdministratieToLunar();
  updateAll();
}

// === ADMINISTRAȚIE: APĂ ===
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
      <td><button class='deleteBtn' onclick=\"deleteAdminApa('${row.luna}',${row.contor1},${row.contor2},${row.cost_factura||0})\">🗑️</button></td>
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

function deleteAdminApa(luna,c1,c2,cf){
  const i=data_administratie.apa.findIndex(r=>r.luna===luna && r.contor1===c1 && r.contor2===c2 && Number(r.cost_factura||0)===Number(cf||0));
  if(i>-1) data_administratie.apa.splice(i,1);
  renderAdminApa();
}

// === UPDATE ALL ===
function updateAll(){
  syncUtilitatiMediaToLunar();
  syncAdministratieToLunar();

  renderTable('lunar');
  renderTable('anual');
  updateTotalsUI();

  renderUtilPlati();
  renderUtilCurent();
  renderUtilGaz();

  renderAdminPlati();
  renderAdminApa();

  saveDataLocal();
}

// === NAVIGAȚIE ===
let currentPage = 'lunar';
function showPage(page){
  currentPage = page;
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  document.getElementById(page).style.display='block';

  // toggle activ doar pe butoanele existente
  document.getElementById('btnLunar')?.classList.remove('active');
  document.getElementById('btnUtilitati')?.classList.remove('active');
  document.getElementById('btnAdministratie')?.classList.remove('active');
  if (page === 'lunar') document.getElementById('btnLunar')?.classList.add('active');
  if (page === 'utilitati') document.getElementById('btnUtilitati')?.classList.add('active');
  if (page === 'administratie') document.getElementById('btnAdministratie')?.classList.add('active');

  // Inițializează graficele numai când e vizibilă pagina
  if (page === 'utilitati') {
    if (!chartUtilPlati) {
      const ctxUP=document.getElementById('chartUtilPlati').getContext('2d');
      chartUtilPlati=new Chart(ctxUP,{type:'bar',data:{labels:[],datasets:[{label:'Plăți utilități (RON)',data:[],backgroundColor:'#2ecc71'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }
    if (!chartUtilCurent) {
      const ctxUC=document.getElementById('chartUtilCurent').getContext('2d');
      chartUtilCurent=new Chart(ctxUC,{type:'bar',data:{labels:[],datasets:[{label:'Consum curent (kWh)',data:[],backgroundColor:'#3498db'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }
    if (!chartUtilGaz) {
      const ctxUG=document.getElementById('chartUtilGaz').getContext('2d');
      chartUtilGaz=new Chart(ctxUG,{type:'bar',data:{labels:[],datasets:[{label:'Consum gaz (m³)',data:[],backgroundColor:'#e67e22'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }
  }

  if (page === 'administratie') {
    if (!chartAdminPlati) {
      const ctxAP=document.getElementById('chartAdminPlati').getContext('2d');
      chartAdminPlati=new Chart(ctxAP,{type:'bar',data:{labels:[],datasets:[{label:'Plăți administrație (RON)',data:[],backgroundColor:'#9b59b6'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }
    if (!chartAdminApa) {
      const ctxAA=document.getElementById('chartAdminApa').getContext('2d');
      chartAdminApa=new Chart(ctxAA,{type:'bar',data:{labels:[],datasets:[{label:'Consum apă (m³)',data:[],backgroundColor:'#1abc9c'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});
    }
    // setează inputul de cost pe m³ din stoc
    const costInput=document.getElementById('adminCostPeMc');
    if (costInput) costInput.value = Number(data_administratie.cost_pe_mc||0);
  }

  saveDataLocal();
  updateAll();

  if (page === 'utilitati') {
    chartUtilPlati?.update();
    chartUtilCurent?.update();
    chartUtilGaz?.update();
  }
  if (page === 'administratie') {
    chartAdminPlati?.update();
    chartAdminApa?.update();
  }
}

// === INIT ===
document.addEventListener('DOMContentLoaded', ()=>{
  loadDataLocal();
  updateRatesFromBNR();
  currentPage = localStorage.getItem('lastPage') || 'lunar';
  if (currentPage === 'anual') currentPage = 'lunar'; // fallback

  // === GRAFIC LUNAR ===
  const ctxHome = document.getElementById('chartHomePie').getContext('2d');
  chartHomePie = new Chart(ctxHome, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
    }
  });

  // === GRAFIC ANUAL ===
  const ctxAnual = document.getElementById('chartAnual').getContext('2d');
  chartAnual = new Chart(ctxAnual, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
    }
  });

  // === BUTOANE CURS VALUTAR ===
  const btnRates = document.getElementById('applyRates');
  if (btnRates) btnRates.addEventListener('click', updateAll);

  const btnAutoRates = document.getElementById('autoRates');
  if (btnAutoRates) {
    btnAutoRates.addEventListener('click', async ()=>{
      await updateRatesFromBNR();
    });
  }

  // === PORNIRE PAGINĂ ===
  showPage(currentPage);
});

// === COLUMN RESIZE ===
function enableColumnResize() {
  document.querySelectorAll('.services-table').forEach((table, tableIndex) => {
    table.querySelectorAll('th').forEach((th, colIndex) => {

      if (th.querySelector('.col-resizer')) return;

      const resizer = document.createElement('div');
      resizer.classList.add('col-resizer');
      th.appendChild(resizer);

      // Check Localstorage size
      const savedWidth = localStorage.getItem(`colWidth_${tableIndex}_${colIndex}`);
      if (savedWidth) th.style.width = savedWidth;

      let startX, startWidth;

      resizer.addEventListener('mousedown', function (e) {
        startX = e.pageX;
        startWidth = th.offsetWidth;
        document.documentElement.style.cursor = 'col-resize';

        function onMouseMove(e) {
          const newWidth = startWidth + (e.pageX - startX);
          th.style.width = newWidth + 'px';
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

// Wait for table resizing
setTimeout(enableColumnResize, 500);

// === UTILS ===
function getRandomColor(){
  const r=Math.floor(Math.random()*120+80);
  const g=Math.floor(Math.random()*160+80);
  const b=Math.floor(Math.random()*140+100);
  return `rgb(${r},${g},${b})`;
}

// === ADMIN COST APPLY ===
function applyAdminCost(){
  const v=parseFloat(document.getElementById('adminCostPeMc').value);
  if (isNaN(v)) return;
  data_administratie.cost_pe_mc = v;
  renderAdminApa();
  saveDataLocal();
}

// === EXPOSE ===
window.showPage=showPage;
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
