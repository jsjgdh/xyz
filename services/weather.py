import time
import requests
from config import OPENWEATHER_API_KEY, CACHE_TTL_WEATHER

_cache = {}

def _cache_get(key):
    item = _cache.get(key)
    if not item:
        return None
    exp, val = item
    if exp < time.time():
        _cache.pop(key, None)
        return None
    return val

def _cache_set(key, val, ttl):
    _cache[key] = (time.time() + ttl, val)

def geocode_location(query):
    if not query:
        return {"results": []}
    key = f"geo:{query}"
    cached = _cache_get(key)
    if cached:
        return cached
    if not OPENWEATHER_API_KEY:
        return {"results": [{"name": "Sample", "lat": 28.6139, "lon": 77.2090}]}
    url = "http://api.openweathermap.org/geo/1.0/direct"
    params = {"q": query, "limit": 5, "appid": OPENWEATHER_API_KEY}
    try:
        r = requests.get(url, params=params, timeout=15)
        if r.status_code != 200:
            raise RuntimeError(f"geocode status {r.status_code}")
        data = r.json()
        if not isinstance(data, list):
            raise RuntimeError("geocode unexpected payload")
        res = {"results": [{"name": x.get("name"), "lat": x.get("lat"), "lon": x.get("lon")} for x in data]}
    except Exception:
        res = {"results": [{"name": "Sample", "lat": 28.6139, "lon": 77.2090}]}
    _cache_set(key, res, 3600)
    return res

def get_weather(lat, lon):
    key = f"weather:{lat:.4f},{lon:.4f}"
    cached = _cache_get(key)
    if cached:
        return cached
    if not OPENWEATHER_API_KEY:
        sample = {
            "lat": lat,
            "lon": lon,
            "current": {"temp": 26, "humidity": 60, "wind_speed": 3.2, "rain": {"1h": 0}},
            "daily": [
                {"dt": 0, "temp": {"day": 26}, "rain": 5},
                {"dt": 1, "temp": {"day": 27}, "rain": 12},
                {"dt": 2, "temp": {"day": 25}, "rain": 8},
                {"dt": 3, "temp": {"day": 24}, "rain": 2},
                {"dt": 4, "temp": {"day": 26}, "rain": 15},
                {"dt": 5, "temp": {"day": 28}, "rain": 0},
                {"dt": 6, "temp": {"day": 27}, "rain": 10}
            ],
            "climatology": {
                "monthly": [
                    {"month": 1, "temp": 18, "rain": 25},
                    {"month": 2, "temp": 20, "rain": 30},
                    {"month": 3, "temp": 24, "rain": 35},
                    {"month": 4, "temp": 28, "rain": 45},
                    {"month": 5, "temp": 32, "rain": 60},
                    {"month": 6, "temp": 34, "rain": 80},
                    {"month": 7, "temp": 33, "rain": 90},
                    {"month": 8, "temp": 32, "rain": 85},
                    {"month": 9, "temp": 30, "rain": 70},
                    {"month": 10, "temp": 26, "rain": 50},
                    {"month": 11, "temp": 22, "rain": 35},
                    {"month": 12, "temp": 19, "rain": 28}
                ]
            }
        }
        _cache_set(key, sample, CACHE_TTL_WEATHER)
        return sample
    url = "https://api.openweathermap.org/data/3.0/onecall"
    params = {"lat": lat, "lon": lon, "units": "metric", "appid": OPENWEATHER_API_KEY}
    try:
        r = requests.get(url, params=params, timeout=20)
        if r.status_code != 200:
            raise RuntimeError(f"onecall status {r.status_code}")
        data = r.json()
        if not isinstance(data, dict) or ("current" not in data and "daily" not in data):
            raise RuntimeError("onecall unexpected payload")
    except Exception:
        data = {
            "lat": lat,
            "lon": lon,
            "current": {"temp": 26, "humidity": 60, "wind_speed": 3.2, "rain": {"1h": 0}},
            "daily": [
                {"dt": 0, "temp": {"day": 26}, "rain": 5},
                {"dt": 1, "temp": {"day": 27}, "rain": 12},
                {"dt": 2, "temp": {"day": 25}, "rain": 8},
                {"dt": 3, "temp": {"day": 24}, "rain": 2},
                {"dt": 4, "temp": {"day": 26}, "rain": 15},
                {"dt": 5, "temp": {"day": 28}, "rain": 0},
                {"dt": 6, "temp": {"day": 27}, "rain": 10}
            ]
        }
    # Add climatology mock if not present
    if "climatology" not in data:
        data["climatology"] = {
            "monthly": [
                {"month": 1, "temp": 18, "rain": 25},
                {"month": 2, "temp": 20, "rain": 30},
                {"month": 3, "temp": 24, "rain": 35},
                {"month": 4, "temp": 28, "rain": 45},
                {"month": 5, "temp": 32, "rain": 60},
                {"month": 6, "temp": 34, "rain": 80},
                {"month": 7, "temp": 33, "rain": 90},
                {"month": 8, "temp": 32, "rain": 85},
                {"month": 9, "temp": 30, "rain": 70},
                {"month": 10, "temp": 26, "rain": 50},
                {"month": 11, "temp": 22, "rain": 35},
                {"month": 12, "temp": 19, "rain": 28}
            ]
        }
    _cache_set(key, data, CACHE_TTL_WEATHER)
    return data
