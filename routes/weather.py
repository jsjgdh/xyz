from flask import Blueprint, request, jsonify
from services.weather import geocode_location, get_weather

bp = Blueprint("weather", __name__)

@bp.get("/api/geocode")
def geocode():
    q = request.args.get("query", "")
    res = geocode_location(q)
    return jsonify(res)

@bp.get("/api/weather")
def weather():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "lat and lon required"}), 400
    data = get_weather(float(lat), float(lon))
    return jsonify(data)

@bp.get("/api/debug/openweather")
def debug_openweather():
    try:
        from config import OPENWEATHER_API_KEY
        present = bool(OPENWEATHER_API_KEY)
    except Exception:
        present = False
    return jsonify({"key_present": present})
