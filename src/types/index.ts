export type NodeCategory = 'tech' | 'heritage' | 'transit' | 'commercial' | 'residential' | 'education' | 'district';

export type RegionType = 'telangana' | 'hyderabad';

export interface LocationNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: NodeCategory;
  description: string;
}

export type TrafficLevel = 'low' | 'medium' | 'high' | 'blocked';

export interface RoadEdge {
  id: string;
  u: string; // source node ID
  v: string; // destination node ID
  name: string;
  distanceKm: number;
  baseSpeedKmh: number;
  trafficLevel: TrafficLevel;
  isOneWay: boolean;
}

export type AlgorithmType = 'dijkstra' | 'astar' | 'bfs' | 'dfs' | 'bellman-ford';

export type RoutePreference = 'shortest' | 'fastest' | 'cheapest' | 'eco';

export type VehicleType = 'bike' | 'car' | 'bus';

export interface VehicleConfig {
  type: VehicleType;
  name: string;
  avgSpeedMultiplier: number;
  fuelEfficiencyKmPerLiter: number; // km per liter
  fuelPricePerLiter: number; // in INR
  co2GramsPerKm: number; // grams of CO2 per km
  icon: string;
}

export interface RouteStep {
  stepNumber: number;
  fromNodeId: string;
  toNodeId: string;
  fromName: string;
  toName: string;
  roadName: string;
  distanceKm: number;
  timeMinutes: number;
  instruction: string;
}

export type SearchStepType = 'visit' | 'relax' | 'frontier' | 'finish';

export interface SearchAnimationStep {
  type: SearchStepType;
  nodeId: string;
  edgeId?: string;
  distanceSoFar: number;
  description: string;
  frontierSnapshot: string[];
  visitedSnapshot: string[];
}

export interface RouteResult {
  algorithm: AlgorithmType;
  preference: RoutePreference;
  vehicle: VehicleType;
  sourceId: string;
  destinationId: string;
  path: string[]; // node IDs in order
  pathNodes: LocationNode[];
  totalDistanceKm: number;
  totalTimeMinutes: number;
  totalCostInr: number;
  totalCo2Kg: number;
  nodesVisitedCount: number;
  visitedOrder: string[];
  edgesExploredCount: number;
  executionTimeMs: number;
  isOptimal: boolean;
  steps: RouteStep[];
  searchSteps: SearchAnimationStep[];
  success: boolean;
  errorMessage?: string;
}

export interface AlternativeRoute {
  id: string;
  name: string;
  path: string[];
  distanceKm: number;
  timeMinutes: number;
  costInr: number;
  co2Kg: number;
  color: string;
  description: string;
}

export interface AlgorithmBenchmark {
  algorithm: AlgorithmType;
  name: string;
  path: string[];
  distanceKm: number;
  timeMins: number;
  nodesVisited: number;
  executionTimeMs: number;
  isOptimal: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  dataStructureUsed: string;
  guaranteesShortest: boolean;
  pros: string;
  cons: string;
}

export interface SearchHistoryItem {
  id: string;
  sourceId: string;
  destId: string;
  sourceName: string;
  destName: string;
  algorithm: AlgorithmType;
  preference: RoutePreference;
  distanceKm: number;
  timeMins: number;
  timestamp: number;
}

export interface FavoriteRoute {
  id: string;
  name: string;
  sourceId: string;
  destId: string;
  sourceName: string;
  destName: string;
  preference: RoutePreference;
  vehicle: VehicleType;
  distanceKm: number;
}
