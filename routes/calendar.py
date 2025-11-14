from flask import Blueprint, request, jsonify
from services.weather import get_weather
from services.soil import get_soil
from services.recommender import month_statuses

bp = Blueprint("calendar", __name__)

@bp.get("/api/calendar")
def calendar():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "lat and lon required"}), 400
    weather = get_weather(float(lat), float(lon))
    soil = get_soil(float(lat), float(lon))
    res = month_statuses(weather, soil)
    return jsonify(res)
