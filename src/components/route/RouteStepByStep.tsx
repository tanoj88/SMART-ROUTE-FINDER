import React from 'react';
import { AlternativeRoute, RouteResult, VehicleType } from '../../types';
import {
  Compass,
  Clock,
  Fuel,
  Leaf,
  Layers,
  ArrowRight,
  Download,
  Share2,
  CheckCircle2,
  Route,
  Zap,
} from 'lucide-react';

interface RouteStepByStepProps {
  result: RouteResult;
  alternativeRoutes: AlternativeRoute[];
  activeAlternativeId: string | null;
  onSelectAlternative: (id: string | null) => void;
  onExportCsv: () => void;
}

export const RouteStepByStep: React.FC<RouteStepByStepProps> = ({
  result,
  alternativeRoutes,
  activeAlternativeId,
  onSelectAlternative,
  onExportCsv,
}) => {
  if (!result.success) {
    return (
      <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200">
        <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
          <span>Route Calculation Failed</span>
        </h4>
        <p className="text-xs leading-relaxed">
          {result.errorMessage || 'No valid path could be discovered between the selected nodes.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Route className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Total Distance</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {result.totalDistanceKm} <span className="text-xs font-sans font-normal text-slate-500">km</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Estimated Time</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {result.totalTimeMinutes} <span className="text-xs font-sans font-normal text-slate-500">min</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Fuel className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Fuel Expense</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            ₹{result.totalCostInr} <span className="text-xs font-sans font-normal text-slate-500">INR</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>CO₂ Emissions</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {result.totalCo2Kg} <span className="text-xs font-sans font-normal text-slate-500">kg</span>
          </div>
        </div>
      </div>

      {/* Secondary Performance Badge Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-4">
          <span>
            Nodes Visited: <strong className="font-mono text-slate-900 dark:text-white">{result.nodesVisitedCount}</strong>
          </span>
          <span>
            Edges Explored: <strong className="font-mono text-slate-900 dark:text-white">{result.edgesExploredCount}</strong>
          </span>
          <span>
            Execution Time: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{result.executionTimeMs} ms</strong>
          </span>
        </div>
        <button
          onClick={onExportCsv}
          className="flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
        >
          <Download className="w-3.5 h-3.5" /> Export Route CSV
        </button>
      </div>

      {/* Alternative Routes Selector (if any) */}
      {alternativeRoutes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Alternative Routes Available ({alternativeRoutes.length + 1})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Primary Option */}
            <button
              onClick={() => onSelectAlternative(null)}
              className={`p-2.5 rounded-lg text-left border transition-all text-xs ${
                activeAlternativeId === null
                  ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 ring-1 ring-cyan-500/50'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>Best Choice</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">{result.totalTimeMinutes} min</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {result.totalDistanceKm} km · ₹{result.totalCostInr}
              </div>
            </button>

            {/* Alternatives */}
            {alternativeRoutes.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSelectAlternative(alt.id)}
                className={`p-2.5 rounded-lg text-left border transition-all text-xs ${
                  activeAlternativeId === alt.id
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-500/50'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{alt.name}</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">{alt.timeMinutes} min</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {alt.distanceKm} km · ₹{alt.costInr}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Turn-by-Turn Directions List */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Turn-by-Turn Navigation Steps ({result.steps.length})
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Path: {result.path.length} vertices
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
          {result.steps.map((step) => (
            <div
              key={step.stepNumber}
              className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-3 text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {step.stepNumber}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {step.instruction}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>Via {step.roadName}</span>
                  <span>·</span>
                  <span className="font-mono">{step.distanceKm} km</span>
                  <span>·</span>
                  <span className="font-mono">~{step.timeMinutes} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
