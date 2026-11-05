import React, { useState } from 'react';
import {
  AlgorithmType,
  AlternativeRoute,
  LocationNode,
  RoadEdge,
  RoutePreference,
  RouteResult,
  SearchAnimationStep,
  VehicleType,
} from '../types';
import { VEHICLE_CONFIGS } from '../data/defaultGraph';
import { LeafletMap } from '../components/map/LeafletMap';
import { RouteStepByStep } from '../components/route/RouteStepByStep';
import { AlgorithmExplorationVisualizer } from '../components/route/AlgorithmExplorationVisualizer';
import {
  ArrowUpDown,
  Navigation,
  RotateCcw,
  Sparkles,
  Sliders,
  Bookmark,
  Share2,
  Bike,
  Car,
  Bus,
  Zap,
} from 'lucide-react';

interface FindRoutePageProps {
  locations: LocationNode[];
  roads: RoadEdge[];
  sourceId: string;
  destId: string;
  onSetSourceId: (id: string) => void;
  onSetDestId: (id: string) => void;
  algorithm: AlgorithmType;
  onSetAlgorithm: (algo: AlgorithmType) => void;
  preference: RoutePreference;
  onSetPreference: (pref: RoutePreference) => void;
  vehicle: VehicleType;
  onSetVehicle: (v: VehicleType) => void;
  onFindRoute: () => void;
  onReset: () => void;
  routeResult: RouteResult | null;
  alternativeRoutes: AlternativeRoute[];
  activeAlternativeId: string | null;
  onSelectAlternative: (id: string | null) => void;
  onSaveFavorite: () => void;
  isFavorite: boolean;
  onExportCsv: () => void;
  isDarkMode: boolean;
}

export const FindRoutePage: React.FC<FindRoutePageProps> = ({
  locations,
  roads,
  sourceId,
  destId,
  onSetSourceId,
  onSetDestId,
  algorithm,
  onSetAlgorithm,
  preference,
  onSetPreference,
  vehicle,
  onSetVehicle,
  onFindRoute,
  onReset,
  routeResult,
  alternativeRoutes,
  activeAlternativeId,
  onSelectAlternative,
  onSaveFavorite,
  isFavorite,
  onExportCsv,
  isDarkMode,
}) => {
  const [activeSearchStep, setActiveSearchStep] = useState<SearchAnimationStep | null>(null);

  const handleSwap = () => {
    const temp = sourceId;
    onSetSourceId(destId);
    onSetDestId(temp);
  };

  const activePath = activeAlternativeId
    ? alternativeRoutes.find((a) => a.id === activeAlternativeId)?.path || []
    : routeResult?.path || [];

  return (
    <div className="space-y-6">
      {/* Configuration Header / Controls Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Source & Destination Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Source dropdown */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Origin Landmark (A)</span>
            </label>
            <select
              value={sourceId}
              onChange={(e) => onSetSourceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} disabled={loc.id === destId}>
                  {loc.name} ({loc.category.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center pt-4 md:pt-0">
            <button
              onClick={handleSwap}
              title="Swap Origin and Destination"
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination dropdown */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Destination Landmark (B)</span>
            </label>
            <select
              value={destId}
              onChange={(e) => onSetDestId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} disabled={loc.id === sourceId}>
                  {loc.name} ({loc.category.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Algorithm, Preference & Vehicle Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Algorithm */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Pathfinding Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => onSetAlgorithm(e.target.value as AlgorithmType)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="dijkstra">Dijkstra (Guaranteed Shortest)</option>
              <option value="astar">A* Search (Haversine Heuristic)</option>
              <option value="bfs">BFS (Minimum Hop Count)</option>
              <option value="dfs">DFS (Depth Exploration)</option>
              <option value="bellman-ford">Bellman-Ford (Edge Relaxation)</option>
            </select>
          </div>

          {/* Route Preference */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Optimization Criterion
            </label>
            <select
              value={preference}
              onChange={(e) => onSetPreference(e.target.value as RoutePreference)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="fastest">Fastest (Traffic-Adjusted Time)</option>
              <option value="shortest">Shortest (Physical Distance km)</option>
              <option value="cheapest">Cheapest (Fuel Cost in INR)</option>
              <option value="eco">Eco-friendly (Lowest CO₂ Footprint)</option>
            </select>
          </div>

          {/* Vehicle Mode */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Transit Vehicle
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => onSetVehicle('bike')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  vehicle === 'bike'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Bike</span>
              </button>
              <button
                type="button"
                onClick={() => onSetVehicle('car')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  vehicle === 'car'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Car</span>
              </button>
              <button
                type="button"
                onClick={() => onSetVehicle('bus')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                  vehicle === 'bus'
                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Bus</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onFindRoute}
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              Compute Optimal Route
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {routeResult && routeResult.success && (
            <button
              onClick={onSaveFavorite}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Bookmarked' : 'Save Favorite'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Interactive Map (Left) + Step-by-Step Directions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Leaflet Map & Search Progression Visualizer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="h-[520px]">
            <LeafletMap
              locations={locations}
              roads={roads}
              sourceId={sourceId}
              destinationId={destId}
              optimalPath={activePath}
              alternativeRoutes={alternativeRoutes}
              activeAlternativeId={activeAlternativeId}
              onSelectSource={onSetSourceId}
              onSelectDestination={onSetDestId}
              visitedNodes={activeSearchStep?.visitedSnapshot || []}
              currentNodeId={activeSearchStep?.nodeId}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Algorithm Search Progression Player */}
          {routeResult && routeResult.searchSteps && routeResult.searchSteps.length > 0 && (
            <AlgorithmExplorationVisualizer
              searchSteps={routeResult.searchSteps}
              algorithmName={algorithm.toUpperCase()}
              onStepChange={setActiveSearchStep}
              onReset={() => setActiveSearchStep(null)}
            />
          )}
        </div>

        {/* Right Column: Direction Steps, Metrics, and Alternative Routes */}
        <div className="lg:col-span-5">
          {routeResult ? (
            <RouteStepByStep
              result={routeResult}
              alternativeRoutes={alternativeRoutes}
              activeAlternativeId={activeAlternativeId}
              onSelectAlternative={onSelectAlternative}
              onExportCsv={onExportCsv}
            />
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
              <Navigation className="w-8 h-8 text-cyan-500 mx-auto" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Ready to Find Your Route
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Select your origin and destination from the dropdowns above or click any marker on the map to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
