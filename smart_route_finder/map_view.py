"""
smart_route_finder/map_view.py
Generates an interactive Folium map centered on Hyderabad.
Draws landmark markers, traffic-colored polylines, and overlays computed routes.
"""

from typing import List, Dict, Any
import folium
import networkx as nx

def generate_folium_map(
    G: nx.Graph,
    route_path: List[str] = None,
    output_html: str = "hyderabad_route_map.html"
) -> folium.Map:
    """
    Creates an interactive Leaflet/Folium map with road traffic status and route overlay.
    """
    # Dynamic center calculated from active node coordinates
    lats = [data["lat"] for _, data in G.nodes(data=True)]
    lngs = [data["lng"] for _, data in G.nodes(data=True)]
    center_lat = (max(lats) + min(lats)) / 2.0 if lats else 17.8500
    center_lng = (max(lngs) + min(lngs)) / 2.0 if lngs else 79.1500
    zoom = 8 if (max(lats) - min(lats)) > 1.0 else 12

    m = folium.Map(location=[center_lat, center_lng], zoom_start=zoom, tiles="cartodbpositron")

    # Traffic color palette
    traffic_colors = {
        "low": "#10b981",
        "medium": "#f59e0b",
        "high": "#ef4444",
        "blocked": "#475569"
    }

    # Add road polylines
    for u, v in G.edges():
        u_node = G.nodes[u]
        v_node = G.nodes[v]
        edge_data = G[u][v]
        t_level = edge_data.get("traffic", "low")
        color = traffic_colors.get(t_level, "#10b981")

        line = folium.PolyLine(
            locations=[[u_node["lat"], u_node["lng"]], [v_node["lat"], v_node["lng"]]],
            color=color,
            weight=4 if t_level != "blocked" else 2,
            opacity=0.7,
            dash_array="5, 5" if t_level == "blocked" else None,
            tooltip=f"{edge_data.get('name', 'Road')}: {edge_data.get('distance')} km | Traffic: {t_level.upper()}"
        )
        line.add_to(m)

    # Highlight computed route
    if route_path and len(route_path) > 1:
        route_coords = [[G.nodes[n]["lat"], G.nodes[n]["lng"]] for n in route_path]
        folium.PolyLine(
            locations=route_coords,
            color="#0284c7",
            weight=7,
            opacity=0.9,
            tooltip="Computed Optimal Route"
        ).add_to(m)

    # Add markers for nodes
    for node_id, data in G.nodes(data=True):
        is_source = route_path and node_id == route_path[0]
        is_dest = route_path and node_id == route_path[-1]
        is_on_route = route_path and node_id in route_path

        marker_color = "green" if is_source else ("red" if is_dest else ("blue" if is_on_route else "gray"))
        icon_name = "play" if is_source else ("flag" if is_dest else "info-sign")

        folium.Marker(
            location=[data["lat"], data["lng"]],
            popup=f"<b>{data['name']}</b><br>Category: {data.get('category', 'landmark').title()}",
            tooltip=data["name"],
            icon=folium.Icon(color=marker_color, icon=icon_name)
        ).add_to(m)

    m.save(output_html)
    return m
