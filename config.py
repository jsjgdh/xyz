import os

OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
CACHE_TTL_WEATHER = int(os.environ.get("CACHE_TTL_WEATHER", "900"))
CACHE_TTL_SOIL = int(os.environ.get("CACHE_TTL_SOIL", "86400"))
