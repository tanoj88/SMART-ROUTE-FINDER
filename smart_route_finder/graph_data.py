"""
smart_route_finder/graph_data.py
Defines graph representation, node coordinates, edge properties,
and NetworkX graph generator for both:
1. Whole State of Telangana (Inter-District Highway Network)
2. Hyderabad Metropolitan Area (Urban Core Network)
"""

from typing import Dict, List, Any
import json
import networkx as nx

# ============================================================================
# 1. TELANGANA STATE DATASET (Inter-District State Highway Network)
# ============================================================================
TELANGANA_LOCATIONS: List[Dict[str, Any]] = [
    {"id": "hyderabad", "name": "Hyderabad (State Capital)", "lat": 17.3850, "lng": 78.4867, "category": "district"},
    {"id": "secunderabad", "name": "Secunderabad Hub", "lat": 17.4399, "lng": 78.4983, "category": "transit"},
    {"id": "shamshabad", "name": "Shamshabad (RGIA)", "lat": 17.2403, "lng": 78.4294, "category": "transit"},
    {"id": "warangal", "name": "Warangal (Kakatiya City)", "lat": 17.9784, "lng": 79.5941, "category": "district"},
    {"id": "karimnagar", "name": "Karimnagar (Manair Hub)", "lat": 18.4386, "lng": 79.1288, "category": "district"},
    {"id": "nizamabad", "name": "Nizamabad (Indur City)", "lat": 18.6725, "lng": 78.0941, "category": "district"},
    {"id": "khammam", "name": "Khammam (Stambhadri)", "lat": 17.2473, "lng": 80.1514, "category": "district"},
    {"id": "mahbubnagar", "name": "Mahbubnagar (Palamuru)", "lat": 16.7488, "lng": 77.9840, "category": "district"},
    {"id": "nalgonda", "name": "Nalgonda (Neelagiri)", "lat": 17.0577, "lng": 79.2684, "category": "district"},
    {"id": "adilabad", "name": "Adilabad (Northern Frontier)", "lat": 19.6641, "lng": 78.5320, "category": "district"},
    {"id": "nirmal", "name": "Nirmal (Toy & Craft Town)", "lat": 19.0964, "lng": 78.3428, "category": "district"},
    {"id": "ramagundam", "name": "Ramagundam (NTPC City)", "lat": 18.7551, "lng": 79.5126, "category": "district"},
    {"id": "mancherial", "name": "Mancherial (Godavari Hub)", "lat": 18.8679, "lng": 79.4639, "category": "district"},
    {"id": "jagtial", "name": "Jagtial", "lat": 18.7946, "lng": 78.9128, "category": "district"},
    {"id": "kamareddy", "name": "Kamareddy", "lat": 18.3241, "lng": 78.3411, "category": "district"},
    {"id": "siddipet", "name": "Siddipet", "lat": 18.1018, "lng": 78.8520, "category": "district"},
    {"id": "medak", "name": "Medak", "lat": 18.0470, "lng": 78.2618, "category": "district"},
    {"id": "sangareddy", "name": "Sangareddy", "lat": 17.6190, "lng": 78.0817, "category": "district"},
    {"id": "vikarabad", "name": "Vikarabad (Ananthagiri)", "lat": 17.3364, "lng": 77.9048, "category": "district"},
    {"id": "suryapet", "name": "Suryapet (Gateway)", "lat": 17.1439, "lng": 79.6239, "category": "district"},
    {"id": "bhadradri", "name": "Bhadradri (Bhadrachalam)", "lat": 17.6689, "lng": 80.8935, "category": "heritage"},
    {"id": "bhongir", "name": "Yadadri Bhongir", "lat": 17.5113, "lng": 78.8890, "category": "heritage"},
    {"id": "jangaon", "name": "Jangaon", "lat": 17.7230, "lng": 79.1780, "category": "district"},
    {"id": "wanaparthy", "name": "Wanaparthy", "lat": 16.3624, "lng": 78.0628, "category": "district"},
    {"id": "gadwal", "name": "Jogulamba Gadwal", "lat": 16.2323, "lng": 77.7709, "category": "district"},
    {"id": "nagarkurnool", "name": "Nagarkurnool", "lat": 16.4851, "lng": 78.3332, "category": "district"},
]

