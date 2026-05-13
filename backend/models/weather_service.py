"""
Weather Service for the Smart Traffic GNN.

Fetches real-time weather data per city region from open-meteo.com (free, no API key).
Caches results for 15 minutes to avoid rate limiting.
Falls back to neutral defaults if the API is unreachable.
"""

import time
import math

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

# Coordinates for each region center
REGION_COORDS = {
    "Delhi":          {"lat": 28.6139, "lon": 77.2090},
    "Meerut":         {"lat": 28.9845, "lon": 77.7064},
    "Muzaffarnagar":  {"lat": 29.4727, "lon": 77.7085},
    "Roorkee":        {"lat": 29.8543, "lon": 77.8880},
    "Haridwar":       {"lat": 29.9457, "lon": 78.1642},
    "Rishikesh":      {"lat": 30.0869, "lon": 78.2676},
    "Dehradun":       {"lat": 30.3165, "lon": 78.0322},
}

# Default weather when API is unavailable
DEFAULT_WEATHER = {"temperature": 25.0, "precipitation": 0.0, "wind_speed": 5.0}

# Map node IDs to their region for weather lookup
def _get_region_for_node(node_id):
    """Determines the weather region for a given node ID."""
    node_lower = node_id.lower()
    if "delhi" in node_lower:
        return "Delhi"
    elif "meerut" in node_lower or "begampul" in node_lower or "partapur" in node_lower:
        return "Meerut"
    elif "mzn" in node_lower or "muzaffarnagar" in node_lower or "khatauli" in node_lower or "mansurpur" in node_lower:
        return "Muzaffarnagar"
    elif "roorkee" in node_lower or "iit roorkee" in node_lower:
        return "Roorkee"
    elif "haridwar" in node_lower or "har ki" in node_lower or "shantikunj" in node_lower or "chandi devi" in node_lower:
        return "Haridwar"
    elif "rishikesh" in node_lower or "laxman" in node_lower or "ram jhula" in node_lower or "triveni" in node_lower or "aiims" in node_lower:
        return "Rishikesh"
    else:
        return "Dehradun"  # Default for Dehradun nodes and unknowns


class WeatherService:
    """
    Fetches and caches per-region weather data.
    Thread-safe via simple timestamp-based caching (no locks needed for read-heavy).
    """
    
    def __init__(self, cache_duration_seconds=900):  # 15 minutes
        self.cache_duration = cache_duration_seconds
        self._cache = {}       # region -> weather dict
        self._last_fetch = 0   # timestamp of last successful fetch
    
    def get_weather(self):
        """
        Returns weather for all regions.
        Uses cache if data is fresh, otherwise fetches from API.
        Returns: dict of {region_name: {temperature, precipitation, wind_speed}}
        """
        now = time.time()
        if self._cache and (now - self._last_fetch) < self.cache_duration:
            return self._cache
        
        # Fetch fresh data
        fresh = self._fetch_all_regions()
        if fresh:
            self._cache = fresh
            self._last_fetch = now
            return self._cache
        
        # Return cache even if stale, or defaults
        if self._cache:
            return self._cache
        return {region: DEFAULT_WEATHER.copy() for region in REGION_COORDS}
    
    def get_weather_for_node(self, node_id):
        """Get weather dict for a specific node based on its region."""
        weather = self.get_weather()
        region = _get_region_for_node(node_id)
        return weather.get(region, DEFAULT_WEATHER)
    
    def _fetch_all_regions(self):
        """Fetch weather for all regions in a single batched API call."""
        if not HTTPX_AVAILABLE:
            return None
        
        try:
            # Open-Meteo supports multi-location via comma-separated coords
            lats = ",".join(str(c["lat"]) for c in REGION_COORDS.values())
            lons = ",".join(str(c["lon"]) for c in REGION_COORDS.values())
            
            url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lats}&longitude={lons}"
                f"&current=temperature_2m,precipitation,wind_speed_10m"
                f"&timezone=auto"
            )
            
            with httpx.Client(timeout=10) as client:
                resp = client.get(url)
                resp.raise_for_status()
                data = resp.json()
            
            result = {}
            regions = list(REGION_COORDS.keys())
            
            # Open-Meteo returns an array when multiple locations are queried
            if isinstance(data, list):
                for i, region in enumerate(regions):
                    if i < len(data) and "current" in data[i]:
                        current = data[i]["current"]
                        result[region] = {
                            "temperature": current.get("temperature_2m", 25.0),
                            "precipitation": current.get("precipitation", 0.0),
                            "wind_speed": current.get("wind_speed_10m", 5.0),
                        }
                    else:
                        result[region] = DEFAULT_WEATHER.copy()
            elif isinstance(data, dict) and "current" in data:
                # Single location response (fallback)
                current = data["current"]
                w = {
                    "temperature": current.get("temperature_2m", 25.0),
                    "precipitation": current.get("precipitation", 0.0),
                    "wind_speed": current.get("wind_speed_10m", 5.0),
                }
                for region in regions:
                    result[region] = w.copy()
            else:
                return None
            
            print(f"🌤️  Weather updated for {len(result)} regions")
            return result
            
        except Exception as e:
            print(f"⚠️  Weather fetch failed: {e}")
            return None


# Singleton instance
_weather_service = None

def get_weather_service():
    """Returns the singleton WeatherService instance."""
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service
