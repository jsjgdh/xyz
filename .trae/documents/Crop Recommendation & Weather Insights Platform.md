# Overview

* Build a responsive Flask + HTML/CSS/JS app that combines OpenWeather and FAO/SoilGrids soil data to recommend crops and visualize rainfall and soil pH.

* Keep API keys server-side, expose clean JSON endpoints to the frontend, and render charts with Chart.js.

## Architecture

* **Frontend**: HTML templates (Jinja), modular JS for API calls, Chart.js graphs, simple state management per page.

* **Backend**: Flask app with blueprints for `weather`, `soil`, `recommend`, `calendar`.

* **Services layer**: Python modules for external APIs (OpenWeather, FAO/SoilGrids), recommendation rules, caching.

* **Storage**: No DB initially; in-memory cache (Flask-Caching) and optional CSV export.

## Folder Structure

* `app.py` – Flask entrypoint

* `config.py` – environment variables (API keys, cache TTLs)

* `services/`

  * `weather.py` – OpenWeather One Call 3.0 + Geocoding

  * `soil.py` – FAO catalog/SoilGrids property queries (pH, SOC, texture)

  * `recommender.py` – thresholds + scoring

* `routes/`

  * `weather.py`, `soil.py`, `recommend.py`, `calendar.py`, `pages.py`

* `templates/`

  * `base.html` (layout + navbar), `dashboard.html`, `recommendations.html`, `calendar.html`

* `static/`

  * `css/styles.css` (palette + components)

  * `js/dashboard.js`, `js/recommendations.js`, `js/calendar.js`, `js/api.js` (fetch helpers)

* `tests/` – unit tests for services and recommender

* `.env` (local only; never committed) – `OPENWEATHER_API_KEY`

## Backend Endpoints

* `GET /api/geocode?query=London` → lat/lon using OpenWeather Geocoding.

* `GET /api/weather?lat=..&lon=..` → current, hourly (96), daily (7) with rainfall, temp, humidity, wind.

* `GET /api/soil?lat=..&lon=..` → surface pH (0–5 cm), organic carbon, texture fractions; normalized outputs.

* `POST /api/recommend` (JSON body: weather + soil or lat/lon) → crop list with scores, rationale, color status.

* `GET /api/calendar?lat=..&lon=..&year=2025` → month-level suitability statuses and simple notes.

* `GET /download/recommendations.csv` → export current recommendation set.

## Data Sources

* **OpenWeather**: Use One Call API 3.0 (free tier \~1,000 calls/day). Cache responses per `(lat,lon)` for 10–15 minutes.

* **FAO Soil Data**: The catalog page is not a direct API. Query SoilGrids properties for pH (`phh2o`), organic carbon (`soc`), and texture via property endpoint by lat/lon. If FAO catalog access returns 404 for specific layers, fallback to SoilGrids REST properties for the same variables.

## Recommendation Logic

### Scoring design (principles)

&#x20;

* Inputs: `rainfall_mm` (monthly or weekly — keep consistent), `temp_c` (mean), `ph`, `soc_pct`, `texture` (categorical).
* Each factor has a **weight** (sum = 100). Default recommended weights:
  * Rainfall = **35**
  * Temperature = **25**
  * Soil pH = **15**
  * SOC = **15**
  * Texture = **10**
* For each numeric factor we define:
  * `ideal_range = [min_ideal, max_ideal]` → gives **full** points for that factor.
  * `acceptable_range = [min_acc, max_acc]` → gives **partial** linear points if inside acceptable but outside ideal.
  * Outside `acceptable_range` → gives **0** for that factor (but generate rationale).
* Texture match is categorical:
  * exact match → full weight
  * similar (e.g., loam \~ sandy loam, clay loam) → half weight
  * mismatch → 0
* Final `score` = sum of weighted contributions (0–100).
* Status:
  * `green` = score ≥ 75
  * `yellow` = 50 ≤ score < 75
  * `red` = score < 50

***

# 2) Scoring math (formula / details)

For a numeric input `x` and crop parameter:

* If `min_ideal ≤ x ≤ max_ideal` → `factor_score = weight`
* Else if `min_acc ≤ x < min_ideal` → `factor_score = weight * (x - min_acc) / (min_ideal - min_acc)`
* Else if `max_ideal < x ≤ max_acc` → `factor_score = weight * (max_acc - x) / (max_acc - max_ideal)`
* Else → `factor_score = 0`