TELANGANA_ROADS: List[Dict[str, Any]] = [
    # NH 44 North-South Corridor
    {"id": "ts_r1", "u": "adilabad", "v": "nirmal", "name": "NH 44 (Adilabad - Nirmal Ghat)", "dist": 85.0, "speed": 90, "traffic": "low"},
    {"id": "ts_r2", "u": "nirmal", "v": "nizamabad", "name": "NH 44 (Nirmal - Nizamabad)", "dist": 54.0, "speed": 90, "traffic": "low"},
    {"id": "ts_r3", "u": "nizamabad", "v": "kamareddy", "name": "NH 44 (Nizamabad - Kamareddy)", "dist": 56.0, "speed": 90, "traffic": "low"},
    {"id": "ts_r4", "u": "kamareddy", "v": "hyderabad", "name": "NH 44 (Kamareddy - Hyderabad)", "dist": 110.0, "speed": 85, "traffic": "medium"},
    {"id": "ts_r5", "u": "hyderabad", "v": "shamshabad", "name": "PVNR Airport Expressway", "dist": 24.0, "speed": 80, "traffic": "medium"},
    {"id": "ts_r6", "u": "shamshabad", "v": "mahbubnagar", "name": "NH 44 (Shamshabad - Mahbubnagar)", "dist": 76.0, "speed": 90, "traffic": "low"},
    {"id": "ts_r7", "u": "mahbubnagar", "v": "wanaparthy", "name": "SH 18 (Mahbubnagar - Wanaparthy)", "dist": 52.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r8", "u": "wanaparthy", "v": "gadwal", "name": "NH 44 Link (Wanaparthy - Gadwal)", "dist": 42.0, "speed": 80, "traffic": "low"},
    {"id": "ts_r9", "u": "mahbubnagar", "v": "gadwal", "name": "NH 44 Tollway (Mahbubnagar - Gadwal)", "dist": 88.0, "speed": 90, "traffic": "low"},

    # NH 163 Eastern Expressway
    {"id": "ts_r10", "u": "hyderabad", "v": "secunderabad", "name": "Inner Metro Link", "dist": 9.0, "speed": 50, "traffic": "high"},
    {"id": "ts_r11", "u": "secunderabad", "v": "bhongir", "name": "NH 163 (Secunderabad - Bhongir)", "dist": 44.0, "speed": 80, "traffic": "medium"},
    {"id": "ts_r12", "u": "bhongir", "v": "jangaon", "name": "NH 163 (Bhongir - Jangaon)", "dist": 48.0, "speed": 90, "traffic": "low"},
    {"id": "ts_r13", "u": "jangaon", "v": "warangal", "name": "NH 163 (Jangaon - Warangal)", "dist": 52.0, "speed": 85, "traffic": "medium"},

    # Rajiv Rahadari SH 1
    {"id": "ts_r14", "u": "secunderabad", "v": "siddipet", "name": "Rajiv Rahadari (Secunderabad - Siddipet)", "dist": 98.0, "speed": 85, "traffic": "medium"},
    {"id": "ts_r15", "u": "siddipet", "v": "karimnagar", "name": "Rajiv Rahadari (Siddipet - Karimnagar)", "dist": 52.0, "speed": 85, "traffic": "low"},
    {"id": "ts_r16", "u": "karimnagar", "v": "ramagundam", "name": "SH 1 (Karimnagar - Ramagundam)", "dist": 62.0, "speed": 80, "traffic": "low"},
    {"id": "ts_r17", "u": "ramagundam", "v": "mancherial", "name": "Coal Corridor (Ramagundam - Mancherial)", "dist": 18.0, "speed": 75, "traffic": "medium"},
    {"id": "ts_r18", "u": "mancherial", "v": "nirmal", "name": "SH 10 (Mancherial - Nirmal)", "dist": 95.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r19", "u": "mancherial", "v": "adilabad", "name": "Forest Highway (Mancherial - Adilabad)", "dist": 135.0, "speed": 75, "traffic": "low"},

    # NH 65 & Southeastern Belt
    {"id": "ts_r20", "u": "sangareddy", "v": "hyderabad", "name": "NH 65 (Sangareddy - Hyderabad)", "dist": 50.0, "speed": 80, "traffic": "high"},
    {"id": "ts_r21", "u": "hyderabad", "v": "suryapet", "name": "NH 65 (Hyderabad - Suryapet)", "dist": 132.0, "speed": 95, "traffic": "medium"},
    {"id": "ts_r22", "u": "suryapet", "v": "khammam", "name": "SH 42 (Suryapet - Khammam)", "dist": 60.0, "speed": 85, "traffic": "low"},
    {"id": "ts_r23", "u": "suryapet", "v": "nalgonda", "name": "State Link (Suryapet - Nalgonda)", "dist": 46.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r24", "u": "hyderabad", "v": "nalgonda", "name": "Nagarjuna Sagar Rd (Hyderabad - Nalgonda)", "dist": 95.0, "speed": 80, "traffic": "medium"},

    # Inter-district Arc Connectors
    {"id": "ts_r25", "u": "warangal", "v": "karimnagar", "name": "NH 563 (Warangal - Karimnagar)", "dist": 72.0, "speed": 85, "traffic": "medium"},
    {"id": "ts_r26", "u": "karimnagar", "v": "jagtial", "name": "NH 563 (Karimnagar - Jagtial)", "dist": 50.0, "speed": 80, "traffic": "low"},
    {"id": "ts_r27", "u": "jagtial", "v": "nizamabad", "name": "NH 63 (Jagtial - Armoor - Nizamabad)", "dist": 96.0, "speed": 80, "traffic": "low"},
    {"id": "ts_r28", "u": "jagtial", "v": "nirmal", "name": "SH 7 (Jagtial - Nirmal)", "dist": 65.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r29", "u": "warangal", "v": "khammam", "name": "NH 563 (Warangal - Khammam)", "dist": 118.0, "speed": 80, "traffic": "low"},
    {"id": "ts_r30", "u": "khammam", "v": "bhadradri", "name": "Godavari Link (Khammam - Bhadradri)", "dist": 92.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r31", "u": "warangal", "v": "bhadradri", "name": "Forest Highway (Warangal - Bhadradri)", "dist": 145.0, "speed": 70, "traffic": "low"},
    {"id": "ts_r32", "u": "hyderabad", "v": "vikarabad", "name": "SH 4 (Hyderabad - Vikarabad)", "dist": 68.0, "speed": 75, "traffic": "medium"},
    {"id": "ts_r33", "u": "vikarabad", "v": "sangareddy", "name": "Western Link (Vikarabad - Sangareddy)", "dist": 48.0, "speed": 70, "traffic": "low"},
    {"id": "ts_r34", "u": "sangareddy", "v": "medak", "name": "Medak Highway (Sangareddy - Medak)", "dist": 62.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r35", "u": "medak", "v": "kamareddy", "name": "SH Link (Medak - Kamareddy)", "dist": 45.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r36", "u": "medak", "v": "siddipet", "name": "East-West (Medak - Siddipet)", "dist": 55.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r37", "u": "mahbubnagar", "v": "nagarkurnool", "name": "SH 20 (Mahbubnagar - Nagarkurnool)", "dist": 48.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r38", "u": "nagarkurnool", "v": "wanaparthy", "name": "SH (Nagarkurnool - Wanaparthy)", "dist": 40.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r39", "u": "nagarkurnool", "v": "nalgonda", "name": "Dindi Route (Nagarkurnool - Nalgonda)", "dist": 110.0, "speed": 70, "traffic": "low"},
    {"id": "ts_r40", "u": "shamshabad", "v": "nagarkurnool", "name": "Srisailam Highway Link", "dist": 85.0, "speed": 80, "traffic": "medium"},
    {"id": "ts_r41", "u": "siddipet", "v": "jangaon", "name": "Central Bypass (Siddipet - Jangaon)", "dist": 44.0, "speed": 75, "traffic": "low"},
    {"id": "ts_r42", "u": "nalgonda", "v": "khammam", "name": "Direct Highway (Nalgonda - Khammam)", "dist": 125.0, "speed": 80, "traffic": "low"},
    {"id": "ts_r43", "u": "bhongir", "v": "siddipet", "name": "Gajwel Link (Bhongir - Siddipet)", "dist": 65.0, "speed": 80, "traffic": "low"},
    {"id": "ts_r44", "u": "warangal", "v": "ramagundam", "name": "NH 563 (Warangal - Ramagundam)", "dist": 98.0, "speed": 75, "traffic": "low"},
]

# Set default to Telangana State dataset
LOCATIONS_DATA = TELANGANA_LOCATIONS
ROADS_DATA = TELANGANA_ROADS

def build_networkx_graph(roads: List[Dict[str, Any]] = None, locations: List[Dict[str, Any]] = None) -> nx.Graph:
    """Constructs undirected NetworkX graph with node metadata and edge attributes."""
    if roads is None:
        roads = ROADS_DATA
    if locations is None:
        locations = LOCATIONS_DATA

    G = nx.Graph()

    for loc in locations:
        G.add_node(
            loc["id"],
            name=loc["name"],
            lat=loc["lat"],
            lng=loc["lng"],
            category=loc.get("category", "district"),
        )

    for road in roads:
        G.add_edge(
            road["u"],
            road["v"],
            id=road["id"],
            name=road["name"],
            distance=road["dist"],
            speed=road["speed"],
            traffic=road.get("traffic", "low"),
        )

    return G

def export_graph_json(filename: str = "telangana_graph.json") -> None:
    """Exports graph nodes and edges to standard JSON."""
    data = {
        "locations": LOCATIONS_DATA,
        "roads": ROADS_DATA
    }
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
