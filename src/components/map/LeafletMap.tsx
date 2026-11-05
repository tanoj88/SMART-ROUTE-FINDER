import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AlternativeRoute, LocationNode, RoadEdge, TrafficLevel } from '../../types';
import { getTrafficColor } from '../../utils/trafficSimulation';
import { Layers, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface LeafletMapProps {
  locations: LocationNode[];
  roads: RoadEdge[];
  sourceId: string;
  destinationId: string;
  optimalPath: string[];
  alternativeRoutes?: AlternativeRoute[];
  activeAlternativeId?: string | null;
  onSelectSource: (id: string) => void;
  onSelectDestination: (id: string) => void;
  visitedNodes?: string[];
  currentNodeId?: string | null;
  isDarkMode?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  locations,
  roads,
  sourceId,
  destinationId,
  optimalPath,
  alternativeRoutes = [],
  activeAlternativeId,
  onSelectSource,
  onSelectDestination,
  visitedNodes = [],
  currentNodeId,
  isDarkMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Determine if network is statewide or city
      const lats = locations.map((l) => l.lat);
      const lngs = locations.map((l) => l.lng);
      const isStateWide = (Math.max(...lats) - Math.min(...lats)) > 1.0;

      const initialCenter: [number, number] = isStateWide
        ? [17.8500, 79.1500]
        : [17.4150, 78.4350];
      const initialZoom = isStateWide ? 7.5 : 12;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
      });

      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Fit bounds to network
      if (locations.length > 0) {
        const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]));
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: isStateWide ? 9 : 13 });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update theme tiles
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '&copy; CARTO, &copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }
  }, [isDarkMode]);

  // Update Elements on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const locMap = new Map<string, LocationNode>();
    locations.forEach((l) => locMap.set(l.id, l));

    // 1. Draw Road Network Edges
    roads.forEach((road) => {
      const u = locMap.get(road.u);
      const v = locMap.get(road.v);
      if (!u || !v) return;

      const color = getTrafficColor(road.trafficLevel);
      const isBlocked = road.trafficLevel === 'blocked';

      const line = L.polyline(
        [
          [u.lat, u.lng],
          [v.lat, v.lng],
        ],
        {
          color,
          weight: isBlocked ? 2 : 3.5,
          opacity: isBlocked ? 0.4 : 0.75,
          dashArray: isBlocked ? '5, 8' : undefined,
        }
      );

      line.bindTooltip(
        `<div class="text-xs font-semibold">${road.name}</div>
         <div class="text-[11px] text-slate-500">${road.distanceKm} km · ${road.trafficLevel.toUpperCase()} traffic</div>`,
        { sticky: true, opacity: 0.95 }
      );

      layers.addLayer(line);
    });

    // 2. Draw Alternative Routes (if present)
    alternativeRoutes.forEach((alt) => {
      const isActive = activeAlternativeId === alt.id;
      const coords: [number, number][] = [];
      alt.path.forEach((nodeId) => {
        const node = locMap.get(nodeId);
        if (node) coords.push([node.lat, node.lng]);
      });

      if (coords.length > 1) {
        const altLine = L.polyline(coords, {
          color: alt.color,
          weight: isActive ? 6 : 4,
          opacity: isActive ? 0.95 : 0.6,
          dashArray: isActive ? undefined : '6, 6',
        });
        altLine.bindTooltip(`<b>${alt.name}</b>: ${alt.distanceKm} km (${alt.timeMinutes} min)`, { sticky: true });
        layers.addLayer(altLine);
      }
    });

    // 3. Draw Optimal Route with Outer Glow & Inner Line
    if (optimalPath.length > 1 && !activeAlternativeId) {
      const pathCoords: [number, number][] = [];
      optimalPath.forEach((id) => {
        const node = locMap.get(id);
        if (node) pathCoords.push([node.lat, node.lng]);
      });

      // Outer glow
      const glowLine = L.polyline(pathCoords, {
        color: '#0284c7',
        weight: 9,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layers.addLayer(glowLine);

      // Core crisp path
      const coreLine = L.polyline(pathCoords, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layers.addLayer(coreLine);
    }

    // 4. Draw Location Markers
    locations.forEach((node) => {
      const isSource = node.id === sourceId;
      const isDestination = node.id === destinationId;
      const isCurrent = node.id === currentNodeId;
      const isVisited = visitedNodes.includes(node.id);
      const isOnOptimalPath = optimalPath.includes(node.id);

      let markerBg = 'bg-slate-700 text-white border-white';
      let pingPulse = '';
      let markerText = node.name.charAt(0);

      if (isSource) {
        markerBg = 'bg-emerald-600 text-white border-emerald-200 ring-4 ring-emerald-500/30';
        markerText = 'A';
      } else if (isDestination) {
        markerBg = 'bg-rose-600 text-white border-rose-200 ring-4 ring-rose-500/30';
        markerText = 'B';
      } else if (isCurrent) {
        markerBg = 'bg-amber-500 text-white border-amber-200 ring-4 ring-amber-500/40';
        pingPulse = 'animate-ping';
      } else if (isOnOptimalPath) {
        markerBg = 'bg-cyan-600 text-white border-cyan-200 ring-2 ring-cyan-500/20';
      } else if (isVisited) {
        markerBg = 'bg-indigo-600/80 text-white border-indigo-200';
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center">
            ${isCurrent ? `<span class="absolute w-8 h-8 rounded-full bg-amber-400 opacity-75 ${pingPulse}"></span>` : ''}
            <div class="w-7 h-7 rounded-full shadow-md flex items-center justify-center text-xs font-bold border-2 transition-transform hover:scale-125 ${markerBg}">
              ${markerText}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 dark:text-slate-100 min-w-[200px]';
      popupContent.innerHTML = `
        <div class="font-bold text-sm leading-tight text-slate-900 dark:text-white">${node.name}</div>
        <div class="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 capitalize mb-1">${node.category} Hub</div>
        <div class="text-xs text-slate-600 dark:text-slate-300 leading-snug mb-3">${node.description}</div>
        <div class="flex gap-2">
          <button id="btn-src-${node.id}" class="flex-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors">
            Set Start
          </button>
          <button id="btn-dst-${node.id}" class="flex-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors">
            Set End
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btnSrc = document.getElementById(`btn-src-${node.id}`);
        const btnDst = document.getElementById(`btn-dst-${node.id}`);
        if (btnSrc) {
          btnSrc.onclick = () => {
            onSelectSource(node.id);
            marker.closePopup();
          };
        }
        if (btnDst) {
          btnDst.onclick = () => {
            onSelectDestination(node.id);
            marker.closePopup();
          };
        }
      });

      layers.addLayer(marker);
    });
  }, [locations, roads, sourceId, destinationId, optimalPath, alternativeRoutes, activeAlternativeId, visitedNodes, currentNodeId]);

  // Fit bounds to route
  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const locMap = new Map<string, LocationNode>();
    locations.forEach((l) => locMap.set(l.id, l));

    const pathToFit = optimalPath.length > 0 ? optimalPath : [sourceId, destinationId];
    const coords: [number, number][] = [];
    pathToFit.forEach((id) => {
      const node = locMap.get(id);
      if (node) coords.push([node.lat, node.lng]);
    });

    if (coords.length > 0) {
      mapInstanceRef.current.fitBounds(coords, { padding: [40, 40], maxZoom: 14 });
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    if (!mapInstanceRef.current || locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35] });
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-700 my-0.5" />
        <button
          onClick={handleFitRoute}
          title="Fit Route to Screen"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Hyderabad Center"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Legend Box */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md text-xs">
        <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          Map Legend
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white"></span>
            <span>Origin (A)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white"></span>
            <span>Destination (B)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-[#0284c7] rounded"></span>
            <span>Optimal Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-emerald-500 rounded"></span>
            <span>Low Traffic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-amber-500 rounded"></span>
            <span>Moderate Traffic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-rose-500 rounded"></span>
            <span>Heavy Traffic</span>
          </div>
        </div>
      </div>
    </div>
  );
};
