const {recommend, exportCSV} = window.App

let recData = []
const latEl = document.getElementById('rec-lat')
const lonEl = document.getElementById('rec-lon')
const list = document.getElementById('rec-list')
const searchEl = document.getElementById('filter-search')
const catEl = document.getElementById('filter-category')
const statusEl = document.getElementById('filter-status')

function renderCard(item){
  const c = document.createElement('div')
  c.className = 'card'
  const badge = `<span class="badge ${item.status}">${item.status}</span>`
  const meta = item.metadata || {}
  const categoryIcon = {
    'cereal': '🌾',
    'legume': '🥜',
    'vegetable': '🥬',
    'root': '🥕',
    'bulb': '🧅',
    'leafy': '🥗',
    'oilseed': '🌻',
    'fiber': '🧵',
    'tuber': '🥔',
    'cash': '💰'
  }[meta.category] || '🌱'
  
  c.innerHTML = `
    <div class="title">
      <span><i class="fas fa-seedling" style="color: var(--secondary); margin-right: 0.5rem;"></i>${item.crop}</span>
      ${badge}
    </div>
    <div class="score">${item.score.toFixed(1)}</div>
    <div class="meta">
      <div class="meta-item">
        <span><i class="fas fa-cloud-rain" style="color: var(--primary-light); margin-right: 0.5rem;"></i>Rainfall</span>
        <strong>${item.factors.rain.value} mm</strong>
      </div>
      <div class="meta-item">
        <span><i class="fas fa-thermometer-half" style="color: var(--accent); margin-right: 0.5rem;"></i>Temperature</span>
        <strong>${item.factors.temp.value} °C</strong>
      </div>
      <div class="meta-item">
        <span><i class="fas fa-flask" style="color: var(--secondary); margin-right: 0.5rem;"></i>pH Level</span>
        <strong>${item.factors.ph.value}</strong>
      </div>
      <div class="meta-item">
        <span><i class="fas fa-leaf" style="color: var(--success); margin-right: 0.5rem;"></i>Organic Carbon</span>
        <strong>${item.factors.soc.value}%</strong>
      </div>
      <div class="meta-item">
        <span><i class="fas fa-mountain" style="color: var(--text-secondary); margin-right: 0.5rem;"></i>Texture</span>
        <strong>${item.factors.texture.value}</strong>
      </div>
      ${meta.category ? `<div class="meta-item">
        <span><i class="fas fa-tags" style="color: var(--primary); margin-right: 0.5rem;"></i>Category</span>
        <strong>${categoryIcon} ${meta.category}</strong>
      </div>` : ''}
      ${meta.growth_cycle_days ? `<div class="meta-item">
        <span><i class="fas fa-calendar-day" style="color: var(--primary); margin-right: 0.5rem;"></i>Growth Cycle</span>
        <strong>${meta.growth_cycle_days} days</strong>
      </div>` : ''}
      ${meta.water_mm ? `<div class="meta-item">
        <span><i class="fas fa-tint" style="color: var(--primary-light); margin-right: 0.5rem;"></i>Water Needs</span>
        <strong>${meta.water_mm} mm</strong>
      </div>` : ''}
    </div>
  `
  return c
}

function filter(){
  const s = searchEl.value.toLowerCase()
  const cat = catEl.value
  const st = statusEl.value
  const filtered = recData.filter(r=>{
    const meta = r.metadata || {}
    return (!s || r.crop.toLowerCase().includes(s)) &&
           (!cat || meta.category === cat) &&
           (!st || r.status === st)
  })
  list.innerHTML = ''
  filtered.forEach(x=>{ list.appendChild(renderCard(x)) })
}

async function run(){
  const lat = parseFloat(latEl.value || '28.6139')
  const lon = parseFloat(lonEl.value || '77.2090')
  const res = await recommend(lat,lon)
  recData = res.recommendations
  filter()
}

document.getElementById('rec-run').addEventListener('click', run)
searchEl.addEventListener('input', filter)
catEl.addEventListener('change', filter)
statusEl.addEventListener('change', filter)

const exportPanel = document.getElementById('export-panel')
const exportOptionsBtn = document.getElementById('export-options')
const exportCloseBtn = document.getElementById('export-close')
const exportCustomBtn = document.getElementById('export-custom')
const exportAllBtn = document.getElementById('export-all')

function getSelectedFields() {
  return Array.from(document.querySelectorAll('input[name="export-field"]:checked')).map(cb => cb.value)
}

function exportData(fields) {
  if (!recData.length) {
    alert('No data to export. Please run recommendations first.')
    return
  }
  
  const recs = recData.map(r => {
    const row = {}
    const meta = r.metadata || {}
    
    if (fields.includes('crop')) row.crop = r.crop
    if (fields.includes('score')) row.score = r.score
    if (fields.includes('status')) row.status = r.status
    if (fields.includes('category')) row.category = meta.category || ''
    if (fields.includes('growth_cycle_days')) row.growth_cycle_days = meta.growth_cycle_days || ''
    if (fields.includes('water_mm')) row.water_mm = meta.water_mm || ''
    if (fields.includes('temp')) row.temp = r.factors?.temp?.value || ''
    if (fields.includes('rain')) row.rain = r.factors?.rain?.value || ''
    if (fields.includes('ph')) row.ph = r.factors?.ph?.value || ''
    if (fields.includes('soc')) row.soc = r.factors?.soc?.value || ''
    if (fields.includes('texture')) row.texture = r.factors?.texture?.value || ''
    
    return row
  })
  
  exportCSV(recs, fields)
}

exportOptionsBtn.addEventListener('click', () => {
  exportPanel.style.display = exportPanel.style.display === 'none' ? 'block' : 'none'
})

exportCloseBtn.addEventListener('click', () => {
  exportPanel.style.display = 'none'
})

exportCustomBtn.addEventListener('click', () => {
  const fields = getSelectedFields()
  if (fields.length === 0) {
    alert('Please select at least one field to export.')
    return
  }
  exportData(fields)
  exportPanel.style.display = 'none'
})

exportAllBtn.addEventListener('click', () => {
  const allFields = ["crop","score","status","category","growth_cycle_days","water_mm","temp","rain","ph","soc","texture"]
  exportData(allFields)
  exportPanel.style.display = 'none'
})

document.getElementById('export-csv').addEventListener('click', ()=>{
  const fields = ["crop","score","status","category","growth_cycle_days","water_mm"]
  exportData(fields)
})

run()
