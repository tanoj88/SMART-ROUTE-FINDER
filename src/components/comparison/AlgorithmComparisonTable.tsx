import React from 'react';
import { AlgorithmBenchmark } from '../../types';
import { Check, X, Award, Info, Download, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

interface AlgorithmComparisonTableProps {
  benchmarks: AlgorithmBenchmark[];
  sourceName: string;
  destName: string;
  onExportCsv: () => void;
}

export const AlgorithmComparisonTable: React.FC<AlgorithmComparisonTableProps> = ({
  benchmarks,
  sourceName,
  destName,
  onExportCsv,
}) => {
  // Find fastest optimal algorithm
  const optimalAlgos = benchmarks.filter((b) => b.isOptimal && b.path.length > 0);
  const bestAlgo = optimalAlgos.reduce(
    (prev, curr) => (curr.executionTimeMs < prev.executionTimeMs ? curr : prev),
    optimalAlgos[0] || benchmarks[0]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Best Algorithm Highlight */}
      {bestAlgo && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-900/40 via-sky-900/30 to-blue-900/20 border border-cyan-500/30 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-600 text-white shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-400">
                Recommended Algorithm for Point-to-Point Routing
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {bestAlgo.name}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  ({bestAlgo.executionTimeMs} ms · {bestAlgo.nodesVisited} nodes visited)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Benchmark CSV
          </button>
        </div>
      )}

      {/* Benchmark Matrix Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Comprehensive Algorithm Evaluation Matrix
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {sourceName} → {destName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-3">Path Computed</th>
                <th className="py-3 px-3 text-right">Distance</th>
                <th className="py-3 px-3 text-right">Travel Time</th>
                <th className="py-3 px-3 text-right">Nodes Visited</th>
                <th className="py-3 px-3 text-right">Execution Time</th>
                <th className="py-3 px-3 text-center">Optimal?</th>
                <th className="py-3 px-3">Time Complexity</th>
                <th className="py-3 px-4">Data Structure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {benchmarks.map((b) => {
                const isWinner = bestAlgo && b.algorithm === bestAlgo.algorithm;
                return (
                  <tr
                    key={b.algorithm}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isWinner ? 'bg-cyan-50/30 dark:bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {isWinner && <Award className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3 px-3 max-w-[180px] truncate text-slate-600 dark:text-slate-300 font-mono text-[11px]" title={b.path.join(' → ')}>
                      {b.path.length > 0 ? b.path.join(' → ') : 'No path'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {b.distanceKm} km
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {b.timeMins} min
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {b.nodesVisited}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-cyan-600 dark:text-cyan-400 font-bold">
                      {b.executionTimeMs.toFixed(3)} ms
                    </td>
                    <td className="py-3 px-3 text-center">
                      {b.isOptimal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <X className="w-3.5 h-3.5" /> Sub-optimal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {b.timeComplexity}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                      {b.dataStructureUsed}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Theory Explanations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dijkstra vs A* */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Why A* Needs an Admissible Heuristic</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            A* uses <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">f(n) = g(n) + h(n)</code>.
            For A* to guarantee the true shortest path, the heuristic <code className="font-mono">h(n)</code> must be <strong>admissible</strong>—meaning it never overestimates the actual cost to the destination.
            In geospatial routing, the straight-line Haversine distance is the shortest possible path on Earth’s surface; hence, road distance is always $\ge$ straight-line distance, satisfying admissibility.
          </p>
        </div>

        {/* BFS & DFS Inadequacy */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Why BFS & DFS Fail On Weighted Graphs</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>BFS</strong> guarantees the minimum number of edge hops (intersections), completely ignoring distance or speed limits. A 2-hop road of 80 km will be chosen over a 3-hop road of 15 km.
            <strong>DFS</strong> explores deep branches blindly and returns the first path encountered, frequently causing massive detours.
          </p>
        </div>

        {/* Bellman-Ford Role */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>When Bellman-Ford is Essential</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            While Dijkstra assumes greedy non-negative edge costs and runs in $O((V+E)\log V)$, <strong>Bellman-Ford</strong> runs in $O(V \cdot E)$ by relaxing all edges $V-1$ times.
            Bellman-Ford is necessary in graphs with negative weights (e.g. electric vehicle regenerative downhill braking or toll cashback incentives) and detects negative cycle traps.
          </p>
        </div>
      </div>
    </div>
  );
};
