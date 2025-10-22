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

// === VARIABILE GLOBALE ===
let chartHomePie, chartAnual;
let chartUtilPlati, chartUtilCurent, chartUtilGaz;
let sortableHome = null, sortableAnual = null;

// === STORAGE ===
function saveDataLocal(){
  localStorage.setItem('data_lunar', JSON.stringify(data_lunar));
  localStorage.setItem('data_anual', JSON.stringify(data_anual));
  localStorage.setItem('data_utilitati', JSON.stringify(data_utilitati));
  localStorage.setItem('lastPage', currentPage);
}
function loadDataLocal(){
  try {
    const dl = localStorage.getItem('data_lunar');
    const da = localStorage.getItem('data_anual');
    const du = localStorage.getItem('data_utilitati');

    if(dl) data_lunar = JSON.parse(dl);
    if(da) data_anual = JSON.parse(da);
    if(du) data_utilitati = JSON.parse(du);

    if(!data_utilitati.plati) data_utilitati.plati = [];
    if(!data_utilitati.citiri_curent && data_utilitati.citiri)
      data_utilitati.citiri_curent = data_utilitati.citiri;
    if(!data_utilitati.citiri_gaz) data_utilitati.citiri_gaz = [];
    delete data_utilitati.citiri;
  } catch(e){
    console.warn("Resetare localStorage (date invalide)", e);
    localStorage.clear();
  }
}

// === FORMAT ===
function fmt(n){
  return Number(n || 0).toLocaleString('ro-RO', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

// === CURS VALUTAR ===
function getRates(){
  const eur = parseFloat(document.getElementById('rateEUR').value) || 0;
  const usd = parseFloat(document.getElementById('rateUSD').value) || 0;
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
  if(!name || isNaN(cost)) return alert("Completează nume și cost!");
  getDataFor(type).servicii.push({nume:name, cost:cost, moneda:moneda, activ:true, note:''});
  updateAll();
}
function addCategory(type){
  const name = document.getElementById(type==='lunar'?'newCategoryName':'newCategoryNameAnual').value.trim();
  if(!name) return alert("Completează numele!");
  getDataFor(type).servicii.push({categorie:true, nume:name});
  updateAll();
}
function toggleService(type,i){
  const arr = getDataFor(type).servicii;
  if(arr[i].util_media) return;
  arr[i].activ=!arr[i].activ;
  updateAll();
}
function deleteItem(type,i){
  const arr = getDataFor(type).servicii;
  if(arr[i].util_media) return alert("Această linie e automată!");
  arr.splice(i,1);
  updateAll();
}
function updateNote(type,i,v){ getDataFor(type).servicii[i].note=v; saveDataLocal(); }
function updateCost(type,i,v){ if(!getDataFor(type).servicii[i].util_media){ getDataFor(type).servicii[i].cost=parseFloat(v)||0; updateAll(); }}
function updateMoneda(type,i,v){ if(!getDataFor(type).servicii[i].util_media){ getDataFor(type).servicii[i].moneda=v; updateAll(); }}
function deleteCategory(type,i){ getDataFor(type).servicii.splice(i,1); updateAll(); }

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
    const dis=s.util_media?'disabled':'';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td style="text-align:left">${s.nume}${s.util_media?' <span style="color:#6b7280">(auto)</span>':''}</td>
      <td><input type="number" ${dis} value="${s.cost||0}" onchange="updateCost('${type}',${i},this.value)"></td>
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

  // --- UPDATE CHART (pie pentru lunar/anual; culori random DOAR la pie)
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
  document.getElementById('totalsPerCurrencyLunar').innerText=formatPerCurrencyString(tL.sums);
  document.getElementById('totalsPerCurrencyAnual').innerText=formatPerCurrencyString(tA.sums);
  document.getElementById('totalAnual').innerText=`RON ${fmt(tA.totalRON)}`;
  document.getElementById('totalAnualHome').innerText=`RON ${fmt(tA.totalRON)}`;
  const oblig=(tL.totalRON||0)+(tA.totalRON||0)/12;
  document.getElementById('obligatiiLunare').innerText=`RON ${fmt(oblig)}`;
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
  tbody.innerHTML='';
  const items=[...data_utilitati.plati].sort((a,b)=>a.luna.localeCompare(b.luna));
  items.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.luna}</td><td>${fmt(p.suma)}</td><td>${p.moneda}</td>
      <td><button class="deleteBtn" onclick="deleteUtilPlata('${p.luna}',${p.suma},'${p.moneda}')">🗑️</button></td>`;
    tbody.appendChild(tr);
  });
  const media=computeUtilitatiMediaRON();
  document.getElementById('utilitatiMediaRON').innerText=`RON ${fmt(media)}`;
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
  tb.innerHTML='';
  const items=[...data_utilitati.citiri_curent].sort((a,b)=>a.luna.localeCompare(b.luna));
  let prev=null, labels=[], diffs=[];
  items.forEach(c=>{
    const diff=prev?(c.valoare-prev.valoare):0;
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
  tb.innerHTML='';
  const items=[...data_utilitati.citiri_gaz].sort((a,b)=>a.luna.localeCompare(b.luna));
  let prev=null, labels=[], diffs=[];
  items.forEach(c=>{
    const diff=prev?(c.valoare-prev.valoare):0;
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

// === UPDATE ALL ===
function updateAll(){
  syncUtilitatiMediaToLunar();
  renderTable('lunar');
  renderTable('anual');
  updateTotalsUI();
  renderUtilPlati();
  renderUtilCurent();
  renderUtilGaz();
  saveDataLocal();
}

// === NAVIGAȚIE ===
let currentPage = 'lunar';
function showPage(page){
  currentPage = page;
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  document.getElementById(page).style.display='block';
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(page==='lunar'?'btnLunar':page==='anual'?'btnAnual':'btnUtilitati').classList.add('active');

	if (page === 'anual') {
		if (!chartAnual) {
			const ctxAnual = document.getElementById('chartAnual').getContext('2d');
			chartAnual = new Chart(ctxAnual, {
				type:'pie',
				data:{labels:[],datasets:[{data:[],backgroundColor:[]}]},
				options:{ responsive:true}
			});
		}
	}

	
	
  // Inițializăm graficele din Utilități DOAR când pagina devine vizibilă
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

  saveDataLocal();
  updateAll();
  
  if (page === 'anual') {
		chartAnual.update();
  }
	
  // Asigură re-redesenare după ce canvas-ul devine vizibil
  if (page === 'utilitati') {
    chartUtilPlati?.update();
    chartUtilCurent?.update();
    chartUtilGaz?.update();
  }
}

// === INIT ===
document.addEventListener('DOMContentLoaded', ()=>{
  loadDataLocal();
  currentPage = localStorage.getItem('lastPage') || 'lunar';

  const ctxHome=document.getElementById('chartHomePie').getContext('2d');
  chartHomePie=new Chart(ctxHome,{
	  type:'pie',
	  data:{labels:[],datasets:[{data:[],backgroundColor:[]}]},
	  options:{
		  responsive:true
	  }
	});

  // butonul „Actualizează cursuri” să refacă toate calculele
  const btnRates = document.getElementById('applyRates');
  if (btnRates) btnRates.addEventListener('click', updateAll);

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
