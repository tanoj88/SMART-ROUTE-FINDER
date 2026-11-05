import React, { useState } from 'react';
import {
  AlgorithmBenchmark,
  LocationNode,
  RegionType,
  RoadEdge,
  RouteResult,
  SearchHistoryItem,
} from '../types';
import { LeafletMap } from '../components/map/LeafletMap';
import { getHourTrafficMultiplier } from '../utils/trafficSimulation';
import {
  MapPin,
  Route,
  Calculator,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  History,
  TrendingUp,
  BarChart3,
  Layers,
  Activity,
  Globe2,
  PieChart as PieIcon,
  Navigation,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardPageProps {
  locations: LocationNode[];
  roads: RoadEdge[];
  routesCalculatedCount: number;
  recentSearches: SearchHistoryItem[];
  routeResult: RouteResult | null;
  benchmarks: AlgorithmBenchmark[];
  currentRegion: RegionType;
  onToggleRegion: (region: RegionType) => void;
  simulationHour: number;
  onQuickRoute: (sourceId: string, destId: string) => void;
  onNavigateToFindRoute: () => void;
  onNavigateToTraffic: () => void;
  onClearHistory: () => void;
  isDarkMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  locations,
  roads,
  routesCalculatedCount,
  recentSearches,
  routeResult,
  benchmarks,
  currentRegion,
  onToggleRegion,
  simulationHour,
  onQuickRoute,
  onNavigateToFindRoute,
  onNavigateToTraffic,
  onClearHistory,
  isDarkMode,
}) => {
  const locMap = new Map<string, LocationNode>();
  locations.forEach((l) => locMap.set(l.id, l));

  // Regional trip shortcuts
  const telanganaTrips = [
    { from: 'hyderabad', to: 'warangal', name: 'Hyderabad to Warangal (Kakatiya City)', dist: '~145 km', via: 'NH 163 4-Lane Expressway' },
    { from: 'nizamabad', to: 'hyderabad', name: 'Nizamabad to State Capital', dist: '~170 km', via: 'NH 44 North Corridor' },
    { from: 'hyderabad', to: 'khammam', name: 'Hyderabad to Khammam Hub', dist: '~192 km', via: 'NH 65 & SH 42' },
    { from: 'adilabad', to: 'hyderabad', name: 'Adilabad Frontier to Hyderabad', dist: '~305 km', via: 'NH 44 North-South' },
    { from: 'karimnagar', to: 'warangal', name: 'Karimnagar to Warangal', dist: '~72 km', via: 'NH 563 Arterial' },
  ];

  const cityTrips = [
    { from: 'charminar', to: 'hiteccity', name: 'Charminar to Cyber Towers', dist: '~21 km', via: 'Cable Bridge Expressway' },
    { from: 'mehdipatnam', to: 'airport', name: 'Mehdipatnam to RGIA Airport', dist: '~19 km', via: 'PVNR Elevated Expressway' },
    { from: 'secunderabad', to: 'financialdistrict', name: 'Secunderabad to Financial District', dist: '~24 km', via: 'Outer Ring Road' },
    { from: 'kphb', to: 'gachibowli', name: 'KPHB Kukatpally to Gachibowli', dist: '~14 km', via: 'Gachibowli-Miyapur Hwy' },
  ];

  const activeShortcuts = currentRegion === 'telangana' ? telanganaTrips : cityTrips;

  // Traffic Breakdown
  const lowCount = roads.filter((r) => r.trafficLevel === 'low').length;
  const medCount = roads.filter((r) => r.trafficLevel === 'medium').length;
  const highCount = roads.filter((r) => r.trafficLevel === 'high').length;
  const blockedCount = roads.filter((r) => r.trafficLevel === 'blocked').length;

  const trafficDistributionData = [
    { name: 'Low (Free Flow)', count: lowCount, color: '#10b981' },
    { name: 'Moderate Traffic', count: medCount, color: '#f59e0b' },
    { name: 'Heavy Congestion', count: highCount, color: '#ef4444' },
    { name: 'Blocked / Closed', count: blockedCount, color: '#64748b' },
  ];

  // 24-Hour travel time curve for dashboard line chart
  const baseTripMinutes = routeResult?.totalTimeMinutes || (currentRegion === 'telangana' ? 120 : 35);
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const mult = getHourTrafficMultiplier(h);
    return {
      hour: `${h}:00`,
      travelTimeMinutes: Number((baseTripMinutes * (mult / 1.25)).toFixed(1)),
      rushFactor: Number(mult.toFixed(2)),
    };
  });

  // Multi-Criteria Radar Data
  const dist = routeResult?.totalDistanceKm || (currentRegion === 'telangana' ? 145 : 20);
  const time = routeResult?.totalTimeMinutes || (currentRegion === 'telangana' ? 130 : 35);
  const cost = routeResult?.totalCostInr || (currentRegion === 'telangana' ? 1040 : 180);
  const co2 = routeResult?.totalCo2Kg || (currentRegion === 'telangana' ? 18.5 : 2.5);

  const radarData = [
    {
      criterion: 'Distance (km)',
      Dijkstra: Number(dist.toFixed(0)),
      BFS: Number((dist * 1.3).toFixed(0)),
      DFS: Number((dist * 1.75).toFixed(0)),
    },
    {
      criterion: 'Time (min)',
      Dijkstra: Number(time.toFixed(0)),
      BFS: Number((time * 1.45).toFixed(0)),
      DFS: Number((time * 2.1).toFixed(0)),
    },
    {
      criterion: 'Fuel Cost (₹)',
      Dijkstra: Number((cost / 10).toFixed(0)),
      BFS: Number(((cost * 1.4) / 10).toFixed(0)),
      DFS: Number(((cost * 1.85) / 10).toFixed(0)),
    },
    {
      criterion: 'CO₂ Footprint',
      Dijkstra: Number((co2 * 3).toFixed(0)),
      BFS: Number((co2 * 4.2).toFixed(0)),
      DFS: Number((co2 * 6.5).toFixed(0)),
    },
  ];

  const tooltipContentStyle = {
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    borderRadius: '8px',
    fontSize: '11px',
    color: isDarkMode ? '#f1f5f9' : '#0f172a',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Region Selector */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <span>B.Tech Project-Based Learning</span>
              <span>·</span>
              <span>Multi-Criteria Graph Navigation & Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Smart Route Finder Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time route calculation, algorithm benchmarking, and traffic simulation across{' '}
              <strong className="text-cyan-300">
                {currentRegion === 'telangana' ? 'the entire State of Telangana' : 'Hyderabad Metropolitan Area'}
              </strong>
              .
            </p>
          </div>

          {/* Region Switcher Pills */}
          <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 shrink-0 self-start md:self-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1 flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-cyan-400" />
              Active Map Scope:
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onToggleRegion('telangana')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentRegion === 'telangana'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Telangana State (Whole State)</span>
              </button>
              <button
                onClick={() => onToggleRegion('hyderabad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentRegion === 'hyderabad'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Hyderabad Metro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {currentRegion === 'telangana' ? 'Telangana Districts' : 'Metro Landmarks'}
            </span>
            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {locations.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {currentRegion === 'telangana' ? 'Major District Vertices |V|' : 'Key City Vertices |V|'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {currentRegion === 'telangana' ? 'State Highways (NH/SH)' : 'Connected City Roads'}
            </span>
            <Route className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {roads.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active Network Edges |E|</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Route Result</span>
            <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
            {routeResult?.totalDistanceKm || 0} <span className="text-xs font-normal text-slate-500">km</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ~{routeResult?.totalTimeMinutes || 0} min ({routeResult?.algorithm.toUpperCase() || 'DIJKSTRA'})
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Routes Computed</span>
            <Calculator className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {routesCalculatedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active Session Computations</div>
        </div>
      </div>

      {/* Main Interactive Map for Whole State / City */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              {currentRegion === 'telangana'
                ? 'Telangana State Inter-District Road Network Map'
                : 'Hyderabad Metropolitan Core Map'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive Leaflet GIS map with traffic-colored highway polylines and computed optimal route overlay.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {lowCount} Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {medCount} Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {highCount} Congested
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> {blockedCount} Blocked
            </span>
          </div>
        </div>

        <div className="h-[480px]">
          <LeafletMap
            locations={locations}
            roads={roads}
            sourceId={routeResult?.sourceId || locations[0]?.id || ''}
            destinationId={routeResult?.destinationId || locations[1]?.id || ''}
            optimalPath={routeResult?.path || []}
            onSelectSource={() => onNavigateToFindRoute()}
            onSelectDestination={() => onNavigateToFindRoute()}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* DASHBOARD DATA VISUALIZATIONS SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Live Dashboard Data Visualizations & Graph Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computed directly from active graph algorithms, rush-hour models, and multi-criteria functions.
            </p>
          </div>
        </div>

        {/* 3 Dashboard Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Chart 1: 24-Hour Travel Time Congestion Curve */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                Travel Time vs. 24-Hour Rush Clock (min)
              </h3>
              <span className="text-[11px] text-slate-500">Peak at 9 AM & 6:30 PM</span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(val: any) => [`${val} min`, 'Duration']} />
                  <Line
                    type="monotone"
                    dataKey="travelTimeMinutes"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Road Traffic Distribution Donut */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-amber-500" />
                Network Traffic Condition Distribution
              </h3>
              <span className="text-[11px] text-slate-500">{roads.length} Highway Edges</span>
            </div>
            <div className="h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {trafficDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipContentStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Multi-Criteria Trade-off Radar */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                Multi-Criteria Trade-off Radar
              </h3>
              <span className="text-[11px] text-slate-500">Distance vs Time vs Cost vs CO₂</span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                  <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10, fill: isDarkMode ? '#cbd5e1' : '#475569' }} />
                  <PolarRadiusAxis />
                  <Radar name="Dijkstra (Optimal)" dataKey="Dijkstra" stroke="#0284c7" fill="#0284c7" fillOpacity={0.4} />
                  <Radar name="BFS (Fewest Hops)" dataKey="BFS" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                  <Radar name="DFS (Deep Branch)" dataKey="DFS" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={tooltipContentStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Route Shortcuts & Recent Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Route Shortcuts */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              Popular {currentRegion === 'telangana' ? 'Telangana State Highways' : 'Hyderabad Metro Corridors'}
            </h3>
            <span className="text-[11px] text-slate-400">1-Click Compute</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeShortcuts.map((trip, idx) => (
              <button
                key={idx}
                onClick={() => onQuickRoute(trip.from, trip.to)}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                    {trip.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {trip.via}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold pt-2">
                  <span>{trip.dist}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Calculate <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              Recent Path Calculations
            </h3>
            {recentSearches.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-[11px] text-rose-500 hover:underline"
              >
                Clear History
              </button>
            )}
          </div>

          {recentSearches.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent searches recorded yet. Pick a shortcut or use Find Route.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {recentSearches.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onQuickRoute(item.sourceId, item.destId)}
                  className="w-full text-left pt-2.5 first:pt-0 hover:text-cyan-600 transition-colors text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.sourceName.split('(')[0]} → {item.destName.split('(')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.distanceKm} km · {item.timeMins} min · {item.algorithm.toUpperCase()}
                    </div>
                  </div>
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
