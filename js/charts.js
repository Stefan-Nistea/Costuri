/**
 * CHARTS MODULE — Responsible for initializing Chart.js instances
 * for each SPA page. Ensures that all charts are recreated safely
 * when pages are switched using the dynamic router.
 */
 
 
 /**
 * Initializes or resets Chart.js charts depending on the currently loaded page.
 * Each page gets its own chart configuration and color palette.
 * Old chart instances are destroyed before re-creation to prevent memory leaks.
 
 * @param {string} page - The active page identifier ("lunar", "utilitati", "administratie", "zilnic").
 */
function initChartsFor(page) {
  // === LUNAR & ANUAL ===
  if (page === 'lunar') {
    const ctxHome = document.getElementById('chartHomePie')?.getContext('2d');
    if (ctxHome) {
      if (chartHomePie) chartHomePie.destroy();
      chartHomePie = new Chart(ctxHome, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
        }
      });
    }

    const ctxAnual = document.getElementById('chartAnual')?.getContext('2d');
    if (ctxAnual) {
      if (chartAnual) chartAnual.destroy();
      chartAnual = new Chart(ctxAnual, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
        }
      });
    }
  }

  // === UTILITIES ===
  if (page === 'utilitati') {
    const ctxUP = document.getElementById('chartUtilPlati')?.getContext('2d');
    if (ctxUP) {
      if (chartUtilPlati) chartUtilPlati.destroy();
      chartUtilPlati = new Chart(ctxUP, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Plăți utilități (RON)', data: [], backgroundColor: '#2ecc71' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    const ctxUC = document.getElementById('chartUtilCurent')?.getContext('2d');
    if (ctxUC) {
      if (chartUtilCurent) chartUtilCurent.destroy();
      chartUtilCurent = new Chart(ctxUC, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Consum curent (kWh)', data: [], backgroundColor: '#3498db' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    const ctxUG = document.getElementById('chartUtilGaz')?.getContext('2d');
    if (ctxUG) {
      if (chartUtilGaz) chartUtilGaz.destroy();
      chartUtilGaz = new Chart(ctxUG, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Consum gaz (m³)', data: [], backgroundColor: '#e67e22' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
  }

  // === ADMINISTRATION ===
  if (page === 'administratie') {
    const ctxAP = document.getElementById('chartAdminPlati')?.getContext('2d');
    if (ctxAP) {
      if (chartAdminPlati) chartAdminPlati.destroy();
      chartAdminPlati = new Chart(ctxAP, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Plăți administrație (RON)', data: [], backgroundColor: '#9b59b6' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    const ctxAA = document.getElementById('chartAdminApa')?.getContext('2d');
    if (ctxAA) {
      if (chartAdminApa) chartAdminApa.destroy();
      chartAdminApa = new Chart(ctxAA, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{ label: 'Consum apă (m³)', data: [], backgroundColor: '#1abc9c' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    // Load saved cost-per-m³ into the input field
    const costInput = document.getElementById('adminCostPeMc');
    if (costInput) costInput.value = Number(data_administratie.cost_pe_mc || 0);
  }

  // === ZILNIC ===
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
            backgroundColor: 'rgba(39,193,122,0.5)',
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
                callback: function (value) {
                  const raw = this.chart.data.labels[value];
                  return raw ? formatLunaAn(raw) : '';
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
              formatter: value => `RON ${fmt(value)}`,
              font: { weight: 'bold' }
            }
          },
          layout: { padding: { top: 30, bottom: 30 } }
        },
        plugins: [ChartDataLabels]
      });
    }

    const ctxCarBars = document.getElementById('chartCarBars')?.getContext('2d');
    if (ctxCarBars) {
      if (window.chartCarBars && typeof window.chartCarBars.destroy === 'function') {
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
