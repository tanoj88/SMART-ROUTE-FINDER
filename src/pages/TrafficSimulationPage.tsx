import React, { useState } from 'react';
import { LocationNode, RoadEdge, TrafficLevel } from '../types';
import {
  TRAFFIC_PRESETS,
  getHourTrafficMultiplier,
  getTrafficColor,
  getTrafficMeta,
  applyTrafficPreset,
  randomizeRoadTraffic,
} from '../../src/utils/trafficSimulation';
import { LeafletMap } from '../components/map/LeafletMap';
import {
  Activity,
  Clock,
  Shuffle,
  Ban,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';

interface TrafficSimulationPageProps {
  locations: LocationNode[];
  roads: RoadEdge[];
  onUpdateRoads: (roads: RoadEdge[]) => void;
  simulationHour: number;
  onSetSimulationHour: (hour: number) => void;
  sourceId: string;
  destId: string;
  optimalPath: string[];
  isDarkMode: boolean;
}

export const TrafficSimulationPage: React.FC<TrafficSimulationPageProps> = ({
  locations,
  roads,
  onUpdateRoads,
  simulationHour,
  onSetSimulationHour,
  sourceId,
  destId,
  optimalPath,
  isDarkMode,
}) => {
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('normal_midday');

  const locMap = new Map<string, LocationNode>();
  locations.forEach((l) => locMap.set(l.id, l));

  const rushMultiplier = getHourTrafficMultiplier(simulationHour);

  // Apply preset
  const handleApplyPreset = (presetId: string, targetHour: number) => {
    setSelectedPresetId(presetId);
    onSetSimulationHour(targetHour);
    const updated = applyTrafficPreset(roads, presetId);
    onUpdateRoads(updated);
  };

  // Randomize
  const handleRandomize = () => {
    const updated = randomizeRoadTraffic(roads);
    onUpdateRoads(updated);
  };

  // Reset
  const handleResetToNormal = () => {
    handleApplyPreset('normal_midday', 14);
  };

  // Toggle single road status
  const handleToggleRoadTraffic = (roadId: string, newLevel: TrafficLevel) => {
    const updated = roads.map((r) => (r.id === roadId ? { ...r, trafficLevel: newLevel } : r));
    onUpdateRoads(updated);
  };

  // Filter roads
  const filteredRoads = roads.filter((r) => {
    const uName = locMap.get(r.u)?.name || '';
    const vName = locMap.get(r.v)?.name || '';
    const term = filterSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      uName.toLowerCase().includes(term) ||
      vName.toLowerCase().includes(term) ||
      r.trafficLevel.toLowerCase().includes(term)
    );
  });

  const lowCount = roads.filter((r) => r.trafficLevel === 'low').length;
  const medCount = roads.filter((r) => r.trafficLevel === 'medium').length;
  const highCount = roads.filter((r) => r.trafficLevel === 'high').length;
  const blockedCount = roads.filter((r) => r.trafficLevel === 'blocked').length;

  return (
    <div className="space-y-6">
      {/* Simulation Controls Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Dynamic Urban Traffic Simulation Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modulate hourly rush curves, randomize congestion spikes, and simulate road blocks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Randomize
            </button>
            <button
              onClick={handleResetToNormal}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* 24-Hour Slider + Delay Multiplier Indicator */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Time of Day: <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">{simulationHour}:00</span>{' '}
                {simulationHour >= 12 ? 'PM' : 'AM'}
              </span>
            </div>
            <div className="text-xs">
              Rush Delay Factor:{' '}
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {rushMultiplier.toFixed(2)}x
              </span>{' '}
              <span className="text-slate-400 text-[11px]">
                {simulationHour >= 8 && simulationHour <= 10
                  ? '(Morning Office Peak)'
                  : simulationHour >= 17 && simulationHour <= 20
                  ? '(Evening Commute Rush)'
                  : '(Moderate)'}
              </span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="23"
            value={simulationHour}
            onChange={(e) => onSetSimulationHour(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>00:00 (Midnight)</span>
            <span>06:00 (Dawn)</span>
            <span className="text-rose-500 font-bold">09:00 (Rush Peak)</span>
            <span>13:00 (Noon)</span>
            <span className="text-rose-500 font-bold">18:30 (Evening Peak)</span>
            <span>23:00 (Night)</span>
          </div>
        </div>

        {/* Preset Scenarios Strip */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Simulate Real-World Scenarios
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TRAFFIC_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id, preset.timeHour)}
                className={`p-2.5 rounded-lg text-left border transition-all text-xs ${
                  selectedPresetId === preset.id
                    ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-bold ring-1 ring-cyan-500'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold">{preset.name.split('(')[0]}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{preset.name.split('(')[1]?.replace(')', '') || ''}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Road List Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map with Heatmap-Style Coloring */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Live Color-Coded Road Network</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {lowCount} Low</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {medCount} Med</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {highCount} High</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> {blockedCount} Blocked</span>
            </div>
          </div>

          <div className="h-[520px]">
            <LeafletMap
              locations={locations}
              roads={roads}
              sourceId={sourceId}
              destinationId={destId}
              optimalPath={optimalPath}
              onSelectSource={() => {}}
              onSelectDestination={() => {}}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Road Segments Interactive Control Table */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[550px]">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Road Network Segments ({roads.length})
              </h3>
              <span className="text-[11px] text-slate-400">Click to change state</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search road or location..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRoads.map((road) => {
              const uNode = locMap.get(road.u);
              const vNode = locMap.get(road.v);
              const meta = getTrafficMeta(road.trafficLevel);

              return (
                <div key={road.id} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={road.name}>
                      {road.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${meta.badgeColor}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      {uNode?.name.split('(')[0]} ↔ {vNode?.name.split('(')[0]}
                    </span>
                    <span className="font-mono">{road.distanceKm} km · {road.baseSpeedKmh} km/h base</span>
                  </div>

                  {/* Quick state switcher buttons */}
                  <div className="flex gap-1 pt-0.5">
                    {(['low', 'medium', 'high', 'blocked'] as TrafficLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => handleToggleRoadTraffic(road.id, lvl)}
                        className={`flex-1 py-1 rounded text-[10px] font-semibold capitalize transition-colors ${
                          road.trafficLevel === lvl
                            ? 'bg-slate-900 text-white dark:bg-cyan-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
