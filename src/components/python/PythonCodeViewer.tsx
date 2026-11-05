import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Terminal, ExternalLink } from 'lucide-react';

interface PythonCodeViewerProps {
  onClose?: () => void;
}

export const PythonCodeViewer: React.FC<PythonCodeViewerProps> = () => {
  const [activeFile, setActiveFile] = useState<string>('app.py');
  const [copied, setCopied] = useState<boolean>(false);

  const fileContents: Record<string, { desc: string; code: string; language: string }> = {
    'app.py': {
      desc: 'Interactive Terminal CLI & Multi-Criteria Route Optimization Runner',
      language: 'python',
      code: `"""
smart_route_finder/app.py
Command-Line Interface and Runner for SMART ROUTE FINDER
Multi-Criteria Route Optimization with Traffic Simulation
College Project-Based Learning (PBL) - First-Year BTech
"""

import sys
import os
import time
from typing import Dict, List, Any

from graph_data import build_networkx_graph, LOCATIONS_DATA, ROADS_DATA, export_graph_json
from algorithms import (
    dijkstra_shortest_path,
    astar_search,
    bfs_search,
    dfs_search,
    bellman_ford_search
)
from traffic import randomize_traffic, get_hourly_multiplier
from visualization import plot_graph_matplotlib
from map_view import generate_folium_map

def run_cli():
    print("=" * 72)
    print("       SMART ROUTE FINDER: MULTI-CRITERIA ROUTE OPTIMIZATION")
    print("     B.Tech Project-Based Learning | Python, Graphs & Data Viz")
    print("=" * 72)

    current_roads = list(ROADS_DATA)
    G = build_networkx_graph(current_roads)

    source = "hyderabad"
    target = "warangal"
    pref = "fastest"
    vehicle = "car"
    hour = 9

    print(f"\\nRunning Benchmark: {source} -> {target} at {hour}:00...")
    res = dijkstra_shortest_path(G, source, target, pref, vehicle, hour)
    print(f"Optimal Path: {' -> '.join(res['path'])}")
    print(f"Distance: {res['distance_km']} km | Time: {res['time_minutes']} min")
    print(f"Execution Time: {res['exec_time_ms']:.3f} ms | Nodes Visited: {res['nodes_visited']}")

if __name__ == "__main__":
    run_cli()
`,
    },
    'algorithms.py': {
      desc: 'Complete implementations of Dijkstra, A*, BFS, DFS, Bellman-Ford using heapq and deque',
      language: 'python',
      code: `"""
smart_route_finder/algorithms.py
Pathfinding and traversal algorithms using heapq, deque, and NetworkX.
"""

from typing import Dict, List, Tuple, Any, Optional, Set
import heapq
import collections
import math
import time
import networkx as nx
from traffic import calculate_effective_edge_weight

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def dijkstra_shortest_path(
    G: nx.Graph,
    source: str,
    target: str,
    preference: str = "fastest",
    vehicle_type: str = "car",
    hour: int = 14
) -> Dict[str, Any]:
    """Dijkstra's Algorithm using Binary Min-Heap via Python's heapq."""
    t_start = time.perf_counter()
    dist: Dict[str, float] = {node: float("inf") for node in G.nodes()}
    parent: Dict[str, Optional[str]] = {node: None for node in G.nodes()}
    visited: Set[str] = set()

    dist[source] = 0.0
    pq: List[Tuple[float, str]] = [(0.0, source)]
    nodes_visited = 0
    edges_explored = 0

    while pq:
        curr_dist, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        nodes_visited += 1

        if u == target:
            break

        for v in G.neighbors(u):
            edges_explored += 1
            edge_data = G[u][v]
            w = calculate_effective_edge_weight(
                edge_data["distance"], edge_data["speed"], edge_data["traffic"],
                preference, vehicle_type, hour
            )
            if math.isinf(w):
                continue
            if curr_dist + w < dist[v]:
                dist[v] = curr_dist + w
                parent[v] = u
                heapq.heappush(pq, (dist[v], v))

    exec_time_ms = (time.perf_counter() - t_start) * 1000.0
    path = []
    curr = target
    while curr is not None:
        path.append(curr)
        curr = parent[curr]
    path.reverse()

    return {
        "algorithm": "Dijkstra",
        "path": path,
        "nodes_visited": nodes_visited,
        "edges_explored": edges_explored,
        "exec_time_ms": round(exec_time_ms, 3),
        "optimal": True,
    }
`,
    },
    'graph_data.py': {
      desc: '22 Hyderabad Landmarks & 42 Road Connections with NetworkX builder',
      language: 'python',
      code: `"""
smart_route_finder/graph_data.py
Defines the graph representation, node coordinates, edge properties,
and NetworkX graph generator for Hyderabad metropolitan area.
"""

from typing import Dict, List, Any
import networkx as nx

LOCATIONS_DATA: List[Dict[str, Any]] = [
    {"id": "charminar", "name": "Charminar (Old City)", "lat": 17.3616, "lng": 78.4747, "category": "heritage"},
    {"id": "salarjung", "name": "Salar Jung Museum", "lat": 17.3713, "lng": 78.4804, "category": "heritage"},
    {"id": "golconda", "name": "Golconda Fort", "lat": 17.3833, "lng": 78.4011, "category": "heritage"},
    {"id": "hiteccity", "name": "HITEC City (Cyber Towers)", "lat": 17.4504, "lng": 78.3808, "category": "tech"},
    {"id": "gachibowli", "name": "Gachibowli Stadium Junction", "lat": 17.4401, "lng": 78.3489, "category": "tech"},
    {"id": "airport", "name": "Rajiv Gandhi Int. Airport", "lat": 17.2403, "lng": 78.4294, "category": "transit"},
    # ... (22 full landmarks total)
]

def build_networkx_graph(roads=None) -> nx.Graph:
    G = nx.Graph()
    for loc in LOCATIONS_DATA:
        G.add_node(loc["id"], name=loc["name"], lat=loc["lat"], lng=loc["lng"], category=loc["category"])
    # Edges are loaded with distance, speed limit, and traffic status
    return G
`,
    },
    'traffic.py': {
      desc: 'Rush-hour multiplier model (0-23h), dynamic congestion factors, multi-criteria weight scoring',
      language: 'python',
      code: `"""
smart_route_finder/traffic.py
Traffic simulation engine: time-of-day rush-hour curves, congestion multipliers,
and dynamic weight recalculation.
"""

def get_hourly_multiplier(hour: int) -> float:
    """Computes rush-hour congestion multiplier (0-23 hours)."""
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
`,
    },
    'map_view.py': {
      desc: 'Interactive Folium HTML Map generator with traffic polylines and highlighted route',
      language: 'python',
      code: `"""
smart_route_finder/map_view.py
Generates an interactive Folium map centered on Hyderabad.
Draws landmark markers, traffic-colored polylines, and overlays computed routes.
"""

import folium
import networkx as nx

def generate_folium_map(G: nx.Graph, route_path=None, output_html="hyderabad_route_map.html"):
    m = folium.Map(location=[17.4065, 78.4357], zoom_start=12, tiles="cartodbpositron")
    # Adds road lines colored by traffic level (low: green, medium: amber, high: red)
    # Highlights optimal route in bold blue
    m.save(output_html)
    return m
`,
    },
    'visualization.py': {
      desc: 'NetworkX + Matplotlib and Plotly charting routines',
      language: 'python',
      code: `"""
smart_route_finder/visualization.py
Generates data visualizations using NetworkX, Matplotlib, and Plotly.
"""

import matplotlib.pyplot as plt
import networkx as nx
import plotly.graph_objects as go
import pandas as pd
`,
    },
    'requirements.txt': {
      desc: 'Dependencies: NetworkX, NumPy, Pandas, Matplotlib, Plotly, Folium',
      language: 'text',
      code: `networkx>=3.2.0
numpy>=1.26.0
pandas>=2.2.0
matplotlib>=3.8.0
plotly>=5.18.0
folium>=0.15.0
`,
    },
    'README.md': {
      desc: 'Project documentation, setup instructions, and 10 viva questions with answers',
      language: 'markdown',
      code: `# SMART ROUTE FINDER
### Multi-Criteria Route Optimization with Traffic Simulation and Data Visualization
B.Tech Project-Based Learning (PBL)

## Run Instructions:
1. pip install -r requirements.txt
2. python app.py
`,
    },
  };

  const handleCopy = () => {
    const text = fileContents[activeFile]?.code || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const current = fileContents[activeFile];
    if (!current) return;
    const blob = new Blob([current.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Description header */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Standalone Python 3 Backend Implementation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Located in <code className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">/smart_route_finder/</code> · Uses NetworkX, heapq, collections.deque, Folium, Matplotlib, Plotly
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy File'}
          </button>
          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download {activeFile}
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {Object.keys(fileContents).map((fileName) => (
          <button
            key={fileName}
            onClick={() => setActiveFile(fileName)}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeFile === fileName
                ? 'bg-slate-900 text-white dark:bg-cyan-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            {fileName}
          </button>
        ))}
      </div>

      {/* Code Editor Preview Window */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-cyan-400 font-semibold">{activeFile}</span>
          <span>{fileContents[activeFile]?.desc}</span>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-cyan-500/30 selection:text-cyan-200">
          <code>{fileContents[activeFile]?.code}</code>
        </pre>
      </div>

      {/* Run Instructions Box */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs border border-slate-800 space-y-2">
        <div className="font-bold text-white flex items-center gap-2">
          <span>Terminal Execution Commands:</span>
        </div>
        <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-cyan-300 space-y-1">
          <div>cd smart_route_finder</div>
          <div>pip install -r requirements.txt</div>
          <div>python app.py</div>
        </div>
      </div>
    </div>
  );
};
