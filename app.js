// --- Date predefinite ---
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

// --- Chart-uri ---
let chartHomePie, chartAnual;

// --- Salvare în localStorage ---
function saveDataLocal(){
  localStorage.setItem('data_lunar', JSON.stringify(data_lunar));
  localStorage.setItem('data_anual', JSON.stringify(data_anual));
}

// --- Navigare pagini ---
function showPage(page){
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  document.getElementById(page).style.display='block';
  if(page==='lunar') updateHome();
  else if(page==='anual') updateAnual();
}

// --- Funcții Home (Lunar) ---
function addNewServiceHome(){
  const name = document.getElementById('newServiceName').value;
  const cost = parseFloat(document.getElementById('newServiceCost').value);
  if(!name || isNaN(cost)) return alert("Completează nume și cost!");
  data_lunar.servicii.push({nume:name,cost:cost,moneda:'RON',activ:true,note:''});
  updateHome();
}
function addCategoryHome(){
  const name = document.getElementById('newCategoryName').value;
  if(!name) return alert("Completează numele categoriei!");
  data_lunar.servicii.push({categorie:true, nume:name});
  updateHome();
}
function toggleServiceHome(i){ data_lunar.servicii[i].activ=!data_lunar.servicii[i].activ; updateHome(); }
function deleteServiceHome(i){ data_lunar.servicii.splice(i,1); updateHome(); }
function updateNoteHome(i,v){ data_lunar.servicii[i].note=v; updateHome(); }
function updateCostHome(i,v){ data_lunar.servicii[i].cost=parseFloat(v)||0; updateHome(); }
function updateMonedaHome(i,v){ data_lunar.servicii[i].moneda=v; updateHome(); }
function deleteCategoryHome(i){ 
  if(confirm("Sigur vrei să ștergi această categorie?")) {
    data_lunar.servicii.splice(i,1); 
    updateHome(); 
  }
}
function calcTotalLunar(){ return data_lunar.servicii.filter(s=>s.activ && !s.categorie).reduce((a,b)=>a+b.cost,0); }

function updateHome(){
  const tbody=document.querySelector("#tableServiciiHome tbody");
  tbody.innerHTML='';
  const total=calcTotalLunar();
  document.getElementById('totalLunarHome').innerText=total;

  data_lunar.servicii.forEach((s,i)=>{
    if(s.categorie){
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td colspan="8" style="font-weight:bold; text-align:center; background:#f2f2f2;">
          ${s.nume} <button class="dragHandle">≡</button> 
          <button class="deleteBtn" onclick="deleteCategoryHome(${i})">🗑️</button>
        </td>`;
      tbody.appendChild(tr);
    } else {
      const percent = (!s.activ) ? '0%' : (total ? ((s.cost/total)*100).toFixed(1)+'%' : '-');
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${s.nume}</td>
        <td><input type="number" value="${s.cost}" onchange="updateCostHome(${i}, this.value)"></td>
        <td>
          <select onchange="updateMonedaHome(${i}, this.value)">
            <option ${s.moneda==='RON'?'selected':''}>RON</option>
            <option ${s.moneda==='EUR'?'selected':''}>EUR</option>
            <option ${s.moneda==='USD'?'selected':''}>USD</option>
          </select>
        </td>
        <td>${percent}</td>
        <td><textarea class="noteInput" onchange="updateNoteHome(${i}, this.value)">${s.note}</textarea></td>
        <td><button class="switchBtn ${s.activ?'active':'inactive'}" onclick="toggleServiceHome(${i})">${s.activ?'On':'Off'}</button></td>
        <td class="dragHandle">≡</td>
        <td><button class="deleteBtn" onclick="deleteServiceHome(${i})">🗑️</button></td>`;
      tbody.appendChild(tr);
    }
	
	const totalLunar = calcTotalLunar();
	const totalAnual = data_anual.servicii.filter(s=>s.activ && !s.categorie)
										  .reduce((a,b)=>a+b.cost,0);
	document.getElementById('totalLunarHome').innerText = totalLunar;
	document.getElementById('totalAnualHome').innerText = totalAnual;
	document.getElementById('obligatiiLunare').innerText = (totalLunar + totalAnual/12).toFixed(2);
  });

  // Pie chart
  if(chartHomePie){
    chartHomePie.data.labels = data_lunar.servicii.filter(s=>!s.categorie).map(s=>s.nume);
    chartHomePie.data.datasets[0].data = data_lunar.servicii.filter(s=>!s.categorie).map(s=>s.activ?s.cost:0);
    chartHomePie.update();
  }

  saveDataLocal();

  // Drag & drop cu salvare ordine
  new Sortable(tbody,{handle:'.dragHandle',animation:150,onEnd:function(evt){
    const oldIndex=evt.oldIndex;
    const newIndex=evt.newIndex;
    data_lunar.servicii.splice(newIndex,0,data_lunar.servicii.splice(oldIndex,1)[0]);
    updateHome();
  }});
}

