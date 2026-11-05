"""
smart_route_finder/traffic.py
Traffic simulation engine: time-of-day rush-hour curves, congestion multipliers,
and dynamic weight recalculation.
"""

from typing import Dict, List, Any
import math
import random

TRAFFIC_SPEED_FACTORS = {
    "low": 1.0,       # 100% free flow speed
    "medium": 0.65,   # 35% delay
    "high": 0.35,     # 65% delay
    "blocked": 0.0001 # Impassable
}

def get_hourly_multiplier(hour: int) -> float:
    """
    Computes rush-hour congestion multiplier (0-23 hours).
    Peaks at 9:00 AM (morning rush) and 6:30 PM (evening rush).
    """
    if 8 <= hour <= 10:
        return 1.8 + (1.0 - abs(hour - 9)) * 0.4  # Morning peak ~2.2x
    elif 17 <= hour <= 20:
        return 1.9 + (1.0 - abs(hour - 18.5) / 1.5) * 0.5  # Evening peak ~2.4x
    elif 12 <= hour <= 16:
        return 1.25  # Midday moderate
    elif hour >= 23 or hour <= 5:
        return 0.85  # Late night smooth
    else:
        return 1.10

def calculate_effective_edge_weight(
    distance_km: float,
    base_speed_kmh: float,
    traffic_level: str,
    preference: str = "fastest",
    vehicle_type: str = "car",
    hour: int = 14
) -> float:
    """
    Computes cost weight of traversing an edge under chosen preference.
    """
    if traffic_level == "blocked":
        return float("inf")

    # Vehicle configurations
    vehicle_specs = {
        "bike": {"speed_mult": 1.15, "km_per_l": 45.0, "co2_g_km": 42.0},
        "car": {"speed_mult": 1.00, "km_per_l": 15.0, "co2_g_km": 130.0},
        "bus": {"speed_mult": 0.75, "km_per_l": 4.0, "co2_g_km": 28.0},
    }
    spec = vehicle_specs.get(vehicle_type, vehicle_specs["car"])
    hour_mult = get_hourly_multiplier(hour)
    traffic_factor = TRAFFIC_SPEED_FACTORS.get(traffic_level, 1.0) / hour_mult

    effective_speed = max(5.0, base_speed_kmh * spec["speed_mult"] * traffic_factor)
    travel_time_minutes = (distance_km / effective_speed) * 60.0

    fuel_factor = 1.4 if traffic_level == "high" else (1.15 if traffic_level == "medium" else 1.0)
    fuel_cost_inr = (distance_km / spec["km_per_l"]) * 108.0 * fuel_factor
    co2_kg = (distance_km * spec["co2_g_km"] * fuel_factor) / 1000.0

    if preference == "shortest":
        return distance_km
    elif preference == "fastest":
        return travel_time_minutes
    elif preference == "cheapest":
        return fuel_cost_inr
    elif preference == "eco":
        return co2_kg
    return distance_km

def randomize_traffic(roads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Randomizes road traffic conditions."""
    choices = ["low", "low", "medium", "medium", "high"]
    updated = []
    for r in roads:
        r_copy = dict(r)
        if random.random() < 0.05:
            r_copy["traffic"] = "blocked"
        else:
            r_copy["traffic"] = random.choice(choices)
        updated.append(r_copy)
    return updated
