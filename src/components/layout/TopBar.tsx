import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Clock,
  BookOpen,
  FileCode,
  Download,
  Share2,
  Search,
} from 'lucide-react';
import { LocationNode, RegionType } from '../../types';
import { Globe2 } from 'lucide-react';

interface TopBarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  simulationHour: number;
  onHourChange: (hour: number) => void;
  onOpenViva: () => void;
  onOpenPython: () => void;
  locations: LocationNode[];
  onSelectLocation: (id: string) => void;
  currentRegion: RegionType;
  onToggleRegion: (region: RegionType) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isDarkMode,
  onToggleTheme,
  simulationHour,
  onHourChange,
  onOpenViva,
  onOpenPython,
  locations,
  onSelectLocation,
  currentRegion,
  onToggleRegion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredLocations = searchQuery.trim()
    ? locations.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 flex items-center justify-between gap-6 shrink-0 z-30 transition-colors">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            SRF
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Smart Route Finder
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              BTech PBL · Multi-Criteria Routing
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: Search input for map landmarks */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search Hyderabad landmark (e.g. Charminar, HITEC City)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />

        {showSearchResults && filteredLocations.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  onSelectLocation(loc.id);
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{loc.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{loc.category} Hub</div>
                </div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">Inspect</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Region Switcher */}
        <button
          onClick={() => onToggleRegion(currentRegion === 'telangana' ? 'hyderabad' : 'telangana')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
          title="Toggle between Telangana State and Hyderabad Metro"
        >
          <Globe2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">Map:</span>
          <span className="font-bold text-cyan-700 dark:text-cyan-300">
            {currentRegion === 'telangana' ? 'Telangana State' : 'Hyderabad Metro'}
          </span>
        </button>

        {/* Time of Day Slider Widget */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap">
            {formatHour(simulationHour)}
          </span>
          <input
            type="range"
            min="0"
            max="23"
            value={simulationHour}
            onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
            className="w-16 accent-cyan-600 cursor-pointer"
            title="Adjust simulation hour (0-23h)"
          />
        </div>

        {/* Viva Voce Questions Button */}
        <button
          onClick={onOpenViva}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Viva Prep</span>
        </button>

        {/* Python Code Viewer Button */}
        <button
          onClick={onOpenPython}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">Python 3 Backend</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>
    </header>
  );
};