// --- Funcții Anual ---
function addNewServiceAnual(){
  const name = document.getElementById('newServiceNameAnual').value;
  const cost = parseFloat(document.getElementById('newServiceCostAnual').value);
  if(!name || isNaN(cost)) return alert("Completează nume și cost!");
  data_anual.servicii.push({nume:name,cost:cost,moneda:'RON',activ:true,note:''});
  updateAnual();
}
function addCategoryAnual(){
  const name = document.getElementById('newCategoryNameAnual').value;
  if(!name) return alert("Completează numele categoriei!");
  data_anual.servicii.push({categorie:true, nume:name});
  updateAnual();
}
function toggleServiceAnual(i){ data_anual.servicii[i].activ=!data_anual.servicii[i].activ; updateAnual(); }
function deleteServiceAnual(i){ data_anual.servicii.splice(i,1); updateAnual(); }
function updateNoteAnual(i,v){ data_anual.servicii[i].note=v; updateAnual(); }
function updateCostAnual(i,v){ data_anual.servicii[i].cost=parseFloat(v)||0; updateAnual(); }
function updateMonedaAnual(i,v){ data_anual.servicii[i].moneda=v; updateAnual(); }

function updateAnual(){
  const tbody=document.querySelector("#tableServiciiAnual tbody");
  tbody.innerHTML='';
  const total=data_anual.servicii.filter(s=>s.activ && !s.categorie).reduce((a,b)=>a+b.cost,0);
  document.getElementById('totalAnual').innerText=total;

  data_anual.servicii.forEach((s,i)=>{
    if(s.categorie){
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td colspan="8" style="font-weight:bold; text-align:center; background:#f2f2f2;">
          ${s.nume} <button class="dragHandle">≡</button> 
          <button class="deleteBtn" onclick="deleteServiceAnual(${i})">🗑️</button>
        </td>`;
      tbody.appendChild(tr);
    } else {
      const percent = total?((s.cost/total)*100).toFixed(1)+'%':'-';
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${s.nume}</td>
        <td><input type="number" value="${s.cost}" onchange="updateCostAnual(${i}, this.value)"></td>
        <td>
          <select onchange="updateMonedaAnual(${i}, this.value)">
            <option ${s.moneda==='RON'?'selected':''}>RON</option>
            <option ${s.moneda==='EUR'?'selected':''}>EUR</option>
            <option ${s.moneda==='USD'?'selected':''}>USD</option>
          </select>
        </td>
        <td>${percent}</td>
        <td><textarea class="noteInput" onchange="updateNoteAnual(${i}, this.value)">${s.note}</textarea></td>
        <td><button class="switchBtn ${s.activ?'active':'inactive'}" onclick="toggleServiceAnual(${i})">${s.activ?'On':'Off'}</button></td>
        <td class="dragHandle">≡</td>
        <td><button class="deleteBtn" onclick="deleteServiceAnual(${i})">🗑️</button></td>`;
      tbody.appendChild(tr);
    }
  });

  if(chartAnual){
    chartAnual.data.labels = data_anual.servicii.filter(s=>!s.categorie).map(s=>s.nume);
    chartAnual.data.datasets[0].data = data_anual.servicii.filter(s=>!s.categorie).map(s=>s.activ?s.cost:0);
    chartAnual.update();
  }

  saveDataLocal();

  new Sortable(tbody,{handle:'.dragHandle',animation:150,onEnd:function(evt){
    const oldIndex=evt.oldIndex;
    const newIndex=evt.newIndex;
    data_anual.servicii.splice(newIndex,0,data_anual.servicii.splice(oldIndex,1)[0]);
    updateAnual();
  }});
}

// --- Funcție culoare aleatorie ---
function getRandomColor(){
  const r=Math.floor(Math.random()*200+50);
  const g=Math.floor(Math.random()*200+50);
  const b=Math.floor(Math.random()*200+50);
  return `rgb(${r},${g},${b})`;
}

// --- Inițializare ---
document.addEventListener('DOMContentLoaded',()=>{
  if(localStorage.getItem('data_lunar')) data_lunar = JSON.parse(localStorage.getItem('data_lunar'));
  if(localStorage.getItem('data_anual')) data_anual = JSON.parse(localStorage.getItem('data_anual'));

  showPage('lunar');

  const ctxHome = document.getElementById('chartHomePie').getContext('2d');
  chartHomePie = new Chart(ctxHome, {
    type:'pie',
    data:{
      labels: data_lunar.servicii.filter(s=>!s.categorie).map(s=>s.nume),
      datasets:[{
        data: data_lunar.servicii.filter(s=>!s.categorie).map(s=>s.activ?s.cost:0),
        backgroundColor: data_lunar.servicii.filter(s=>!s.categorie).map(()=>getRandomColor())
      }]
    },
    options:{responsive:true}
  });

  const ctxAnual = document.getElementById('chartAnual').getContext('2d');
  chartAnual = new Chart(ctxAnual, {
    type:'pie',
    data:{
      labels: data_anual.servicii.filter(s=>!s.categorie).map(s=>s.nume),
      datasets:[{
        data: data_anual.servicii.filter(s=>!s.categorie).map(s=>s.activ?s.cost:0),
        backgroundColor: data_anual.servicii.filter(s=>!s.categorie).map(()=>getRandomColor())
      }]
    },
    options:{responsive:true}
  });

  updateHome();
  updateAnual();
});
