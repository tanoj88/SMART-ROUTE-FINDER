"""
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

def print_header():
    print("=" * 72)
    print("       SMART ROUTE FINDER: MULTI-CRITERIA ROUTE OPTIMIZATION")
    print("     B.Tech Project-Based Learning | Python, Graphs & Data Viz")
    print("=" * 72)

def list_locations():
    print("\nAvailable Telangana State Districts & Hubs:")
    print("-" * 65)
    for i, loc in enumerate(LOCATIONS_DATA):
        print(f"[{i + 1:02d}] {loc['id']:<18} : {loc['name']} ({loc['category']})")
    print("-" * 65)

def run_cli():
    print_header()
    current_roads = list(ROADS_DATA)
    G = build_networkx_graph(current_roads)

    source = "hyderabad"
    target = "warangal"
    pref = "fastest"
    vehicle = "car"
    hour = 9

    while True:
        print("\nMAIN MENU:")
        print("  1. Find Route (Select Algorithm & Criteria)")
        print("  2. Benchmark All 5 Algorithms Side-by-Side")
        print("  3. Traffic Simulation (Adjust Time of Day / Randomize)")
        print("  4. Generate Interactive Folium HTML Map")
        print("  5. Generate Matplotlib Network Graph Image")
        print("  6. List All Locations & Connections")
        print("  7. Export Graph Data to JSON")
        print("  8. Exit")

        choice = input("\nEnter choice [1-8]: ").strip()

        if choice == "1":
            list_locations()
            s_idx = input(f"Enter Source number [default Charminar]: ").strip()
            t_idx = input(f"Enter Destination number [default HITEC City]: ").strip()

            if s_idx.isdigit() and 1 <= int(s_idx) <= len(LOCATIONS_DATA):
                source = LOCATIONS_DATA[int(s_idx) - 1]["id"]
            if t_idx.isdigit() and 1 <= int(t_idx) <= len(LOCATIONS_DATA):
                target = LOCATIONS_DATA[int(t_idx) - 1]["id"]

            print("\nSelect Algorithm:")
            print("  1. Dijkstra (Min-Heap Guaranteed Shortest)")
            print("  2. A* Search (Haversine Heuristic Directed)")
            print("  3. BFS (Breadth-First Search - Hop Count)")
            print("  4. DFS (Depth-First Search - Branch Walk)")
            print("  5. Bellman-Ford (Edge Relaxation)")
            algo_choice = input("Choice [1-5, default 1]: ").strip()

            print("\nSelect Optimization Preference:")
            print("  1. Fastest (Minimize travel time with traffic)")
            print("  2. Shortest (Minimize physical distance in km)")
            print("  3. Cheapest (Minimize fuel cost in INR)")
            print("  4. Eco-friendly (Minimize CO2 emissions in kg)")
            p_choice = input("Choice [1-4, default 1]: ").strip()

            p_map = {"1": "fastest", "2": "shortest", "3": "cheapest", "4": "eco"}
            pref = p_map.get(p_choice, "fastest")

            print(f"\nComputing route from '{source}' to '{target}'...")
            if algo_choice == "2":
                res = astar_search(G, source, target, preference=pref, vehicle_type=vehicle, hour=hour)
            elif algo_choice == "3":
                res = bfs_search(G, source, target, vehicle_type=vehicle, hour=hour)
            elif algo_choice == "4":
                res = dfs_search(G, source, target, vehicle_type=vehicle, hour=hour)
            elif algo_choice == "5":
                res = bellman_ford_search(G, source, target, preference=pref, vehicle_type=vehicle, hour=hour)
            else:
                res = dijkstra_shortest_path(G, source, target, preference=pref, vehicle_type=vehicle, hour=hour)

            if res["success"]:
                print("\nROUTE COMPUTATION SUCCESSFUL:")
                print(f"  Algorithm      : {res['algorithm']}")
                print(f"  Optimal Route  : {' -> '.join(res['path'])}")
                print(f"  Total Distance : {res['distance_km']} km")
                print(f"  Estimated Time : {res['time_minutes']} minutes")
                print(f"  Nodes Visited  : {res['nodes_visited']}")
                print(f"  Edges Explored : {res['edges_explored']}")
                print(f"  Execution Time : {res['exec_time_ms']:.3f} ms")
            else:
                print("\n[ERROR] No valid path could be found between nodes.")

        elif choice == "2":
            print(f"\nRunning Full Algorithm Benchmark ({source} -> {target})...")
            d_res = dijkstra_shortest_path(G, source, target, pref, vehicle, hour)
            a_res = astar_search(G, source, target, pref, vehicle, hour)
            b_res = bfs_search(G, source, target, vehicle, hour)
            df_res = dfs_search(G, source, target, vehicle, hour)
            bf_res = bellman_ford_search(G, source, target, pref, vehicle, hour)

            benchmarks = [d_res, a_res, b_res, df_res, bf_res]
            print("\n" + "=" * 80)
            print(f"{'Algorithm':<14} | {'Dist(km)':<8} | {'Time(min)':<9} | {'Nodes':<6} | {'Exec(ms)':<9} | {'Optimal?':<8}")
            print("-" * 80)
            for b in benchmarks:
                print(f"{b['algorithm']:<14} | {b['distance_km']:<8} | {b['time_minutes']:<9} | {b['nodes_visited']:<6} | {b['exec_time_ms']:<9.3f} | {str(b['optimal']):<8}")
            print("=" * 80)
            print("NOTE: Dijkstra & A* guarantee shortest weighted path.")
            print("      A* is faster because the Haversine heuristic prunes search branches.")
            print("      BFS finds minimum hops; DFS explores non-optimal deep branches.")

        elif choice == "3":
            print("\nTRAFFIC SIMULATION:")
            print("  1. Set Hour of Day (0 - 23)")
            print("  2. Randomize Road Traffic")
            print("  3. Reset to Baseline Traffic")
            t_sub = input("Choice: ").strip()
            if t_sub == "1":
                h_str = input("Enter hour (0-23): ").strip()
                if h_str.isdigit() and 0 <= int(h_str) <= 23:
                    hour = int(h_str)
                    mult = get_hourly_multiplier(hour)
                    print(f"Hour set to {hour}:00. Current rush-hour delay factor: {mult:.2f}x")
            elif t_sub == "2":
                current_roads = randomize_traffic(current_roads)
                G = build_networkx_graph(current_roads)
                print("Traffic randomized across Hyderabad network.")
            elif t_sub == "3":
                current_roads = list(ROADS_DATA)
                G = build_networkx_graph(current_roads)
                print("Reset to default traffic state.")

        elif choice == "4":
            print("Generating interactive Folium HTML map...")
            res = dijkstra_shortest_path(G, source, target, pref, vehicle, hour)
            path = res["path"] if res["success"] else []
            generate_folium_map(G, route_path=path, output_html="hyderabad_route_map.html")
            print("Saved map to 'hyderabad_route_map.html'. Open in any browser!")

        elif choice == "5":
            print("Generating Matplotlib network visualization...")
            res = dijkstra_shortest_path(G, source, target, pref, vehicle, hour)
            path = res["path"] if res["success"] else []
            plot_graph_matplotlib(G, highlight_path=path, output_image="network_route.png")
            print("Saved plot to 'network_route.png'!")

        elif choice == "6":
            list_locations()
            print(f"Total Nodes: {len(G.nodes())}, Total Edges: {len(G.edges())}")

        elif choice == "7":
            export_graph_json("hyderabad_graph.json")
            print("Saved graph dataset to 'hyderabad_graph.json'!")

        elif choice == "8":
            print("Thank you for using Smart Route Finder. Exiting.")
            break

if __name__ == "__main__":
    run_cli()
