from flask import Blueprint, request, jsonify, Response
import csv
import io
from services.weather import get_weather
from services.soil import get_soil
from services.recommender import recommend_for_location, CROPS

bp = Blueprint("recommend", __name__)

@bp.post("/api/recommend")
def recommend():
    body = request.get_json(silent=True) or {}
    lat = body.get("lat")
    lon = body.get("lon")
    if lat is None or lon is None:
        return jsonify({"error": "lat and lon required"}), 400
    weather = get_weather(float(lat), float(lon))
    soil = get_soil(float(lat), float(lon))
    res = recommend_for_location(weather, soil)
    return jsonify(res)

@bp.get("/api/crops")
def crops():
    return jsonify({"crops": [{"name": c["name"], "metadata": c.get("metadata", {})} for c in CROPS]})

@bp.post("/api/export/csv")
def export_csv():
    body = request.get_json(silent=True) or {}
    recs = body.get("recs", [])
    fields = body.get("fields", [])
    if not recs or not fields:
        return jsonify({"error": "recs and fields required"}), 400
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(fields)
    for r in recs:
        row = [r.get(f, "") for f in fields]
        writer.writerow(row)
    buffer.seek(0)
    return Response(buffer.getvalue(), mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=crop_recommendations.csv"})