This makes the partial score **linear** as x moves away from ideal toward the acceptable boundary.

Texture match:

* `exact` → `texture_score = weight`
* `similar` → `texture_score = weight * 0.5`
* `mismatch` → `texture_score = 0`

Total score = sum of all factor\_scores (clamped 0..100).

Add **small penalties** (optional): if a critical factor (e.g., rainfall for rice) is below `min_critical`, subtract a penalty (e.g., 10 points) — use sparingly.

***

# 3) Rationale / explanation output

For each crop produce:

* `score` (0–100) and `status` (green/yellow/red)
* `matched`: list of factors that met ideal
* `partial`: list with factor, actual value, ideal, acceptable, and short note (e.g., "rainfall low — expected ≥150 mm, current 95 mm")
* `unmet`: list of critical misses (outside acceptable range)
* `suggestions`: short remediation (e.g., "consider irrigation / increase SOC via compost / liming to raise pH by 0.5")

Example rationale line:

* `"rainfall: needs ≥150 mm (ideal 150–300), current = 95 mm → unmet (red)."`

***

# 4) Crop parameter table (20 crops — example thresholds)

Each crop entry: `name, min_ideal_rain, max_ideal_rain, min_acc_rain, max_acc_rain, min_ideal_temp, max_ideal_temp, min_acc_temp, max_acc_temp, min_ideal_ph, max_ideal_ph, min_acc_ph, max_acc_ph, min_soc_pct, min_acc_soc_pct, texture_classes`

(Values are monthly rainfall in mm and mean temp in °C.)

1. **Rice**: ideal rain 150–400, acc 100–500; temp 20–30, acc 15–34; pH 5.0–6.5, acc 4.5–7.5; SOC ≥1.0 (acc 0.6); textures: `clay`, `silty clay`, `clay loam`.
2. **Wheat**: rain 50–120, acc 30–150; temp 10–25, acc 5–30; pH 6.0–7.5, acc 5.5–8.0; SOC ≥0.6 (acc 0.4); textures: `loam`, `sandy loam`.
3. **Maize**: rain 80–150, acc 50–200; temp 18–30, acc 12–34; pH 5.5–7.5, acc 5.0–8.0; SOC ≥0.8 (acc 0.5); textures: `loam`, `silt loam`.
4. **Soybean**: rain 60–120, acc 40–160; temp 20–30, acc 15–33; pH 6.0–7.0, acc 5.5–7.5; SOC ≥1.0 (acc 0.6); textures: `loam`, `sandy loam`.
5. **Sorghum**: rain 40–100, acc 20–150; temp 20–35, acc 15–38; pH 5.5–7.5, acc 5.0–8.0; SOC ≥0.5 (acc 0.3); textures: `sandy loam`, `loam`.
6. **Pearl Millet**: rain 20–80, acc 10–120; temp 25–38, acc 18–40; pH 5.5–7.8, acc 5.0–8.5; SOC ≥0.4 (acc 0.2); textures: `sandy`, `sandy loam`.
7. **Barley**: rain 40–90, acc 20–120; temp 8–24, acc 4–28; pH 6.0–7.5, acc 5.5–8.0; SOC ≥0.5 (acc 0.3); textures: `loam`, `sandy loam`.
8. **Oats**: rain 60–120, acc 40–160; temp 10–22, acc 6–26; pH 6.0–7.0, acc 5.5–7.5; SOC ≥0.8 (acc 0.5); textures: `loam`.
9. **Sugarcane**: rain 100–300, acc 80–400; temp 22–34, acc 18–36; pH 5.5–7.5, acc 5.0–8.0; SOC ≥1.2 (acc 0.8); textures: `clay loam`, `silt loam`.
10. **Cotton**: rain 50–150, acc 30–200; temp 20–35, acc 16–38; pH 5.8–8.0, acc 5.5–8.5; SOC ≥0.6 (acc 0.3); textures: `sandy loam`, `loam`.
11. **Groundnut (Peanut)**: rain 50–120, acc 30–160; temp 20–32, acc 16–35; pH 5.5–6.5, acc 5.0–7.0; SOC ≥0.8 (acc 0.5); textures: `sandy`, `sandy loam`.
12. **Sunflower**: rain 40–90, acc 30–140; temp 20–30, acc 15–35; pH 6.0–7.5, acc 5.5–8.0; SOC ≥0.6 (acc 0.3); textures: `loam`, `sandy loam`.
13. **Potato**: rain 40–100, acc 30–150; temp 15–20, acc 8–22; pH 5.5–6.5, acc 5.0–7.0; SOC ≥1.0 (acc 0.7); textures: `sandy loam`, `silt loam`.
14. **Tomato**: rain 40–80, acc 30–120; temp 18–28, acc 12–32; pH 5.5–6.8, acc 5.0–7.5; SOC ≥0.8 (acc 0.5); textures: `loam`.
15. **Onion**: rain 30–70, acc 20–120; temp 12–24, acc 8–28; pH 6.0–7.0, acc 5.5–7.5; SOC ≥0.6 (acc 0.3); textures: `sandy loam`.
16. **Garlic**: rain 30–70, acc 20–120; temp 10–20, acc 6–24; pH 6.0–7.0, acc 5.5–7.5; SOC ≥0.6 (acc 0.3); textures: `loam`, `sandy loam`.
17. **Chickpea**: rain 20–60, acc 10–90; temp 12–28, acc 6–32; pH 6.0–8.0, acc 5.5–8.5; SOC ≥0.4 (acc 0.2); textures: `loam`, `sandy loam`.
18. **Lentil**: rain 20–50, acc 10–80; temp 8–24, acc 4–28; pH 6.0–7.5, acc 5.5–8.0; SOC ≥0.3 (acc 0.2); textures: `loam`.
19. **Rapeseed / Canola**: rain 40–90, acc 30–130; temp 10–22, acc 6–26; pH 6.0–7.5, acc 5.5–8.0; SOC ≥0.6 (acc 0.3); textures: `loam`.
20. **Mustard**: rain 30–70, acc 20–110; temp 12–25, acc 8–28; pH 6.0–7.8, acc 5.5–8.5; SOC ≥0.4 (acc 0.2); textures: `loam`, `sandy loam`.
21. **Tea** (optional): rain 150–400, acc 120–500; temp 15–25, acc 10–28; pH 4.5–5.5, acc 4.0–6.0; SOC ≥1.5 (acc 1.0); textures: `silty`, `clay loam`

