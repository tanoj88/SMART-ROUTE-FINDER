import { RoadEdge, TrafficLevel } from '../types';

export interface TrafficPreset {
  id: string;
  name: string;
  description: string;
  timeHour: number;
}

export const TRAFFIC_PRESETS: TrafficPreset[] = [
  {
    id: 'morning_rush',
    name: 'Morning Rush Hour (9:00 AM)',
    description: 'Heavy commuter and IT corridor inflow along Cyberabad and Banjara Hills.',
    timeHour: 9,
  },
  {
    id: 'evening_rush',
    name: 'Evening Peak Hour (6:30 PM)',
    description: 'Intense congestion radiating outwards from HITEC City, Gachibowli, and Begumpet.',
    timeHour: 18,
  },
  {
    id: 'monsoon_waterlogging',
    name: 'Heavy Monsoon / Waterlogging',
    description: 'Seasonal torrential downpours causing localized blockages in low-lying corridors.',
    timeHour: 15,
  },
  {
    id: 'normal_midday',
    name: 'Midday Normal (2:00 PM)',
    description: 'Standard daytime commercial flow with moderate arterial slowdowns.',
    timeHour: 14,
  },
  {
    id: 'midnight_smooth',
    name: 'Late Night Transit (1:00 AM)',
    description: 'Uncongested open expressways with maximum vehicular flow.',
    timeHour: 1,
  },
];

/**
 * Returns rush hour multiplier based on the 24-hour clock.
 * Values > 1.0 mean heavier congestion and slower speeds.
 */
export function getHourTrafficMultiplier(hour: number): number {
  if (hour >= 8 && hour <= 10) {
    // Morning peak (8:00 AM - 10:00 AM)
    return 1.8 + (1 - Math.abs(hour - 9)) * 0.4; // peaks at 9 AM ~2.2x
  } else if (hour >= 17 && hour <= 20) {
    // Evening peak (5:00 PM - 8:00 PM)
    return 1.9 + (1 - Math.abs(hour - 18.5) / 1.5) * 0.5; // peaks around 6:30 PM ~2.4x
  } else if (hour >= 12 && hour <= 16) {
    // Midday moderate
    return 1.25;
  } else if (hour >= 23 || hour <= 5) {
    // Late night
    return 0.85;
  } else {
    // Shoulder hours (6-7 AM, 11 AM, 21-22 PM)
    return 1.1;
  }
}

/**
 * Applies a specific preset to a collection of road edges
 */
export function applyTrafficPreset(edges: RoadEdge[], presetId: string): RoadEdge[] {
  return edges.map((edge) => {
    switch (presetId) {
      case 'morning_rush': {
        // Tech corridor roads into Hitec City / Gachibowli become high
        const isTechInflow =
          edge.u === 'banjarahills' ||
          edge.v === 'jubileehills' ||
          edge.u === 'jubileehills' ||
          edge.v === 'hiteccity' ||
          edge.v === 'dlf' ||
          edge.v === 'inorbit' ||
          edge.u === 'kphb';
        return {
          ...edge,
          trafficLevel: isTechInflow ? 'high' : edge.trafficLevel === 'blocked' ? 'low' : edge.trafficLevel,
        };
      }
      case 'evening_rush': {
        const isEveningOutflow =
          edge.u === 'hiteccity' ||
          edge.u === 'dlf' ||
          edge.u === 'gachibowli' ||
          edge.v === 'secunderabad' ||
          edge.v === 'begumpet' ||
          edge.u === 'jubileehills';
        return {
          ...edge,
          trafficLevel: isEveningOutflow ? 'high' : edge.trafficLevel === 'blocked' ? 'low' : edge.trafficLevel,
        };
      }
      case 'monsoon_waterlogging': {
        // Low lying roads near lakes and Musi river get blocked or high
        const isLowLying = edge.id === 'r1' || edge.id === 'r37' || edge.id === 'r11' || edge.id === 'r34';
        return {
          ...edge,
          trafficLevel: isLowLying ? (edge.id === 'r1' ? 'blocked' : 'high') : 'medium',
        };
      }
      case 'midnight_smooth': {
        return {
          ...edge,
          trafficLevel: 'low',
        };
      }
      case 'normal_midday':
      default: {
        return {
          ...edge,
          trafficLevel: edge.id === 'r11' || edge.id === 'r18' ? 'medium' : 'low',
        };
      }
    }
  });
}

/**
 * Randomize road traffic with realistic weighting
 */
export function randomizeRoadTraffic(edges: RoadEdge[]): RoadEdge[] {
  const levels: TrafficLevel[] = ['low', 'low', 'medium', 'medium', 'high'];
  return edges.map((edge) => {
    // Small chance to retain blocked, otherwise random
    const rand = Math.random();
    const newLevel = rand < 0.05 ? 'blocked' : levels[Math.floor(Math.random() * levels.length)];
    return {
      ...edge,
      trafficLevel: newLevel,
    };
  });
}

/**
 * Color associated with traffic level for Leaflet and SVG
 */
export function getTrafficColor(level: TrafficLevel): string {
  switch (level) {
    case 'low':
      return '#10b981'; // emerald-500
    case 'medium':
      return '#f59e0b'; // amber-500
    case 'high':
      return '#ef4444'; // red-500
    case 'blocked':
      return '#475569'; // slate-600
  }
}

/**
 * Returns human readable label and speed note
 */
export function getTrafficMeta(level: TrafficLevel): { label: string; speedMultiplier: string; badgeColor: string } {
  switch (level) {
    case 'low':
      return { label: 'Free Flow', speedMultiplier: '100% Speed', badgeColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' };
    case 'medium':
      return { label: 'Moderate', speedMultiplier: '65% Speed', badgeColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300' };
    case 'high':
      return { label: 'Heavy Delay', speedMultiplier: '35% Speed', badgeColor: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300' };
    case 'blocked':
      return { label: 'Road Blocked', speedMultiplier: '0% Impassable', badgeColor: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' };
  }
}
