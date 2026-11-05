# SMART ROUTE FINDER
### Multi-Criteria Route Optimization with Traffic Simulation and Data Visualization
**First-Year B.Tech Project-Based Learning (PBL)**  
**Department of Computer Science & Engineering**

---

## 1. Project Overview
Smart Route Finder is an algorithmic graph intelligence application that computes optimal vehicular paths through complex urban road networks. Grounded in real-world geospatial data from the Hyderabad metropolitan area, the application models dynamic traffic conditions, time-of-day rush hour curves, and multi-criteria trade-offs (Distance, Travel Time, Fuel Cost, and Carbon Footprint).

---

## 2. Key Features
- **Graph Representation**: Adjacency list and NetworkX graph of 22 key Hyderabad landmarks and 42 arterial roads.
- **5 Classic Graph Algorithms**:
  1. **Dijkstra's Algorithm**: Min-Heap priority queue (`heapq`); guarantees mathematically optimal shortest path.
  2. **A\* Search**: Geodesic Haversine Euclidean heuristic $h(n) \le d^*(n, \text{goal})$ ensuring targeted expansion and optimal paths.
  3. **Breadth-First Search (BFS)**: `collections.deque` FIFO queue; finds minimal hop-count paths to demonstrate why hop-count is sub-optimal for weighted graphs.
  4. **Depth-First Search (DFS)**: Explicit LIFO stack traversal demonstrating non-optimal branch exploration.
  5. **Bellman-Ford Algorithm**: Edge relaxation ($V-1$ passes) with negative-cycle detection capabilities.
- **Dynamic Traffic Simulation**:
  - 24-hour congestion curve modeling morning peak (8-10 AM) and evening rush (5-8 PM).
  - Four congestion levels: Low (1.0x), Medium (0.65x speed), High (0.35x speed), Blocked ($\infty$).
- **Multi-Criteria Weight Formulation**:
  - **Shortest**: $\min \sum d_i$ (kilometers)
  - **Fastest**: $\min \sum (d_i / v_{\text{effective}}) \times 60$ (minutes)
  - **Cheapest**: $\min \sum (d_i / \eta_{\text{vehicle}}) \times \text{Price} \times \kappa_{\text{traffic}}$ (INR)
  - **Eco-friendly**: $\min \sum (d_i \times \epsilon_{\text{CO2}} \times \kappa_{\text{traffic}}) / 1000$ (kg $\text{CO}_2$)
- **Data Visualizations**:
  - Interactive Folium/Leaflet HTML map with color-coded traffic lines and route highlighting.
  - Matplotlib geospatial network graphs.
  - Plotly performance benchmarks (Execution Time vs Nodes Visited).

---

## 3. Directory Structure
```
smart_route_finder/
├── app.py              # Main interactive CLI application
├── algorithms.py       # Dijkstra, A*, BFS, DFS, Bellman-Ford implementations
├── graph_data.py       # Hyderabad dataset, NetworkX graph builder, JSON exporter
├── traffic.py          # Traffic simulation, rush-hour models, cost calculations
├── visualization.py    # Matplotlib and Plotly charting routines
├── map_view.py         # Folium interactive HTML map generator
├── requirements.txt    # Python library dependencies
└── README.md           # Project report and setup instructions
```

---

## 4. Installation & Setup

### Prerequisites
- Python 3.9+ (Python 3.10, 3.11, or 3.12 recommended)
- `pip` package manager

### Step 1: Clone or Navigate to Directory
```bash
cd smart_route_finder
```

