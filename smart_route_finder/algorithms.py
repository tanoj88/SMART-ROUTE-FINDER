"""
smart_route_finder/algorithms.py
Implementation of graph traversal and pathfinding algorithms:
- Dijkstra's Algorithm (Min-Heap via heapq)
- A* Search (Admissible Haversine Heuristic)
- Breadth-First Search (FIFO Queue via collections.deque)
- Depth-First Search (LIFO Stack)
- Bellman-Ford (Edge Relaxation & Negative Cycle Detection)
- Yen's K-Shortest Paths
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
    """
    Dijkstra's Algorithm using Python's heapq priority queue.
    Guaranteed optimal for non-negative edge weights.
    Time Complexity: O((V + E) log V), Space Complexity: O(V)
    """
    t_start = time.perf_counter()
    dist: Dict[str, float] = {node: float("inf") for node in G.nodes()}
    parent: Dict[str, Optional[str]] = {node: None for node in G.nodes()}
    visited: Set[str] = set()

    dist[source] = 0.0
    pq: List[Tuple[float, str]] = [(0.0, source)]
    nodes_visited_count = 0
    edges_explored = 0

    while pq:
        curr_dist, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        nodes_visited_count += 1

        if u == target:
            break

        for v in G.neighbors(u):
            edges_explored += 1
            edge_data = G[u][v]
            w = calculate_effective_edge_weight(
                distance_km=edge_data["distance"],
                base_speed_kmh=edge_data["speed"],
                traffic_level=edge_data["traffic"],
                preference=preference,
                vehicle_type=vehicle_type,
                hour=hour
            )
            if math.isinf(w):
                continue

            if curr_dist + w < dist[v]:
                dist[v] = curr_dist + w
                parent[v] = u
                heapq.heappush(pq, (dist[v], v))

    exec_time_ms = (time.perf_counter() - t_start) * 1000.0

    # Reconstruct path
    path = []
    curr = target
    while curr is not None:
        path.append(curr)
        curr = parent[curr]
    path.reverse()

    success = (len(path) > 1 and path[0] == source)
    total_dist, total_time = compute_path_metrics(G, path, vehicle_type, hour) if success else (0.0, 0.0)

    return {
        "algorithm": "Dijkstra",
        "path": path if success else [],
        "success": success,
        "distance_km": round(total_dist, 2),
        "time_minutes": round(total_time, 1),
        "nodes_visited": nodes_visited_count,
        "edges_explored": edges_explored,
        "exec_time_ms": round(exec_time_ms, 3),
        "optimal": True,
    }

def astar_search(
    G: nx.Graph,
    source: str,
    target: str,
    preference: str = "fastest",
    vehicle_type: str = "car",
    hour: int = 14
) -> Dict[str, Any]:
    """
    A* Search using Haversine heuristic.
    f(n) = g(n) + h(n). Admissible heuristic ensures guaranteed optimality.
    Time Complexity: O(E) best case, O((V + E) log V) worst case.
    """
    t_start = time.perf_counter()
    target_node = G.nodes[target]
    target_lat, target_lng = target_node["lat"], target_node["lng"]

    def heuristic(u: str) -> float:
        node = G.nodes[u]
        straight_km = haversine_km(node["lat"], node["lng"], target_lat, target_lng)
        if preference == "shortest":
            return straight_km
        elif preference == "fastest":
            max_speed = 80.0
            return (straight_km / max_speed) * 60.0
        return straight_km

    g_score: Dict[str, float] = {node: float("inf") for node in G.nodes()}
    parent: Dict[str, Optional[str]] = {node: None for node in G.nodes()}
    visited: Set[str] = set()

    g_score[source] = 0.0
    pq: List[Tuple[float, str]] = [(heuristic(source), source)]
    nodes_visited_count = 0
    edges_explored = 0

    while pq:
        curr_f, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        nodes_visited_count += 1

        if u == target:
            break

        for v in G.neighbors(u):
            edges_explored += 1
            edge_data = G[u][v]
            w = calculate_effective_edge_weight(
                distance_km=edge_data["distance"],
                base_speed_kmh=edge_data["speed"],
                traffic_level=edge_data["traffic"],
                preference=preference,
                vehicle_type=vehicle_type,
                hour=hour
            )
            if math.isinf(w):
                continue

            tentative_g = g_score[u] + w
            if tentative_g < g_score[v]:
                g_score[v] = tentative_g
                parent[v] = u
                f_score = tentative_g + heuristic(v)
                heapq.heappush(pq, (f_score, v))

    exec_time_ms = (time.perf_counter() - t_start) * 1000.0

    path = []
    curr = target
    while curr is not None:
        path.append(curr)
        curr = parent[curr]
    path.reverse()

    success = (len(path) > 1 and path[0] == source)
    total_dist, total_time = compute_path_metrics(G, path, vehicle_type, hour) if success else (0.0, 0.0)

    return {
        "algorithm": "A* Search",
        "path": path if success else [],
        "success": success,
        "distance_km": round(total_dist, 2),
        "time_minutes": round(total_time, 1),
        "nodes_visited": nodes_visited_count,
        "edges_explored": edges_explored,
        "exec_time_ms": round(exec_time_ms, 3),
        "optimal": True,
    }

def bfs_search(
    G: nx.Graph,
    source: str,
    target: str,
    vehicle_type: str = "car",
    hour: int = 14
) -> Dict[str, Any]:
    """
    Breadth-First Search (BFS) using collections.deque.
    Finds shortest path in terms of hop count (unweighted). Non-optimal for weighted graphs.
    Time Complexity: O(V + E), Space Complexity: O(V)
    """
    t_start = time.perf_counter()
    queue = collections.deque([source])
    visited = {source}
    parent: Dict[str, Optional[str]] = {node: None for node in G.nodes()}
    edges_explored = 0

    found = False
    while queue:
        u = queue.popleft()
        if u == target:
            found = True
            break
        for v in G.neighbors(u):
            edges_explored += 1
            if G[u][v]["traffic"] == "blocked":
                continue
            if v not in visited:
                visited.add(v)
                parent[v] = u
                queue.append(v)

    exec_time_ms = (time.perf_counter() - t_start) * 1000.0

    path = []
    if found:
        curr = target
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

    total_dist, total_time = compute_path_metrics(G, path, vehicle_type, hour) if found else (0.0, 0.0)

    return {
        "algorithm": "BFS",
        "path": path,
        "success": found,
        "distance_km": round(total_dist, 2),
        "time_minutes": round(total_time, 1),
        "nodes_visited": len(visited),
        "edges_explored": edges_explored,
        "exec_time_ms": round(exec_time_ms, 3),
        "optimal": False,
    }

def dfs_search(
    G: nx.Graph,
    source: str,
    target: str,
    vehicle_type: str = "car",
    hour: int = 14
) -> Dict[str, Any]:
    """
    Depth-First Search (DFS) using explicit LIFO stack.
    Explores along each branch before backtracking. Non-optimal.
    Time Complexity: O(V + E), Space Complexity: O(V)
    """
    t_start = time.perf_counter()
    stack = [source]
    visited = set()
    parent: Dict[str, Optional[str]] = {node: None for node in G.nodes()}
    edges_explored = 0

    found = False
    while stack:
        u = stack.pop()
        if u in visited:
            continue
        visited.add(u)

        if u == target:
            found = True
            break

        for v in G.neighbors(u):
            edges_explored += 1
            if G[u][v]["traffic"] == "blocked":
                continue
            if v not in visited:
                parent[v] = u
                stack.append(v)

    exec_time_ms = (time.perf_counter() - t_start) * 1000.0

    path = []
    if found:
        curr = target
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

    total_dist, total_time = compute_path_metrics(G, path, vehicle_type, hour) if found else (0.0, 0.0)

    return {
        "algorithm": "DFS",
        "path": path,
        "success": found,
        "distance_km": round(total_dist, 2),
        "time_minutes": round(total_time, 1),
        "nodes_visited": len(visited),
        "edges_explored": edges_explored,
        "exec_time_ms": round(exec_time_ms, 3),
        "optimal": False,
    }

def bellman_ford_search(
    G: nx.Graph,
    source: str,
    target: str,
    preference: str = "fastest",
    vehicle_type: str = "car",
    hour: int = 14
) -> Dict[str, Any]:
    """
    Bellman-Ford Algorithm: relaxes all |E| edges |V| - 1 times.
    Supports negative weights and cycle detection.
    Time Complexity: O(V * E), Space Complexity: O(V)
    """
    t_start = time.perf_counter()
    dist: Dict[str, float] = {node: float("inf") for node in G.nodes()}
    parent: Dict[str, Optional[str]] = {node: None for node in G.nodes()}
    dist[source] = 0.0

    edges_list = []
    for u, v in G.edges():
        edges_list.append((u, v, G[u][v]))
        edges_list.append((v, u, G[u][v]))

    num_vertices = len(G.nodes())
    edges_explored = 0

    for i in range(num_vertices - 1):
        relaxed_any = False
        for u, v, data in edges_list:
            edges_explored += 1
            if math.isinf(dist[u]):
                continue
            w = calculate_effective_edge_weight(
                distance_km=data["distance"],
                base_speed_kmh=data["speed"],
                traffic_level=data["traffic"],
                preference=preference,
                vehicle_type=vehicle_type,
                hour=hour
            )
            if math.isinf(w):
                continue
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                parent[v] = u
                relaxed_any = True
        if not relaxed_any:
            break

    # Negative cycle check
    has_neg_cycle = False
    for u, v, data in edges_list:
        if math.isinf(dist[u]):
            continue
        w = calculate_effective_edge_weight(
            distance_km=data["distance"],
            base_speed_kmh=data["speed"],
            traffic_level=data["traffic"],
            preference=preference,
            vehicle_type=vehicle_type,
            hour=hour
        )
        if dist[u] + w < dist[v]:
            has_neg_cycle = True
            break

    exec_time_ms = (time.perf_counter() - t_start) * 1000.0

    path = []
    success = (not has_neg_cycle and not math.isinf(dist[target]))
    if success:
        curr = target
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

    total_dist, total_time = compute_path_metrics(G, path, vehicle_type, hour) if success else (0.0, 0.0)

    return {
        "algorithm": "Bellman-Ford",
        "path": path,
        "success": success,
        "distance_km": round(total_dist, 2),
        "time_minutes": round(total_time, 1),
        "nodes_visited": sum(1 for d in dist.values() if not math.isinf(d)),
        "edges_explored": edges_explored,
        "exec_time_ms": round(exec_time_ms, 3),
        "optimal": True,
    }

def compute_path_metrics(
    G: nx.Graph,
    path: List[str],
    vehicle_type: str = "car",
    hour: int = 14
) -> Tuple[float, float]:
    """Helper to compute real accumulated distance and travel time along a path."""
    total_dist = 0.0
    total_time = 0.0
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        if G.has_edge(u, v):
            data = G[u][v]
            d = data["distance"]
            t = calculate_effective_edge_weight(
                distance_km=d,
                base_speed_kmh=data["speed"],
                traffic_level=data["traffic"],
                preference="fastest",
                vehicle_type=vehicle_type,
                hour=hour
            )
            total_dist += d
            total_time += t
    return total_dist, total_time
