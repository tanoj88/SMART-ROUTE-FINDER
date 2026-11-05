"""
smart_route_finder/visualization.py
Generates data visualizations using NetworkX, Matplotlib, and Plotly.
"""

from typing import Dict, List, Any
import matplotlib.pyplot as plt
import networkx as nx
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from traffic import get_hourly_multiplier

def plot_graph_matplotlib(
    G: nx.Graph,
    highlight_path: List[str] = None,
    output_image: str = "network_route.png"
) -> None:
    """
    Renders the Hyderabad network using Matplotlib with GPS coordinate positioning.
    Highlights the optimal route in bold blue.
    """
    plt.figure(figsize=(12, 10))
    pos = {node: (G.nodes[node]["lng"], G.nodes[node]["lat"]) for node in G.nodes()}

    # Draw regular edges with traffic colors
    edge_colors = []
    for u, v in G.edges():
        t = G[u][v].get("traffic", "low")
        if t == "low":
            edge_colors.append("#10b981")
        elif t == "medium":
            edge_colors.append("#f59e0b")
        elif t == "high":
            edge_colors.append("#ef4444")
        else:
            edge_colors.append("#64748b")

    nx.draw_networkx_nodes(G, pos, node_size=350, node_color="#1e293b", edgecolors="#38bdf8", linewidths=1.5)
    nx.draw_networkx_edges(G, pos, width=2.0, edge_color=edge_colors, alpha=0.7)

    # Highlight optimal path
    if highlight_path and len(highlight_path) > 1:
        path_edges = list(zip(highlight_path[:-1], highlight_path[1:]))
        nx.draw_networkx_nodes(
            G, pos, nodelist=highlight_path, node_size=450,
            node_color=["#10b981"] + ["#38bdf8"] * (len(highlight_path) - 2) + ["#f43f5e"]
        )
        nx.draw_networkx_edges(G, pos, edgelist=path_edges, width=5.0, edge_color="#0284c7")

    # Labels
    labels = {n: G.nodes[n]["name"].split()[0] for n in G.nodes()}
    nx.draw_networkx_labels(G, pos, labels=labels, font_size=8, font_family="sans-serif", font_color="#0f172a")

    plt.title("Hyderabad Road Network & Multi-Criteria Route Optimization", fontsize=14, fontweight="bold")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.grid(True, linestyle="--", alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_image, dpi=200)
    plt.close()

def create_comparison_charts_plotly(benchmark_data: List[Dict[str, Any]]) -> go.Figure:
    """
    Creates an interactive Plotly bar chart comparing execution times and nodes visited.
    """
    df = pd.DataFrame(benchmark_data)
    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=df["algorithm"],
        y=df["exec_time_ms"],
        name="Execution Time (ms)",
        marker_color="#38bdf8"
    ))

    fig.add_trace(go.Bar(
        x=df["algorithm"],
        y=df["nodes_visited"],
        name="Nodes Visited",
        marker_color="#818cf8"
    ))

    fig.update_layout(
        title="Algorithm Performance Comparison",
        barmode="group",
        xaxis_title="Algorithm",
        yaxis_title="Metric Value",
        template="plotly_white"
    )
    return fig

def plot_hourly_traffic_curve() -> go.Figure:
    """Generates 24-hour rush-hour multiplier profile."""
    hours = list(range(24))
    multipliers = [get_hourly_multiplier(h) for h in hours]

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=hours,
        y=multipliers,
        mode="lines+markers",
        line=dict(color="#f43f5e", width=3),
        name="Congestion Multiplier"
    ))

    fig.update_layout(
        title="Rush-Hour Traffic Multiplier (0:00 to 23:00)",
        xaxis=dict(title="Hour of Day (24h)", tickmode="linear", dtick=2),
        yaxis=dict(title="Delay Multiplier (x Base)"),
        template="plotly_white"
    )
    return fig
