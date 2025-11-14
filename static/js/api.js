;(function(){
  async function getJSON(url, opts={}){
    const r = await fetch(url, opts)
    if(!r.ok) throw new Error('Request failed')
    return r.json()
  }
  async function geocode(q){
    return getJSON(`/api/geocode?query=${encodeURIComponent(q)}`)
  }
  async function weather(lat,lon){
    return getJSON(`/api/weather?lat=${lat}&lon=${lon}`)
  }
  async function soil(lat,lon){
    return getJSON(`/api/soil?lat=${lat}&lon=${lon}`)
  }
  async function recommend(lat,lon){
    return getJSON(`/api/recommend`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lat,lon})})
  }
  async function calendar(lat,lon){
    return getJSON(`/api/calendar?lat=${lat}&lon=${lon}`)
  }
  async function getCrops(){
    return getJSON(`/api/crops`)
  }
  async function exportCSV(recs, fields){
    const body = {recs, fields}
    const r = await fetch('/api/export/csv', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    if(!r.ok) throw new Error('Export failed')
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'crop_recommendations.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  window.App = {geocode, weather, soil, recommend, calendar, getCrops, exportCSV}
})();
