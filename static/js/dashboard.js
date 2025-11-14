const {geocode, weather, soil} = window.App

let loc = {lat:28.6139, lon:77.2090}
const coordSpan = document.getElementById('coord')
const statusSpan = document.getElementById('status')
const input = document.getElementById('location-input')
document.getElementById('search-btn').addEventListener('click', async () => {
  try{
    const g = await geocode(input.value)
    const first = g.results && g.results[0]
    if(first){
      loc = {lat:first.lat, lon:first.lon}
      coordSpan.textContent = `${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`
      await loadAll()
    }
  }catch(e){ statusSpan.textContent = 'Search failed' }
})

let rainChart, tempChart, phChart, socChart

function drawCharts(w,s){
  const labels = w.daily.map((_,i)=>`Day ${i+1}`)
  const rain = w.daily.map(d=>typeof d.rain==='number'?d.rain:0)
  const temps = w.daily.map(d=>d.temp.day||d.temp.min||0)
  rainChart && rainChart.destroy()
  tempChart && tempChart.destroy()
  phChart && phChart.destroy()
  socChart && socChart.destroy()
  
  const primaryColor = '#3b82f6'
  const secondaryColor = '#10b981'
  const accentColor = '#f59e0b'
  const bgColor = '#f1f5f9'
  
  rainChart = new Chart(document.getElementById('rainChart'),{
    type:'line',
    data:{
      labels,
      datasets:[{
        label:'Rainfall (mm)',
        data:rain,
        borderColor: primaryColor,
        backgroundColor: `${primaryColor}20`,
        tension:0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options:{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: bgColor }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  })
  
  tempChart = new Chart(document.getElementById('tempChart'),{
    type:'line',
    data:{
      labels,
      datasets:[{
        label:'Temperature (°C)',
        data:temps,
        borderColor: accentColor,
        backgroundColor: `${accentColor}20`,
        tension:0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options:{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: bgColor }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  })
  
  phChart = new Chart(document.getElementById('phChart'),{
    type:'doughnut',
    data:{
      labels:['pH Level',''],
      datasets:[{
        data:[s.ph,7.5-s.ph],
        backgroundColor:[secondaryColor, bgColor],
        borderWidth: 0
      }]
    },
    options:{
      responsive: true,
      maintainAspectRatio: false,
      plugins:{
        legend:{display:false},
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.dataIndex === 0) {
                return `pH: ${s.ph.toFixed(2)}`
              }
              return ''
            }
          }
        }
      }
    }
  })
  
  socChart = new Chart(document.getElementById('socChart'),{
    type:'bar',
    data:{
      labels:['Organic Carbon'],
      datasets:[{
        label:'SOC (%)',
        data:[s.soc_pct],
        backgroundColor: secondaryColor,
        borderRadius: 8
      }]
    },
    options:{
      responsive: true,
      maintainAspectRatio: false,
      indexAxis:'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 10,
          grid: { color: bgColor }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  })
}

function setMetrics(w,s){
  const wm = document.getElementById('weather-metrics')
  wm.innerHTML = `
    <div>
      <strong>${w.current.temp.toFixed(1)}</strong>
      <span><i class="fas fa-thermometer-half"></i> Temperature (°C)</span>
    </div>
    <div>
      <strong>${w.current.humidity}</strong>
      <span><i class="fas fa-tint"></i> Humidity (%)</span>
    </div>
    <div>
      <strong>${w.current.wind_speed.toFixed(1)}</strong>
      <span><i class="fas fa-wind"></i> Wind (m/s)</span>
    </div>
  `
  const sm = document.getElementById('soil-metrics')
  sm.innerHTML = `
    <div>
      <strong>${s.ph.toFixed(2)}</strong>
      <span><i class="fas fa-flask"></i> pH Level</span>
    </div>
    <div>
      <strong>${s.soc_pct.toFixed(2)}</strong>
      <span><i class="fas fa-leaf"></i> Organic Carbon (%)</span>
    </div>
    <div>
      <strong>${s.texture}</strong>
      <span><i class="fas fa-mountain"></i> Texture</span>
    </div>
  `
}

async function loadAll(){
  statusSpan.textContent = 'Loading…'
  const w = await weather(loc.lat,loc.lon)
  const s = await soil(loc.lat,loc.lon)
  setMetrics(w,s)
  drawCharts(w,s)
  statusSpan.textContent = ''
}

coordSpan.textContent = `${loc.lat}, ${loc.lon}`
loadAll()
