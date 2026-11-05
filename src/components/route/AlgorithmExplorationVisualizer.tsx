import React, { useState, useEffect, useRef } from 'react';
import { SearchAnimationStep } from '../../types';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Activity } from 'lucide-react';

interface AlgorithmExplorationVisualizerProps {
  searchSteps: SearchAnimationStep[];
  algorithmName: string;
  onStepChange?: (step: SearchAnimationStep | null) => void;
  onReset?: () => void;
}

export const AlgorithmExplorationVisualizer: React.FC<AlgorithmExplorationVisualizerProps> = ({
  searchSteps,
  algorithmName,
  onStepChange,
  onReset,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(400); // ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with searchSteps changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    if (searchSteps.length > 0) {
      onStepChange?.(searchSteps[0]);
    } else {
      onStepChange?.(null);
    }
  }, [searchSteps]);

  // Handle animation timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= searchSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const nextIndex = prev + 1;
          onStepChange?.(searchSteps[nextIndex]);
          return nextIndex;
        });
      }, playbackSpeedMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, searchSteps, playbackSpeedMs, onStepChange]);

  const currentStep = searchSteps[currentStepIndex];

  const handlePlayPause = () => {
    if (currentStepIndex >= searchSteps.length - 1) {
      setCurrentStepIndex(0);
      onStepChange?.(searchSteps[0]);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (currentStepIndex < searchSteps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      onStepChange?.(searchSteps[next]);
      setIsPlaying(false);
    }
  };

  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      onStepChange?.(searchSteps[prev]);
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    if (searchSteps.length > 0) {
      onStepChange?.(searchSteps[0]);
    } else {
      onStepChange?.(null);
    }
    onReset?.();
  };

  if (!searchSteps || searchSteps.length === 0) {
    return null;
  }

  const progressPercent = Math.round(((currentStepIndex + 1) / searchSteps.length) * 100);

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Search Progression Visualizer ({algorithmName})
          </h4>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Step <span className="text-white font-bold">{currentStepIndex + 1}</span> of {searchSteps.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-cyan-500 h-full transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Current Step Description Card */}
      {currentStep && (
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 mb-3 text-xs leading-relaxed">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="capitalize font-semibold text-slate-300">Action: {currentStep.type}</span>
            <span className="font-mono text-cyan-300">Cost: {currentStep.distanceSoFar.toFixed(2)}</span>
          </div>
          <p className="text-slate-200">{currentStep.description}</p>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            title="Reset to Beginning"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStepBack}
            disabled={currentStepIndex === 0}
            title="Step Backward"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> {currentStepIndex >= searchSteps.length - 1 ? 'Replay' : 'Play'}
              </>
            )}
          </button>
          <button
            onClick={handleStepForward}
            disabled={currentStepIndex >= searchSteps.length - 1}
            title="Step Forward"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Speed:</span>
          <div className="flex gap-1 bg-slate-800 p-0.5 rounded-md">
            {[
              { label: '0.5x', ms: 700 },
              { label: '1x', ms: 400 },
              { label: '2x', ms: 180 },
              { label: '5x', ms: 70 },
            ].map((spd) => (
              <button
                key={spd.label}
                onClick={() => setPlaybackSpeedMs(spd.ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  playbackSpeedMs === spd.ms
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