### Step 2: Create a Virtual Environment (Optional but recommended)
```bash
python -m venv venv
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 5. How to Run

### Run the Interactive Terminal Application
```bash
python app.py
```

### Outputs Generated:
- `hyderabad_route_map.html`: Interactive browser map rendered via Folium. Open in Chrome/Firefox/Safari.
- `network_route.png`: Matplotlib rendering of the road network and optimal path.
- `hyderabad_graph.json`: Exported JSON graph data for web or database integration.

---

## 6. Ten Essential Viva Questions & Model Answers

### Q1: Why does Dijkstra's Algorithm fail when edges have negative weights?
**Answer**: Dijkstra makes a "greedy" choice: once a node is marked as visited (extracted from the priority queue), it assumes the shortest distance to that node has been finalized and never revisits it. If a negative weight edge exists later in the graph, it could decrease the distance to an already-settled node, violating the greedy invariant. Bellman-Ford solves this by relaxing all edges $V-1$ times.

### Q2: What condition must a heuristic satisfy for A* search to guarantee an optimal path?
**Answer**: The heuristic $h(n)$ must be **admissible**, meaning it never overestimates the actual cost from node $n$ to the destination ($h(n) \le d^*(n, \text{dest})$). In our geospatial implementation, straight-line Great-Circle (Haversine) distance is used; because a straight line is the shortest distance between any two points on a sphere, it is mathematically impossible for actual road distance to be shorter than Haversine distance. Thus, $h(n)$ is guaranteed admissible.

### Q3: Why does BFS fail to find the shortest route in road navigation?
**Answer**: BFS explores nodes level by level using an unweighted FIFO queue. It guarantees the path with the **fewest number of edges (intersections)**, but ignores edge weights. A 3-hop path of 100 km each (300 km total) will be chosen by BFS over a 4-hop path of 10 km each (40 km total).

### Q4: Compare the Space and Time Complexity of Adjacency Matrix vs. Adjacency List.
**Answer**:
- **Adjacency Matrix**: Space $O(V^2)$, Edge Lookup $O(1)$, Iterating Neighbors $O(V)$. Inefficient for sparse road networks where $E \ll V^2$.
- **Adjacency List**: Space $O(V + E)$, Edge Lookup $O(\text{deg}(u))$, Iterating Neighbors $O(\text{deg}(u))$. Optimal for sparse transportation graphs.

### Q5: What is the time complexity of Dijkstra's Algorithm with a Binary Min-Heap?
**Answer**: $O((V + E) \log V)$. Every vertex is inserted into the heap ($V \log V$), and for each edge relaxation, the priority in the heap is updated or inserted ($E \log V$). With a Fibonacci Heap, this improves theoretically to $O(E + V \log V)$.

### Q6: How does Bellman-Ford detect negative weight cycles?
**Answer**: In a simple graph without negative cycles, the shortest path between any two vertices contains at most $V-1$ edges. Bellman-Ford runs $V-1$ relaxation passes. If running a $V$-th pass still relaxes any edge ($dist[u] + weight < dist[v]$), it mathematically proves the presence of a negative cycle.

### Q7: What is the trade-off between Dijkstra and A* Search?
**Answer**: Dijkstra performs a uniform radial expansion outward from the source in all directions ($360^\circ$). A* uses the heuristic function $f(n) = g(n) + h(n)$ to direct the priority queue towards the target coordinate, dramatically pruning the number of nodes visited while retaining optimal path accuracy.

### Q8: How does vehicle type impact route calculation in your application?
**Answer**: Different vehicles have different physical characteristics:
- Two-wheelers navigate congested corridors with higher speed retention and high mileage (45 km/L).
- Four-wheelers have standard speed limits and moderate fuel consumption (15 km/L).
- Buses travel at lower average speeds due to stops but offer substantially lower per-commuter $\text{CO}_2$ emissions (28 g/km vs 130 g/km for cars).

### Q9: How is dynamic traffic integrated into the cost function?
**Answer**: Each road edge contains a base speed limit and a traffic level (Low, Medium, High, Blocked). The effective speed is scaled by $v_{\text{eff}} = v_{\text{base}} \times \text{traffic\_factor} / \text{rush\_multiplier}(\text{hour})$. The edge weight under the "Fastest" criterion is calculated as $\text{travel\_time} = (\text{distance} / v_{\text{eff}}) \times 60$.

### Q10: What is the time complexity of Yen's K-Shortest Paths algorithm?
**Answer**: Yen's algorithm finds the top $K$ shortest paths by repeatedly invoking a shortest path algorithm (such as Dijkstra) on perturbed subgraphs. Its time complexity is $O(K \cdot V \cdot (E + V \log V))$.
