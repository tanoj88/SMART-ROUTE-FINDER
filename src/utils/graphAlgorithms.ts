import {
  AlgorithmBenchmark,
  AlgorithmType,
  AlternativeRoute,
  LocationNode,
  RoadEdge,
  RoutePreference,
  RouteResult,
  RouteStep,
  SearchAnimationStep,
  TrafficLevel,
  VehicleType,
} from '../types';
import { VEHICLE_CONFIGS } from '../data/defaultGraph';

// ---------------------------------------------------------------------------
// 1. DATA STRUCTURES IMPLEMENTATIONS (Core DSA Curriculum)
// ---------------------------------------------------------------------------

/**
 * Min-Priority Queue implemented using a Binary Min-Heap.
 * Time Complexity: Insert O(log N), Extract-Min O(log N), Peek O(1).
 */
export class MinPriorityQueue<T> {
  private heap: { priority: number; item: T }[] = [];

  enqueue(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const root = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return root.item;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  size(): number {
    return this.heap.length;
  }

  getAllItems(): { item: T; priority: number }[] {
    return [...this.heap];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority < this.heap[parentIndex].priority) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * FIFO Queue for Breadth-First Search (BFS)
 */
export class FIFOQueue<T> {
  private items: T[] = [];
  enqueue(item: T): void { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
}

/**
 * LIFO Stack for Depth-First Search (DFS)
 */
export class LIFOStack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
}

// ---------------------------------------------------------------------------
// 2. MATHEMATICAL HEURISTICS & WEIGHT CALCULATIONS
// ---------------------------------------------------------------------------

/**
 * Haversine formula to compute geodesic great-circle distance between two GPS coordinates in km.
 * Serves as an admissible heuristic h(n) <= d*(n, goal) for A* Search.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Traffic delay multiplier based on road condition
 */
export function getTrafficSpeedMultiplier(level: TrafficLevel): number {
  switch (level) {
    case 'low': return 1.0;
    case 'medium': return 0.65; // ~35% slower
    case 'high': return 0.35; // ~65% slower
    case 'blocked': return 0.0001; // impassable
  }
}

/**
 * Calculate the effective cost of traversing an edge under chosen criteria
 */
export function getEdgeTraversalCost(
  edge: RoadEdge,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0 // from rush hour simulation
): { weight: number; distanceKm: number; timeMinutes: number; costInr: number; co2Kg: number; passable: boolean } {
  if (edge.trafficLevel === 'blocked') {
    return {
      weight: Infinity,
      distanceKm: edge.distanceKm,
      timeMinutes: Infinity,
      costInr: Infinity,
      co2Kg: Infinity,
      passable: false,
    };
  }

  const vConfig = VEHICLE_CONFIGS[vehicle];
  const trafficFactor = getTrafficSpeedMultiplier(edge.trafficLevel) * timeMultiplier;
  const effectiveSpeedKmh = Math.max(5, edge.baseSpeedKmh * vConfig.avgSpeedMultiplier * trafficFactor);

  const distanceKm = edge.distanceKm;
  const timeMinutes = (distanceKm / effectiveSpeedKmh) * 60;

  // Fuel consumption affected by stop-and-go congestion
  const congestionFuelFactor = edge.trafficLevel === 'high' ? 1.4 : edge.trafficLevel === 'medium' ? 1.15 : 1.0;
  const fuelUsedLiters = (distanceKm / vConfig.fuelEfficiencyKmPerLiter) * congestionFuelFactor;
  const costInr = fuelUsedLiters * vConfig.fuelPricePerLiter;

  // CO2 footprint in kg
  const co2Kg = (distanceKm * vConfig.co2GramsPerKm * congestionFuelFactor) / 1000;

  let weight = distanceKm;
  switch (preference) {
    case 'shortest':
      weight = distanceKm;
      break;
    case 'fastest':
      weight = timeMinutes; // in minutes
      break;
    case 'cheapest':
      weight = costInr; // in INR
      break;
    case 'eco':
      weight = co2Kg; // in kg CO2
      break;
  }

  return { weight, distanceKm, timeMinutes, costInr, co2Kg, passable: true };
}

// ---------------------------------------------------------------------------
// 3. GRAPH ADJACENCY STRUCTURE
// ---------------------------------------------------------------------------

export interface GraphAdjacency {
  locations: Map<string, LocationNode>;
  adj: Map<string, { neighborId: string; edge: RoadEdge }[]>;
}

export function buildAdjacencyList(nodes: LocationNode[], edges: RoadEdge[]): GraphAdjacency {
  const locations = new Map<string, LocationNode>();
  nodes.forEach((n) => locations.set(n.id, n));

  const adj = new Map<string, { neighborId: string; edge: RoadEdge }[]>();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((edge) => {
    if (adj.has(edge.u) && adj.has(edge.v)) {
      adj.get(edge.u)!.push({ neighborId: edge.v, edge });
      if (!edge.isOneWay) {
        adj.get(edge.v)!.push({ neighborId: edge.u, edge });
      }
    }
  });

  return { locations, adj };
}

// ---------------------------------------------------------------------------
// 4. ROUTE RECONSTRUCTION & STATS
// ---------------------------------------------------------------------------

export function reconstructPath(
  parentMap: Map<string, { fromNode: string; edge: RoadEdge }>,
  sourceId: string,
  destId: string,
  locations: Map<string, LocationNode>,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): {
  path: string[];
  pathNodes: LocationNode[];
  steps: RouteStep[];
  totalDistanceKm: number;
  totalTimeMinutes: number;
  totalCostInr: number;
  totalCo2Kg: number;
} {
  const path: string[] = [];
  const edges: RoadEdge[] = [];
  let curr = destId;

  while (curr !== sourceId) {
    path.unshift(curr);
    const parentInfo = parentMap.get(curr);
    if (!parentInfo) break;
    edges.unshift(parentInfo.edge);
    curr = parentInfo.fromNode;
  }
  path.unshift(sourceId);

  const pathNodes = path.map((id) => locations.get(id)!).filter(Boolean);

  let totalDistanceKm = 0;
  let totalTimeMinutes = 0;
  let totalCostInr = 0;
  let totalCo2Kg = 0;
  const steps: RouteStep[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edge = edges[i];
    if (edge) {
      const stats = getEdgeTraversalCost(edge, preference, vehicle, timeMultiplier);
      totalDistanceKm += stats.distanceKm;
      totalTimeMinutes += stats.timeMinutes;
      totalCostInr += stats.costInr;
      totalCo2Kg += stats.co2Kg;

      const fromNode = locations.get(u);
      const toNode = locations.get(v);

      steps.push({
        stepNumber: i + 1,
        fromNodeId: u,
        toNodeId: v,
        fromName: fromNode ? fromNode.name : u,
        toName: toNode ? toNode.name : v,
        roadName: edge.name,
        distanceKm: Number(stats.distanceKm.toFixed(1)),
        timeMinutes: Number(stats.timeMinutes.toFixed(1)),
        instruction: `Head onto ${edge.name} towards ${toNode?.name || v} (${stats.distanceKm.toFixed(1)} km, ~${Math.round(stats.timeMinutes)} min)`,
      });
    }
  }

  return {
    path,
    pathNodes,
    steps,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalTimeMinutes: Number(totalTimeMinutes.toFixed(1)),
    totalCostInr: Number(totalCostInr.toFixed(1)),
    totalCo2Kg: Number(totalCo2Kg.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// 5. ALGORITHMS IMPLEMENTATION
// ---------------------------------------------------------------------------

/**
 * DIJKSTRA'S ALGORITHM
 * Guaranteed optimal shortest path in weighted graphs with non-negative edge weights.
 * Uses a Binary Min-Heap Priority Queue.
 * Time: O((V + E) log V), Space: O(V)
 */
export function runDijkstra(
  graph: GraphAdjacency,
  sourceId: string,
  destId: string,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): RouteResult {
  const startTime = performance.now();
  const searchSteps: SearchAnimationStep[] = [];
  const visitedOrder: string[] = [];

  const distances = new Map<string, number>();
  const parentMap = new Map<string, { fromNode: string; edge: RoadEdge }>();
  const visited = new Set<string>();
  const pq = new MinPriorityQueue<string>();

  graph.locations.forEach((_, id) => {
    distances.set(id, Infinity);
  });
  distances.set(sourceId, 0);
  pq.enqueue(sourceId, 0);

  let edgesExplored = 0;

  searchSteps.push({
    type: 'frontier',
    nodeId: sourceId,
    distanceSoFar: 0,
    description: `Start at source: ${graph.locations.get(sourceId)?.name || sourceId} with initial cost 0`,
    frontierSnapshot: [sourceId],
    visitedSnapshot: [],
  });

  let found = false;

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    if (visited.has(current)) continue;

    visited.add(current);
    visitedOrder.push(current);

    searchSteps.push({
      type: 'visit',
      nodeId: current,
      distanceSoFar: distances.get(current) || 0,
      description: `Exploring node ${graph.locations.get(current)?.name || current} (current cost: ${(distances.get(current) || 0).toFixed(2)})`,
      frontierSnapshot: pq.getAllItems().map((x) => x.item),
      visitedSnapshot: Array.from(visited),
    });

    if (current === destId) {
      found = true;
      searchSteps.push({
        type: 'finish',
        nodeId: current,
        distanceSoFar: distances.get(current) || 0,
        description: `Destination reached! Optimal path found with total cost: ${(distances.get(current) || 0).toFixed(2)}`,
        frontierSnapshot: [],
        visitedSnapshot: Array.from(visited),
      });
      break;
    }

    const neighbors = graph.adj.get(current) || [];
    for (const { neighborId, edge } of neighbors) {
      edgesExplored++;
      const cost = getEdgeTraversalCost(edge, preference, vehicle, timeMultiplier);
      if (!cost.passable) continue;

      const newDist = (distances.get(current) || 0) + cost.weight;
      if (newDist < (distances.get(neighborId) || Infinity)) {
        distances.set(neighborId, newDist);
        parentMap.set(neighborId, { fromNode: current, edge });
        pq.enqueue(neighborId, newDist);

        searchSteps.push({
          type: 'relax',
          nodeId: neighborId,
          edgeId: edge.id,
          distanceSoFar: newDist,
          description: `Relaxed edge ${edge.name} to ${graph.locations.get(neighborId)?.name || neighborId} (new cost: ${newDist.toFixed(2)})`,
          frontierSnapshot: pq.getAllItems().map((x) => x.item),
          visitedSnapshot: Array.from(visited),
        });
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;

  if (!found) {
    return {
      algorithm: 'dijkstra',
      preference,
      vehicle,
      sourceId,
      destinationId: destId,
      path: [],
      pathNodes: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      totalCostInr: 0,
      totalCo2Kg: 0,
      nodesVisitedCount: visited.size,
      visitedOrder,
      edgesExploredCount: edgesExplored,
      executionTimeMs: Number(executionTimeMs.toFixed(3)),
      isOptimal: true,
      steps: [],
      searchSteps,
      success: false,
      errorMessage: `No route exists between selected locations. Road network is blocked or disconnected.`,
    };
  }

  const details = reconstructPath(parentMap, sourceId, destId, graph.locations, preference, vehicle, timeMultiplier);

  return {
    algorithm: 'dijkstra',
    preference,
    vehicle,
    sourceId,
    destinationId: destId,
    path: details.path,
    pathNodes: details.pathNodes,
    totalDistanceKm: details.totalDistanceKm,
    totalTimeMinutes: details.totalTimeMinutes,
    totalCostInr: details.totalCostInr,
    totalCo2Kg: details.totalCo2Kg,
    nodesVisitedCount: visited.size,
    visitedOrder,
    edgesExploredCount: edgesExplored,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    isOptimal: true,
    steps: details.steps,
    searchSteps,
    success: true,
  };
}

/**
 * A* SEARCH ALGORITHM
 * Heuristically guided search: f(n) = g(n) + h(n).
 * Uses Haversine Euclidean Distance as an admissible heuristic.
 * Visits fewer nodes than Dijkstra while maintaining optimality guarantee!
 * Time: O(E) in best case, O((V+E) log V) in worst case.
 */
export function runAStar(
  graph: GraphAdjacency,
  sourceId: string,
  destId: string,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): RouteResult {
  const startTime = performance.now();
  const searchSteps: SearchAnimationStep[] = [];
  const visitedOrder: string[] = [];

  const destNode = graph.locations.get(destId);
  if (!destNode) {
    return {
      algorithm: 'astar',
      preference,
      vehicle,
      sourceId,
      destinationId: destId,
      path: [],
      pathNodes: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      totalCostInr: 0,
      totalCo2Kg: 0,
      nodesVisitedCount: 0,
      visitedOrder: [],
      edgesExploredCount: 0,
      executionTimeMs: 0,
      isOptimal: true,
      steps: [],
      searchSteps: [],
      success: false,
      errorMessage: 'Destination location not found in map.',
    };
  }

  const getHeuristic = (nodeId: string): number => {
    const node = graph.locations.get(nodeId);
    if (!node || !destNode) return 0;
    const straightDistKm = haversineDistanceKm(node.lat, node.lng, destNode.lat, destNode.lng);

    switch (preference) {
      case 'shortest':
        return straightDistKm;
      case 'fastest': {
        const maxHighwaySpeed = 80 * VEHICLE_CONFIGS[vehicle].avgSpeedMultiplier;
        return (straightDistKm / maxHighwaySpeed) * 60; // in minutes
      }
      case 'cheapest': {
        const vConfig = VEHICLE_CONFIGS[vehicle];
        return (straightDistKm / vConfig.fuelEfficiencyKmPerLiter) * vConfig.fuelPricePerLiter;
      }
      case 'eco': {
        const vConfig = VEHICLE_CONFIGS[vehicle];
        return (straightDistKm * vConfig.co2GramsPerKm) / 1000;
      }
    }
  };

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const parentMap = new Map<string, { fromNode: string; edge: RoadEdge }>();
  const visited = new Set<string>();
  const openSet = new MinPriorityQueue<string>();

  graph.locations.forEach((_, id) => {
    gScore.set(id, Infinity);
    fScore.set(id, Infinity);
  });

  gScore.set(sourceId, 0);
  const startH = getHeuristic(sourceId);
  fScore.set(sourceId, startH);
  openSet.enqueue(sourceId, startH);

  let edgesExplored = 0;
  let found = false;

  searchSteps.push({
    type: 'frontier',
    nodeId: sourceId,
    distanceSoFar: 0,
    description: `A* initialized with h(source) = ${startH.toFixed(2)} based on Haversine distance to target`,
    frontierSnapshot: [sourceId],
    visitedSnapshot: [],
  });

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;
    if (visited.has(current)) continue;

    visited.add(current);
    visitedOrder.push(current);

    searchSteps.push({
      type: 'visit',
      nodeId: current,
      distanceSoFar: gScore.get(current) || 0,
      description: `A* expanding node ${graph.locations.get(current)?.name || current} with f = ${(fScore.get(current) || 0).toFixed(2)} (g: ${(gScore.get(current) || 0).toFixed(2)}, h: ${getHeuristic(current).toFixed(2)})`,
      frontierSnapshot: openSet.getAllItems().map((x) => x.item),
      visitedSnapshot: Array.from(visited),
    });

    if (current === destId) {
      found = true;
      searchSteps.push({
        type: 'finish',
        nodeId: current,
        distanceSoFar: gScore.get(current) || 0,
        description: `Target reached! A* focused heuristic arrived at destination having visited ${visited.size} nodes`,
        frontierSnapshot: [],
        visitedSnapshot: Array.from(visited),
      });
      break;
    }

    const neighbors = graph.adj.get(current) || [];
    for (const { neighborId, edge } of neighbors) {
      edgesExplored++;
      const cost = getEdgeTraversalCost(edge, preference, vehicle, timeMultiplier);
      if (!cost.passable) continue;

      const tentativeG = (gScore.get(current) || 0) + cost.weight;
      if (tentativeG < (gScore.get(neighborId) || Infinity)) {
        parentMap.set(neighborId, { fromNode: current, edge });
        gScore.set(neighborId, tentativeG);
        const h = getHeuristic(neighborId);
        const f = tentativeG + h;
        fScore.set(neighborId, f);
        openSet.enqueue(neighborId, f);

        searchSteps.push({
          type: 'relax',
          nodeId: neighborId,
          edgeId: edge.id,
          distanceSoFar: tentativeG,
          description: `Relaxed ${edge.name} -> ${graph.locations.get(neighborId)?.name || neighborId} (g: ${tentativeG.toFixed(2)}, f: ${f.toFixed(2)})`,
          frontierSnapshot: openSet.getAllItems().map((x) => x.item),
          visitedSnapshot: Array.from(visited),
        });
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;

  if (!found) {
    return {
      algorithm: 'astar',
      preference,
      vehicle,
      sourceId,
      destinationId: destId,
      path: [],
      pathNodes: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      totalCostInr: 0,
      totalCo2Kg: 0,
      nodesVisitedCount: visited.size,
      visitedOrder,
      edgesExploredCount: edgesExplored,
      executionTimeMs: Number(executionTimeMs.toFixed(3)),
      isOptimal: true,
      steps: [],
      searchSteps,
      success: false,
      errorMessage: 'No passable route found using A* search.',
    };
  }

  const details = reconstructPath(parentMap, sourceId, destId, graph.locations, preference, vehicle, timeMultiplier);

  return {
    algorithm: 'astar',
    preference,
    vehicle,
    sourceId,
    destinationId: destId,
    path: details.path,
    pathNodes: details.pathNodes,
    totalDistanceKm: details.totalDistanceKm,
    totalTimeMinutes: details.totalTimeMinutes,
    totalCostInr: details.totalCostInr,
    totalCo2Kg: details.totalCo2Kg,
    nodesVisitedCount: visited.size,
    visitedOrder,
    edgesExploredCount: edgesExplored,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    isOptimal: true,
    steps: details.steps,
    searchSteps,
    success: true,
  };
}

/**
 * BREADTH-FIRST SEARCH (BFS)
 * Unweighted shortest path: minimizes number of edge hops, ignoring road distance & weights!
 * Illustrates why BFS does NOT guarantee shortest weighted distance.
 * Uses FIFO Queue.
 * Time: O(V + E), Space: O(V)
 */
export function runBFS(
  graph: GraphAdjacency,
  sourceId: string,
  destId: string,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): RouteResult {
  const startTime = performance.now();
  const searchSteps: SearchAnimationStep[] = [];
  const visitedOrder: string[] = [];

  const queue = new FIFOQueue<string>();
  const visited = new Set<string>();
  const parentMap = new Map<string, { fromNode: string; edge: RoadEdge }>();

  queue.enqueue(sourceId);
  visited.add(sourceId);

  let edgesExplored = 0;
  let found = false;

  searchSteps.push({
    type: 'frontier',
    nodeId: sourceId,
    distanceSoFar: 0,
    description: `BFS Enqueue source: ${graph.locations.get(sourceId)?.name || sourceId}`,
    frontierSnapshot: [sourceId],
    visitedSnapshot: [sourceId],
  });

  while (!queue.isEmpty()) {
    const current = queue.dequeue()!;
    visitedOrder.push(current);

    searchSteps.push({
      type: 'visit',
      nodeId: current,
      distanceSoFar: 0,
      description: `BFS level-order processing node: ${graph.locations.get(current)?.name || current}`,
      frontierSnapshot: [],
      visitedSnapshot: Array.from(visited),
    });

    if (current === destId) {
      found = true;
      searchSteps.push({
        type: 'finish',
        nodeId: current,
        distanceSoFar: 0,
        description: `BFS reached target with fewest edge hops`,
        frontierSnapshot: [],
        visitedSnapshot: Array.from(visited),
      });
      break;
    }

    const neighbors = graph.adj.get(current) || [];
    for (const { neighborId, edge } of neighbors) {
      edgesExplored++;
      if (edge.trafficLevel === 'blocked') continue;

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        parentMap.set(neighborId, { fromNode: current, edge });
        queue.enqueue(neighborId);

        searchSteps.push({
          type: 'frontier',
          nodeId: neighborId,
          edgeId: edge.id,
          distanceSoFar: 0,
          description: `Discovered unvisited neighbor ${graph.locations.get(neighborId)?.name || neighborId} (hop count level)`,
          frontierSnapshot: [],
          visitedSnapshot: Array.from(visited),
        });
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;

  if (!found) {
    return {
      algorithm: 'bfs',
      preference,
      vehicle,
      sourceId,
      destinationId: destId,
      path: [],
      pathNodes: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      totalCostInr: 0,
      totalCo2Kg: 0,
      nodesVisitedCount: visited.size,
      visitedOrder,
      edgesExploredCount: edgesExplored,
      executionTimeMs: Number(executionTimeMs.toFixed(3)),
      isOptimal: false, // BFS does not guarantee optimal weight on weighted graphs
      steps: [],
      searchSteps,
      success: false,
      errorMessage: 'BFS could not reach destination.',
    };
  }

  const details = reconstructPath(parentMap, sourceId, destId, graph.locations, preference, vehicle, timeMultiplier);

  return {
    algorithm: 'bfs',
    preference,
    vehicle,
    sourceId,
    destinationId: destId,
    path: details.path,
    pathNodes: details.pathNodes,
    totalDistanceKm: details.totalDistanceKm,
    totalTimeMinutes: details.totalTimeMinutes,
    totalCostInr: details.totalCostInr,
    totalCo2Kg: details.totalCo2Kg,
    nodesVisitedCount: visited.size,
    visitedOrder,
    edgesExploredCount: edgesExplored,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    isOptimal: false, // Non-optimal for weighted graphs
    steps: details.steps,
    searchSteps,
    success: true,
  };
}

/**
 * DEPTH-FIRST SEARCH (DFS)
 * Traverses deep branches before backtracking.
 * Demonstrates arbitrary path discovery and why DFS is not suitable for shortest routes.
 * Uses LIFO Stack / Recursion.
 * Time: O(V + E), Space: O(V)
 */
export function runDFS(
  graph: GraphAdjacency,
  sourceId: string,
  destId: string,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): RouteResult {
  const startTime = performance.now();
  const searchSteps: SearchAnimationStep[] = [];
  const visitedOrder: string[] = [];

  const stack = new LIFOStack<string>();
  const visited = new Set<string>();
  const parentMap = new Map<string, { fromNode: string; edge: RoadEdge }>();

  stack.push(sourceId);

  let edgesExplored = 0;
  let found = false;

  searchSteps.push({
    type: 'frontier',
    nodeId: sourceId,
    distanceSoFar: 0,
    description: `DFS Push root to stack: ${graph.locations.get(sourceId)?.name || sourceId}`,
    frontierSnapshot: [sourceId],
    visitedSnapshot: [],
  });

  while (!stack.isEmpty()) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;

    visited.add(current);
    visitedOrder.push(current);

    searchSteps.push({
      type: 'visit',
      nodeId: current,
      distanceSoFar: 0,
      description: `DFS expanding branch node: ${graph.locations.get(current)?.name || current}`,
      frontierSnapshot: [],
      visitedSnapshot: Array.from(visited),
    });

    if (current === destId) {
      found = true;
      searchSteps.push({
        type: 'finish',
        nodeId: current,
        distanceSoFar: 0,
        description: `DFS reached destination (first unguided branch found)`,
        frontierSnapshot: [],
        visitedSnapshot: Array.from(visited),
      });
      break;
    }

    const neighbors = graph.adj.get(current) || [];
    // Explore neighbors
    for (const { neighborId, edge } of neighbors) {
      edgesExplored++;
      if (edge.trafficLevel === 'blocked') continue;

      if (!visited.has(neighborId)) {
        parentMap.set(neighborId, { fromNode: current, edge });
        stack.push(neighborId);

        searchSteps.push({
          type: 'frontier',
          nodeId: neighborId,
          edgeId: edge.id,
          distanceSoFar: 0,
          description: `Pushed unvisited branch neighbor ${graph.locations.get(neighborId)?.name || neighborId} to stack`,
          frontierSnapshot: [],
          visitedSnapshot: Array.from(visited),
        });
      }
    }
  }

  const executionTimeMs = performance.now() - startTime;

  if (!found) {
    return {
      algorithm: 'dfs',
      preference,
      vehicle,
      sourceId,
      destinationId: destId,
      path: [],
      pathNodes: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      totalCostInr: 0,
      totalCo2Kg: 0,
      nodesVisitedCount: visited.size,
      visitedOrder,
      edgesExploredCount: edgesExplored,
      executionTimeMs: Number(executionTimeMs.toFixed(3)),
      isOptimal: false,
      steps: [],
      searchSteps,
      success: false,
      errorMessage: 'DFS could not reach destination.',
    };
  }

  const details = reconstructPath(parentMap, sourceId, destId, graph.locations, preference, vehicle, timeMultiplier);

  return {
    algorithm: 'dfs',
    preference,
    vehicle,
    sourceId,
    destinationId: destId,
    path: details.path,
    pathNodes: details.pathNodes,
    totalDistanceKm: details.totalDistanceKm,
    totalTimeMinutes: details.totalTimeMinutes,
    totalCostInr: details.totalCostInr,
    totalCo2Kg: details.totalCo2Kg,
    nodesVisitedCount: visited.size,
    visitedOrder,
    edgesExploredCount: edgesExplored,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    isOptimal: false,
    steps: details.steps,
    searchSteps,
    success: true,
  };
}

/**
 * BELLMAN-FORD ALGORITHM
 * Relaxes all |E| edges |V| - 1 times.
 * Handles negative weights and detects negative weight cycles.
 * Time: O(V * E), Space: O(V)
 */
export function runBellmanFord(
  graph: GraphAdjacency,
  sourceId: string,
  destId: string,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): RouteResult {
  const startTime = performance.now();
  const searchSteps: SearchAnimationStep[] = [];
  const visitedOrder: string[] = [];

  const distances = new Map<string, number>();
  const parentMap = new Map<string, { fromNode: string; edge: RoadEdge }>();

  graph.locations.forEach((_, id) => distances.set(id, Infinity));
  distances.set(sourceId, 0);

  // Extract all directed edges
  const allDirectedEdges: { u: string; v: string; edge: RoadEdge }[] = [];
  graph.adj.forEach((neighbors, u) => {
    neighbors.forEach(({ neighborId, edge }) => {
      allDirectedEdges.push({ u, v: neighborId, edge });
    });
  });

  const numVertices = graph.locations.size;
  let edgesExplored = 0;
  const visitedNodesSet = new Set<string>([sourceId]);

  searchSteps.push({
    type: 'frontier',
    nodeId: sourceId,
    distanceSoFar: 0,
    description: `Bellman-Ford initialized: will perform up to ${numVertices - 1} relaxation passes over ${allDirectedEdges.length} edges`,
    frontierSnapshot: [sourceId],
    visitedSnapshot: [sourceId],
  });

  // |V| - 1 iterations
  for (let i = 0; i < numVertices - 1; i++) {
    let anyUpdate = false;
    for (const { u, v, edge } of allDirectedEdges) {
      edgesExplored++;
      const uDist = distances.get(u) || Infinity;
      if (uDist === Infinity) continue;

      const cost = getEdgeTraversalCost(edge, preference, vehicle, timeMultiplier);
      if (!cost.passable) continue;

      if (uDist + cost.weight < (distances.get(v) || Infinity)) {
        distances.set(v, uDist + cost.weight);
        parentMap.set(v, { fromNode: u, edge });
        visitedNodesSet.add(v);
        anyUpdate = true;

        if (i < 2 || v === destId) {
          searchSteps.push({
            type: 'relax',
            nodeId: v,
            edgeId: edge.id,
            distanceSoFar: uDist + cost.weight,
            description: `Pass ${i + 1}: Relaxed edge (${edge.name}) to ${graph.locations.get(v)?.name || v} (dist: ${(uDist + cost.weight).toFixed(2)})`,
            frontierSnapshot: [],
            visitedSnapshot: Array.from(visitedNodesSet),
          });
        }
      }
    }
    // Early exit if no edges were relaxed in this pass
    if (!anyUpdate) break;
  }

  // Check for negative weight cycles
  let hasNegativeCycle = false;
  for (const { u, v, edge } of allDirectedEdges) {
    const uDist = distances.get(u) || Infinity;
    if (uDist === Infinity) continue;
    const cost = getEdgeTraversalCost(edge, preference, vehicle, timeMultiplier);
    if (cost.passable && uDist + cost.weight < (distances.get(v) || Infinity)) {
      hasNegativeCycle = true;
      break;
    }
  }

  const executionTimeMs = performance.now() - startTime;
  visitedNodesSet.forEach((id) => visitedOrder.push(id));

  const destDist = distances.get(destId) || Infinity;
  if (destDist === Infinity || hasNegativeCycle) {
    return {
      algorithm: 'bellman-ford',
      preference,
      vehicle,
      sourceId,
      destinationId: destId,
      path: [],
      pathNodes: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      totalCostInr: 0,
      totalCo2Kg: 0,
      nodesVisitedCount: visitedNodesSet.size,
      visitedOrder,
      edgesExploredCount: edgesExplored,
      executionTimeMs: Number(executionTimeMs.toFixed(3)),
      isOptimal: !hasNegativeCycle,
      steps: [],
      searchSteps,
      success: false,
      errorMessage: hasNegativeCycle
        ? 'Negative weight cycle detected in graph. Optimal path is undefined.'
        : 'Destination is unreachable from source.',
    };
  }

  const details = reconstructPath(parentMap, sourceId, destId, graph.locations, preference, vehicle, timeMultiplier);

  return {
    algorithm: 'bellman-ford',
    preference,
    vehicle,
    sourceId,
    destinationId: destId,
    path: details.path,
    pathNodes: details.pathNodes,
    totalDistanceKm: details.totalDistanceKm,
    totalTimeMinutes: details.totalTimeMinutes,
    totalCostInr: details.totalCostInr,
    totalCo2Kg: details.totalCo2Kg,
    nodesVisitedCount: visitedNodesSet.size,
    visitedOrder,
    edgesExploredCount: edgesExplored,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    isOptimal: true,
    steps: details.steps,
    searchSteps,
    success: true,
  };
}

// ---------------------------------------------------------------------------
// 6. ROUTE FINDER CONTROLLER & ALTERNATIVE ROUTES (YEN'S VARIANT)
// ---------------------------------------------------------------------------

export function findRoute(
  graph: GraphAdjacency,
  sourceId: string,
  destId: string,
  algorithm: AlgorithmType,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): RouteResult {
  switch (algorithm) {
    case 'dijkstra':
      return runDijkstra(graph, sourceId, destId, preference, vehicle, timeMultiplier);
    case 'astar':
      return runAStar(graph, sourceId, destId, preference, vehicle, timeMultiplier);
    case 'bfs':
      return runBFS(graph, sourceId, destId, preference, vehicle, timeMultiplier);
    case 'dfs':
      return runDFS(graph, sourceId, destId, preference, vehicle, timeMultiplier);
    case 'bellman-ford':
      return runBellmanFord(graph, sourceId, destId, preference, vehicle, timeMultiplier);
  }
}

/**
 * Generates up to 3 alternative routes by applying penalty weights or path deviation.
 */
export function findAlternativeRoutes(
  allEdges: RoadEdge[],
  nodes: LocationNode[],
  sourceId: string,
  destId: string,
  preference: RoutePreference,
  vehicle: VehicleType,
  primaryPath: string[],
  timeMultiplier: number = 1.0
): AlternativeRoute[] {
  if (primaryPath.length <= 2) return [];

  const alternatives: AlternativeRoute[] = [];
  const colors = ['#8b5cf6', '#f59e0b', '#06b6d4']; // Purple, Amber, Cyan
  const descriptors = ['Via Arterial Expressway', 'Via Scenic Heritage Ring', 'Bypass Corridor'];

  // Generate up to 2 distinct alternatives by penalizing edges of previously found paths
  const penalizedEdges = new Set<string>();

  for (let k = 0; k < 2; k++) {
    // Collect edges from previous path to penalize
    const pathToPenalize = k === 0 ? primaryPath : alternatives[k - 1]?.path || [];
    for (let i = 0; i < pathToPenalize.length - 1; i++) {
      penalizedEdges.add(`${pathToPenalize[i]}-${pathToPenalize[i + 1]}`);
      penalizedEdges.add(`${pathToPenalize[i + 1]}-${pathToPenalize[i]}`);
    }

    // Clone edges and inflate penalized ones
    const modifiedEdges: RoadEdge[] = allEdges.map((e) => {
      const isPenalized = penalizedEdges.has(`${e.u}-${e.v}`) || penalizedEdges.has(`${e.v}-${e.u}`);
      return isPenalized
        ? { ...e, distanceKm: e.distanceKm * 2.2, baseSpeedKmh: Math.max(15, e.baseSpeedKmh * 0.5) }
        : e;
    });

    const tempGraph = buildAdjacencyList(nodes, modifiedEdges);
    const altResult = runDijkstra(tempGraph, sourceId, destId, preference, vehicle, timeMultiplier);

    if (altResult.success && altResult.path.length > 0) {
      // Check if it's identical to primary or any existing alternative
      const pathStr = altResult.path.join('->');
      const primaryStr = primaryPath.join('->');
      const alreadyFound = alternatives.some((a) => a.path.join('->') === pathStr);

      if (pathStr !== primaryStr && !alreadyFound) {
        // Calculate true stats with UNMODIFIED edges
        const trueGraph = buildAdjacencyList(nodes, allEdges);
        const trueStats = runDijkstra(trueGraph, sourceId, destId, preference, vehicle, timeMultiplier);
        
        // Extract real path cost
        let trueDist = 0;
        let trueTime = 0;
        for (let i = 0; i < altResult.path.length - 1; i++) {
          const u = altResult.path[i];
          const v = altResult.path[i + 1];
          const edge = allEdges.find((e) => (e.u === u && e.v === v) || (!e.isOneWay && e.u === v && e.v === u));
          if (edge) {
            const cost = getEdgeTraversalCost(edge, preference, vehicle, timeMultiplier);
            trueDist += cost.distanceKm;
            trueTime += cost.timeMinutes;
          }
        }

        const vConfig = VEHICLE_CONFIGS[vehicle];
        const costInr = (trueDist / vConfig.fuelEfficiencyKmPerLiter) * vConfig.fuelPricePerLiter;
        const co2Kg = (trueDist * vConfig.co2GramsPerKm) / 1000;

        alternatives.push({
          id: `alt-${k + 1}`,
          name: `Alternative ${k + 1} (${descriptors[k] || 'Alternate Route'})`,
          path: altResult.path,
          distanceKm: Number(trueDist.toFixed(1)),
          timeMinutes: Number(trueTime.toFixed(1)),
          costInr: Number(costInr.toFixed(1)),
          co2Kg: Number(co2Kg.toFixed(2)),
          color: colors[k] || '#8b5cf6',
          description: descriptors[k] || 'Alternate Path',
        });
      }
    }
  }

  return alternatives;
}

// ---------------------------------------------------------------------------
// 7. COMPREHENSIVE BENCHMARK COMPILER
// ---------------------------------------------------------------------------

export function benchmarkAllAlgorithms(
  graph: GraphAdjacency,
  sourceId: string,
  destId: string,
  preference: RoutePreference,
  vehicle: VehicleType,
  timeMultiplier: number = 1.0
): AlgorithmBenchmark[] {
  const algorithms: { type: AlgorithmType; name: string; tc: string; sc: string; ds: string; optimal: boolean; pros: string; cons: string }[] = [
    {
      type: 'dijkstra',
      name: "Dijkstra's Algorithm",
      tc: 'O((V + E) log V)',
      sc: 'O(V)',
      ds: 'Min-Heap Priority Queue + Adjacency List',
      optimal: true,
      pros: 'Guaranteed mathematical shortest path for non-negative weights; baseline industry standard.',
      cons: 'Explores radially in all directions; slower than A* when destination is known.',
    },
    {
      type: 'astar',
      name: 'A* Search (Haversine Heuristic)',
      tc: 'O(E) best, O((V + E) log V) worst',
      sc: 'O(V)',
      ds: 'Min-Heap Priority Queue + Heuristic Map',
      optimal: true,
      pros: 'Heuristically directed towards destination; examines significantly fewer nodes.',
      cons: 'Requires an admissible heuristic h(n) <= d*(n, goal) to guarantee optimality.',
    },
    {
      type: 'bfs',
      name: 'Breadth-First Search (BFS)',
      tc: 'O(V + E)',
      sc: 'O(V)',
      ds: 'FIFO Queue',
      optimal: false,
      pros: 'Guarantees fewest number of road intersections/hops; very simple and fast.',
      cons: 'Ignores edge weights (distance/traffic); fails to find shortest weighted route.',
    },
    {
      type: 'dfs',
      name: 'Depth-First Search (DFS)',
      tc: 'O(V + E)',
      sc: 'O(V)',
      ds: 'LIFO Stack / Recursion',
      optimal: false,
      pros: 'Minimal memory overhead; discovers paths with deep exploration.',
      cons: 'Non-optimal; prone to highly winding, inefficient routes.',
    },
    {
      type: 'bellman-ford',
      name: 'Bellman-Ford Algorithm',
      tc: 'O(V × E)',
      sc: 'O(V)',
      ds: 'Edge List Array + Distance Table',
      optimal: true,
      pros: 'Can handle negative weights and reliably detect negative-weight cycles.',
      cons: 'Significantly higher time complexity O(V·E); slower for large road networks.',
    },
  ];

  return algorithms.map((meta) => {
    const res = findRoute(graph, sourceId, destId, meta.type, preference, vehicle, timeMultiplier);
    return {
      algorithm: meta.type,
      name: meta.name,
      path: res.path,
      distanceKm: res.totalDistanceKm,
      timeMins: res.totalTimeMinutes,
      nodesVisited: res.nodesVisitedCount,
      executionTimeMs: res.executionTimeMs,
      isOptimal: res.isOptimal && res.success,
      timeComplexity: meta.tc,
      spaceComplexity: meta.sc,
      dataStructureUsed: meta.ds,
      guaranteesShortest: meta.optimal,
      pros: meta.pros,
      cons: meta.cons,
    };
  });
}
