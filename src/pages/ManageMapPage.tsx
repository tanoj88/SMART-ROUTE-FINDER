import React, { useState } from 'react';
import { LocationNode, RoadEdge, TrafficLevel, NodeCategory, RegionType } from '../types';
import {
  MapPin,
  Route,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Search,
  Globe2,
} from 'lucide-react';

interface ManageMapPageProps {
  locations: LocationNode[];
  roads: RoadEdge[];
  onUpdateLocations: (locs: LocationNode[]) => void;
  onUpdateRoads: (roads: RoadEdge[]) => void;
  onResetToDefault: () => void;
  currentRegion: RegionType;
  onToggleRegion: (region: RegionType) => void;
}

export const ManageMapPage: React.FC<ManageMapPageProps> = ({
  locations,
  roads,
  onUpdateLocations,
  onUpdateRoads,
  onResetToDefault,
  currentRegion,
  onToggleRegion,
}) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'edges'>('nodes');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Node Form State
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeLat, setNewNodeLat] = useState('');
  const [newNodeLng, setNewNodeLng] = useState('');
  const [newNodeCategory, setNewNodeCategory] = useState<NodeCategory>('commercial');
  const [newNodeDesc, setNewNodeDesc] = useState('');

  // New Road Form State
  const [newRoadU, setNewRoadU] = useState('');
  const [newRoadV, setNewRoadV] = useState('');
  const [newRoadName, setNewRoadName] = useState('');
  const [newRoadDist, setNewRoadDist] = useState('');
  const [newRoadSpeed, setNewRoadSpeed] = useState('45');
  const [newRoadTraffic, setNewRoadTraffic] = useState<TrafficLevel>('low');

  const locMap = new Map<string, LocationNode>();
  locations.forEach((l) => locMap.set(l.id, l));

  const showFeedback = (err: string | null, succ: string | null) => {
    setValidationError(err);
    setSuccessMsg(succ);
    setTimeout(() => {
      setValidationError(null);
      setSuccessMsg(null);
    }, 4000);
  };

  // Add Node Handler
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const id = newNodeId.trim().toLowerCase().replace(/\s+/g, '_');
    const name = newNodeName.trim();
    const lat = parseFloat(newNodeLat);
    const lng = parseFloat(newNodeLng);

    if (!id || !name || isNaN(lat) || isNaN(lng)) {
      showFeedback('Please fill out ID, Name, Latitude, and Longitude accurately.', null);
      return;
    }

    if (locations.some((l) => l.id === id)) {
      showFeedback(`A location with ID '${id}' already exists. Use a unique identifier.`, null);
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showFeedback('Latitude must be between -90 and 90; Longitude between -180 and 180.', null);
      return;
    }

    const newNode: LocationNode = {
      id,
      name,
      lat,
      lng,
      category: newNodeCategory,
      description: newNodeDesc.trim() || `${name} in Hyderabad Metropolitan Area.`,
    };

    onUpdateLocations([...locations, newNode]);
    showFeedback(null, `Location '${name}' added successfully!`);
    setNewNodeId('');
    setNewNodeName('');
    setNewNodeLat('');
    setNewNodeLng('');
    setNewNodeDesc('');
  };

  // Delete Node Handler
  const handleDeleteLocation = (nodeId: string) => {
    if (locations.length <= 4) {
      showFeedback('Cannot delete: graph must retain at least 4 vertices for valid routing.', null);
      return;
    }

    const updatedLocations = locations.filter((l) => l.id !== nodeId);
    // Remove all incident edges connected to deleted node
    const updatedRoads = roads.filter((r) => r.u !== nodeId && r.v !== nodeId);

    onUpdateLocations(updatedLocations);
    onUpdateRoads(updatedRoads);
    showFeedback(null, `Location '${nodeId}' and its incident roads removed.`);
  };

  // Add Road Handler
  const handleAddRoad = (e: React.FormEvent) => {
    e.preventDefault();
    const u = newRoadU || locations[0]?.id;
    const v = newRoadV || locations[1]?.id;
    const name = newRoadName.trim() || `${locMap.get(u)?.name} - ${locMap.get(v)?.name} Link`;
    const dist = parseFloat(newRoadDist);
    const speed = parseFloat(newRoadSpeed);

    if (!u || !v || isNaN(dist) || isNaN(speed)) {
      showFeedback('Please specify valid origin, destination, distance, and speed limit.', null);
      return;
    }

    if (u === v) {
      showFeedback('Self-loops are not allowed in simple transportation networks.', null);
      return;
    }

    if (dist <= 0) {
      showFeedback('Distance must be strictly positive (> 0 km).', null);
      return;
    }

    if (roads.some((r) => (r.u === u && r.v === v) || (!r.isOneWay && r.u === v && r.v === u))) {
      showFeedback('A road connection already connects these two vertices.', null);
      return;
    }

    const newEdge: RoadEdge = {
      id: `r_${Date.now()}`,
      u,
      v,
      name,
      distanceKm: dist,
      baseSpeedKmh: speed,
      trafficLevel: newRoadTraffic,
      isOneWay: false,
    };

    onUpdateRoads([...roads, newEdge]);
    showFeedback(null, `Road connection '${name}' successfully added!`);
    setNewRoadDist('');
    setNewRoadName('');
  };

  // Delete Road Handler
  const handleDeleteRoad = (roadId: string) => {
    const updatedRoads = roads.filter((r) => r.id !== roadId);
    onUpdateRoads(updatedRoads);
    showFeedback(null, `Road edge removed.`);
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      locations,
      roads,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hyderabad_graph_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.locations) && Array.isArray(parsed.roads)) {
          onUpdateLocations(parsed.locations);
          onUpdateRoads(parsed.roads);
          showFeedback(null, `Graph imported successfully: ${parsed.locations.length} nodes, ${parsed.roads.length} edges.`);
        } else {
          showFeedback('Invalid JSON format: must contain "locations" and "roads" arrays.', null);
        }
      } catch (err) {
        showFeedback('Failed to parse graph JSON file.', null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & File Operations */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Graph Network Topology & Dataset Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add, update, or remove vertices and road edges. All changes instantly persist to local storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Region preset selector */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => onToggleRegion('telangana')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentRegion === 'telangana'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Telangana State
            </button>
            <button
              onClick={() => onToggleRegion('hyderabad')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currentRegion === 'hyderabad'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hyderabad City
            </button>
          </div>

          <label className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            Import JSON
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={onResetToDefault}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs: Locations vs. Roads */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('nodes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'nodes'
              ? 'bg-slate-900 text-white dark:bg-cyan-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Locations / Vertices ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('edges')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'edges'
              ? 'bg-slate-900 text-white dark:bg-cyan-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          Road Connections / Edges ({roads.length})
        </button>
      </div>

      {/* Tab Content: Vertices */}
      {activeTab === 'nodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Location Form */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Add New Landmark Vertex
            </h3>
            <form onSubmit={handleAddLocation} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Unique ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. gachibowli_stadium"
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Landmark Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gachibowli Stadium"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="17.4401"
                    value={newNodeLat}
                    onChange={(e) => setNewNodeLat(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="78.3489"
                    value={newNodeLng}
                    onChange={(e) => setNewNodeLng(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category Hub
                </label>
                <select
                  value={newNodeCategory}
                  onChange={(e) => setNewNodeCategory(e.target.value as NodeCategory)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white capitalize focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="tech">Tech</option>
                  <option value="heritage">Heritage</option>
                  <option value="transit">Transit</option>
                  <option value="commercial">Commercial</option>
                  <option value="residential">Residential</option>
                  <option value="education">Education</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Key regional characteristics..."
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-sm transition-colors text-xs"
              >
                Insert Vertex into Graph
              </button>
            </form>
          </div>

          {/* Locations Table */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[520px]">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Active Vertices ({locations.length})</span>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {locations
                .filter((l) => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.includes(searchTerm.toLowerCase()))
                .map((loc) => (
                  <div key={loc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{loc.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                          {loc.category}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {loc.id} · ({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)})
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Road Edges */}
      {activeTab === 'edges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Road Form */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Add Road Connection Edge
            </h3>
            <form onSubmit={handleAddRoad} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Vertex U (Source)
                  </label>
                  <select
                    value={newRoadU}
                    onChange={(e) => setNewRoadU(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name.split('(')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Vertex V (Dest)
                  </label>
                  <select
                    value={newRoadV}
                    onChange={(e) => setNewRoadV(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name.split('(')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Road Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Outer Ring Road Phase 2"
                  value={newRoadName}
                  onChange={(e) => setNewRoadName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 6.5"
                    value={newRoadDist}
                    onChange={(e) => setNewRoadDist(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Base Speed (km/h)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={newRoadSpeed}
                    onChange={(e) => setNewRoadSpeed(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-sm transition-colors text-xs"
              >
                Insert Edge into Graph
              </button>
            </form>
          </div>

          {/* Roads Table */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col h-[520px]">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Active Edges ({roads.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {roads.map((road) => (
                <div key={road.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {road.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {locMap.get(road.u)?.name.split('(')[0]} ↔ {locMap.get(road.v)?.name.split('(')[0]} · {road.distanceKm} km · {road.baseSpeedKmh} km/h · {road.trafficLevel.toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRoad(road.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete Edge"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
