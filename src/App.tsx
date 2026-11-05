/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlgorithmBenchmark,
  AlgorithmType,
  AlternativeRoute,
  FavoriteRoute,
  LocationNode,
  RegionType,
  RoadEdge,
  RoutePreference,
  RouteResult,
  SearchHistoryItem,
  VehicleType,
} from './types';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_ROADS,
  TELANGANA_STATE_LOCATIONS,
  TELANGANA_STATE_ROADS,
  HYDERABAD_METRO_LOCATIONS,
  HYDERABAD_METRO_ROADS,
  VEHICLE_CONFIGS,
} from './data/defaultGraph';
import {
  buildAdjacencyList,
  findRoute,
  findAlternativeRoutes,
  benchmarkAllAlgorithms,
} from './utils/graphAlgorithms';
import { getHourTrafficMultiplier } from './utils/trafficSimulation';

// Layout & Components
import { TopBar } from './components/layout/TopBar';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { FindRoutePage } from './pages/FindRoutePage';
import { TrafficSimulationPage } from './pages/TrafficSimulationPage';
import { ManageMapPage } from './pages/ManageMapPage';
import { VivaQuestionsModal } from './components/educational/VivaQuestionsModal';
import { PythonCodeViewer } from './components/python/PythonCodeViewer';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('srf_theme') === 'dark';
  });

  // Sync theme with document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('srf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('srf_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => setIsDarkMode((prev) => !prev);

  // Active page state
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [isVivaModalOpen, setIsVivaModalOpen] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);

  // Regional scope state ('telangana' for whole state or 'hyderabad' for city)
  const [currentRegion, setCurrentRegion] = useState<RegionType>(() => {
    return (localStorage.getItem('srf_region') as RegionType) || 'telangana';
  });

  // Graph state (stored in localStorage)
  const [locations, setLocations] = useState<LocationNode[]>(() => {
    const saved = localStorage.getItem('srf_locations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return TELANGANA_STATE_LOCATIONS;
  });

  const [roads, setRoads] = useState<RoadEdge[]>(() => {
    const saved = localStorage.getItem('srf_roads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return TELANGANA_STATE_ROADS;
  });

  // Persist graph edits
  useEffect(() => {
    localStorage.setItem('srf_locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('srf_roads', JSON.stringify(roads));
  }, [roads]);

  // Route calculation preferences & params
  const [sourceId, setSourceId] = useState<string>(() => {
    return currentRegion === 'telangana' ? 'hyderabad' : 'charminar';
  });
  const [destId, setDestId] = useState<string>(() => {
    return currentRegion === 'telangana' ? 'warangal' : 'hiteccity';
  });
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [preference, setPreference] = useState<RoutePreference>('fastest');
  const [vehicle, setVehicle] = useState<VehicleType>('car');
  const [simulationHour, setSimulationHour] = useState<number>(9); // 9 AM rush hour

  // Calculated Results
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [activeAlternativeId, setActiveAlternativeId] = useState<string | null>(null);

  // Benchmarks
  const [benchmarks, setBenchmarks] = useState<AlgorithmBenchmark[]>([]);

  // Statistics & History
  const [routesCalculatedCount, setRoutesCalculatedCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('srf_routes_count') || '12', 10);
  });

  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>(() => {
    const saved = localStorage.getItem('srf_searches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 's1',
        sourceId: 'charminar',
        destId: 'hiteccity',
        sourceName: 'Charminar (Old City)',
        destName: 'HITEC City (Cyber Towers)',
        algorithm: 'dijkstra',
        preference: 'fastest',
        distanceKm: 21.4,
        timeMins: 38.5,
        timestamp: Date.now() - 1000 * 60 * 15,
      },
      {
        id: 's2',
        sourceId: 'secunderabad',
        destId: 'airport',
        sourceName: 'Secunderabad Junction',
        destName: 'Rajiv Gandhi Int. Airport',
        algorithm: 'astar',
        preference: 'shortest',
        distanceKm: 34.2,
        timeMins: 45.0,
        timestamp: Date.now() - 1000 * 60 * 45,
      },
    ];
  });

  const [favorites, setFavorites] = useState<FavoriteRoute[]>(() => {
    const saved = localStorage.getItem('srf_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Build current adjacency representation
  const graph = useMemo(() => {
    return buildAdjacencyList(locations, roads);
  }, [locations, roads]);

  // Execute Route Computation
  const handleCalculateRoute = (
    src: string = sourceId,
    dst: string = destId,
    algo: AlgorithmType = algorithm,
    pref: RoutePreference = preference,
    veh: VehicleType = vehicle,
    hour: number = simulationHour
  ) => {
    const rushMultiplier = getHourTrafficMultiplier(hour);
    const result = findRoute(graph, src, dst, algo, pref, veh, rushMultiplier);
    setRouteResult(result);
    setActiveAlternativeId(null);

    // Compute up to 3 alternatives
    if (result.success && result.path.length > 0) {
      const alts = findAlternativeRoutes(roads, locations, src, dst, pref, veh, result.path, rushMultiplier);
      setAlternativeRoutes(alts);

      // Increment counter
      setRoutesCalculatedCount((prev) => {
        const next = prev + 1;
        localStorage.setItem('srf_routes_count', next.toString());
        return next;
      });

      // Add to search history
      const sourceLoc = locations.find((l) => l.id === src);
      const destLoc = locations.find((l) => l.id === dst);
      const historyItem: SearchHistoryItem = {
        id: `search_${Date.now()}`,
        sourceId: src,
        destId: dst,
        sourceName: sourceLoc?.name || src,
        destName: destLoc?.name || dst,
        algorithm: algo,
        preference: pref,
        distanceKm: result.totalDistanceKm,
        timeMins: result.totalTimeMinutes,
        timestamp: Date.now(),
      };

      setRecentSearches((prev) => {
        const updated = [historyItem, ...prev.filter((p) => !(p.sourceId === src && p.destId === dst))].slice(0, 10);
        localStorage.setItem('srf_searches', JSON.stringify(updated));
        return updated;
      });
    } else {
      setAlternativeRoutes([]);
    }

    // Run Full Benchmark for current pair
    const bmarks = benchmarkAllAlgorithms(graph, src, dst, pref, veh, rushMultiplier);
    setBenchmarks(bmarks);
  };

  // Initial calculation on load
  useEffect(() => {
    handleCalculateRoute(sourceId, destId, algorithm, preference, vehicle, simulationHour);
  }, []);

  // Recalculate if roads traffic changes
  useEffect(() => {
    if (routeResult) {
      handleCalculateRoute(sourceId, destId, algorithm, preference, vehicle, simulationHour);
    }
  }, [roads, simulationHour]);

  // Quick route shortcut from dashboard
  const handleQuickRoute = (quickSrc: string, quickDst: string) => {
    setSourceId(quickSrc);
    setDestId(quickDst);
    handleCalculateRoute(quickSrc, quickDst, algorithm, preference, vehicle, simulationHour);
    setActivePage('route');
  };

  // Toggle regional map scope
  const handleToggleRegion = (newRegion: RegionType) => {
    setCurrentRegion(newRegion);
    localStorage.setItem('srf_region', newRegion);
    if (newRegion === 'telangana') {
      setLocations(TELANGANA_STATE_LOCATIONS);
      setRoads(TELANGANA_STATE_ROADS);
      setSourceId('hyderabad');
      setDestId('warangal');
      handleCalculateRoute('hyderabad', 'warangal', algorithm, preference, vehicle, simulationHour);
    } else {
      setLocations(HYDERABAD_METRO_LOCATIONS);
      setRoads(HYDERABAD_METRO_ROADS);
      setSourceId('charminar');
      setDestId('hiteccity');
      handleCalculateRoute('charminar', 'hiteccity', algorithm, preference, vehicle, simulationHour);
    }
  };

  // Reset graph to default
  const handleResetToDefaultGraph = () => {
    if (currentRegion === 'telangana') {
      setLocations(TELANGANA_STATE_LOCATIONS);
      setRoads(TELANGANA_STATE_ROADS);
      setSourceId('hyderabad');
      setDestId('warangal');
      handleCalculateRoute('hyderabad', 'warangal', 'dijkstra', 'fastest', 'car', 9);
    } else {
      setLocations(HYDERABAD_METRO_LOCATIONS);
      setRoads(HYDERABAD_METRO_ROADS);
      setSourceId('charminar');
      setDestId('hiteccity');
      handleCalculateRoute('charminar', 'hiteccity', 'dijkstra', 'fastest', 'car', 9);
    }
    localStorage.removeItem('srf_locations');
    localStorage.removeItem('srf_roads');
  };

  // Toggle favorite
  const isCurrentFavorite = favorites.some((f) => f.sourceId === sourceId && f.destId === destId);
  const handleToggleFavorite = () => {
    if (isCurrentFavorite) {
      const updated = favorites.filter((f) => !(f.sourceId === sourceId && f.destId === destId));
      setFavorites(updated);
      localStorage.setItem('srf_favorites', JSON.stringify(updated));
    } else if (routeResult && routeResult.success) {
      const sourceLoc = locations.find((l) => l.id === sourceId);
      const destLoc = locations.find((l) => l.id === destId);
      const newFav: FavoriteRoute = {
        id: `fav_${Date.now()}`,
        name: `${sourceLoc?.name.split('(')[0]} to ${destLoc?.name.split('(')[0]}`,
        sourceId,
        destId,
        sourceName: sourceLoc?.name || sourceId,
        destName: destLoc?.name || destId,
        preference,
        vehicle,
        distanceKm: routeResult.totalDistanceKm,
      };
      const updated = [newFav, ...favorites];
      setFavorites(updated);
      localStorage.setItem('srf_favorites', JSON.stringify(updated));
    }
  };

  // Clear history
  const handleClearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('srf_searches');
  };

  // Export CSV for Route Steps
  const handleExportRouteCsv = () => {
    if (!routeResult || !routeResult.success) return;
    const headers = ['StepNumber', 'FromNode', 'ToNode', 'RoadName', 'DistanceKm', 'TimeMinutes', 'Instruction'];
    const rows = routeResult.steps.map((s) => [
      s.stepNumber,
      `"${s.fromName}"`,
      `"${s.toName}"`,
      `"${s.roadName}"`,
      s.distanceKm,
      s.timeMinutes,
      `"${s.instruction}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route_${sourceId}_to_${destId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* Top Bar Header */}
      <TopBar
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        simulationHour={simulationHour}
        onHourChange={setSimulationHour}
        onOpenViva={() => setIsVivaModalOpen(true)}
        onOpenPython={() => setIsPythonModalOpen(true)}
        locations={locations}
        onSelectLocation={(locId) => {
          setDestId(locId);
          setActivePage('route');
        }}
        currentRegion={currentRegion}
        onToggleRegion={handleToggleRegion}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          locationsCount={locations.length}
          roadsCount={roads.length}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/60 dark:bg-slate-950/60">
          <div className="max-w-7xl mx-auto">
            {activePage === 'dashboard' && (
              <DashboardPage
                locations={locations}
                roads={roads}
                routesCalculatedCount={routesCalculatedCount}
                recentSearches={recentSearches}
                routeResult={routeResult}
                benchmarks={benchmarks}
                currentRegion={currentRegion}
                onToggleRegion={handleToggleRegion}
                simulationHour={simulationHour}
                onQuickRoute={handleQuickRoute}
                onNavigateToFindRoute={() => setActivePage('route')}
                onNavigateToTraffic={() => setActivePage('traffic')}
                onClearHistory={handleClearHistory}
                isDarkMode={isDarkMode}
              />
            )}

            {activePage === 'route' && (
              <FindRoutePage
                locations={locations}
                roads={roads}
                sourceId={sourceId}
                destId={destId}
                onSetSourceId={setSourceId}
                onSetDestId={setDestId}
                algorithm={algorithm}
                onSetAlgorithm={setAlgorithm}
                preference={preference}
                onSetPreference={setPreference}
                vehicle={vehicle}
                onSetVehicle={setVehicle}
                onFindRoute={() => handleCalculateRoute()}
                onReset={() => {
                  setSourceId('charminar');
                  setDestId('hiteccity');
                  setAlgorithm('dijkstra');
                  setPreference('fastest');
                  handleCalculateRoute('charminar', 'hiteccity', 'dijkstra', 'fastest', vehicle, simulationHour);
                }}
                routeResult={routeResult}
                alternativeRoutes={alternativeRoutes}
                activeAlternativeId={activeAlternativeId}
                onSelectAlternative={setActiveAlternativeId}
                onSaveFavorite={handleToggleFavorite}
                isFavorite={isCurrentFavorite}
                onExportCsv={handleExportRouteCsv}
                isDarkMode={isDarkMode}
              />
            )}

            {activePage === 'traffic' && (
              <TrafficSimulationPage
                locations={locations}
                roads={roads}
                onUpdateRoads={setRoads}
                simulationHour={simulationHour}
                onSetSimulationHour={setSimulationHour}
                sourceId={sourceId}
                destId={destId}
                optimalPath={routeResult?.path || []}
                isDarkMode={isDarkMode}
              />
            )}

            {activePage === 'manage' && (
              <ManageMapPage
                locations={locations}
                roads={roads}
                onUpdateLocations={setLocations}
                onUpdateRoads={setRoads}
                onResetToDefault={handleResetToDefaultGraph}
                currentRegion={currentRegion}
                onToggleRegion={handleToggleRegion}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal: Viva Voce Questions & Answers */}
      <VivaQuestionsModal
        isOpen={isVivaModalOpen}
        onClose={() => setIsVivaModalOpen(false)}
      />

      {/* Modal: Python Code Viewer */}
      {isPythonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Python Backend Source Code</span>
              <button
                onClick={() => setIsPythonModalOpen(false)}
                className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <PythonCodeViewer onClose={() => setIsPythonModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
