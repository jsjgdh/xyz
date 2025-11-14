from flask import Blueprint, request, jsonify
from services.soil import get_soil

bp = Blueprint("soil", __name__)

@bp.get("/api/soil")
def soil():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "lat and lon required"}), 400
    data = get_soil(float(lat), float(lon))
    return jsonify(data)