## UI/UX Pages

* **Navbar**: Logo + tabs: `Dashboard`, `Rec`, `Calendar`.

* **Dashboard**: location input; panels for current weather; 2x2 chart grid (rainfall trend, temp trend, pH gauge, SOC bar). Soil & nutrient panel shows pH, SOC, texture, N/P/K proxies.

* **Recommendations**: card for each crop with score, status color, key needs met/unmet, quick notes; CSV download.

* **Calendar**: month grid with colored status (green/yellow/red) and brief notes per month (e.g., “heavy rain expected week 3”).

## Chart.js Visuals

* Rainfall line chart (daily/weekly); temp line chart; pH radial gauge (custom or doughnut); SOC bar chart; optional stacked texture bars.

* Consistent tooltips, units, and legends.

## Color Palette & Theme

* Define CSS variables: `--bg-light`, `--gray`, `--graphite`, `--blue`, `--navy`, `--soft-blue`, `--red`.

* Apply palette to components: buttons (primary blue), active states (deep navy), charts (soft blue), alerts (red), text (graphite).

## Frontend JS

* `api.js`: `getJSON(url)` helper with error handling.

* Page-specific modules drive rendering and Chart.js updates; debounce for location input.

## Caching & Rate Limits

* Server-side cache for weather and soil responses keyed by `(lat,lon)` with TTL; simple retry/backoff; informative error messages.

## Testing & Validation

* Unit tests for rules (recommender), API adapters (weather/soil) with mocked responses, JSON schema checks for endpoints.

* Basic integration test to verify end-to-end recommendation for a known location.

## Delivery Steps

1. Scaffold Flask app, blueprints, and folder structure.
2. Implement OpenWeather service + `/api/weather` and geocoding.
3. Implement soil service via FAO/SoilGrids + `/api/soil`.
4. Build `recommender.py` and `/api/recommend` with rule set.
5. Create `dashboard.html` + charts, wire to endpoints.
6. Create `recommendations.html` with cards + CSV export.
7. Create `calendar.html` with color-coded months based on suitability.
8. Add caching, error handling, tests.

## Notes

* Keep secrets out of the repo; use `.env` locally.

* All API calls go through Flask to avoid exposing keys and to unify caching.

* The FAO catalog link may require dataset-specific layer endpoints; we will adapt to the available service and use SoilGrids REST as a proven fallback for pH and SOC.

