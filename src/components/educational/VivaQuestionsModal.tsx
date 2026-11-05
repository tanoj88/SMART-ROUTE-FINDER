import React, { useState } from 'react';
import { X, Search, HelpCircle, CheckCircle2, BookOpen } from 'lucide-react';

interface VivaQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VivaQA {
  id: number;
  question: string;
  category: 'Algorithms' | 'Heuristics' | 'Data Structures' | 'Traffic & Domain';
  answer: string;
  keyTakeaway: string;
}

const VIVA_QUESTIONS: VivaQA[] = [
  {
    id: 1,
    question: "Why does Dijkstra's Algorithm fail when edges have negative weights?",
    category: 'Algorithms',
    answer: "Dijkstra is based on a greedy choice invariant: once a vertex u is extracted from the Priority Queue (marked as visited/settled), the algorithm assumes its distance dist[u] is permanently finalized and will never decrease. When negative edge weights exist, a later path could offer a lower cost to an already-settled vertex, violating the invariant. Bellman-Ford solves this by conducting V-1 full edge relaxation passes.",
    keyTakeaway: "Dijkstra's greedy finalized-distance assumption fails with negative weights; use Bellman-Ford instead.",
  },
  {
    id: 2,
    question: "What condition must a heuristic satisfy for A* search to guarantee an optimal path?",
    category: 'Heuristics',
    answer: "The heuristic h(n) must be admissible, which means it must never overestimate the actual remaining cost from node n to the goal: h(n) <= d*(n, goal). In our geospatial implementation, straight-line Great-Circle (Haversine) distance is used. Since the straight line is mathematically the shortest distance between two points on a spherical surface, real road distances can never be shorter than Haversine distance, guaranteeing admissibility.",
    keyTakeaway: "Admissibility requires h(n) <= d*(n, goal). Straight-line Euclidean/Haversine distance is always admissible.",
  },
  {
    id: 3,
    question: "Why does Breadth-First Search (BFS) fail to find the shortest route in road navigation?",
    category: 'Algorithms',
    answer: "BFS explores vertices level-by-level using an unweighted FIFO queue, finding the path with the fewest edge hops (intersections). However, road networks are weighted by distance, speed, and congestion. A 2-hop highway path of 60 km each (120 km total) will be chosen by BFS over a 3-hop arterial route of 10 km each (30 km total). Thus, BFS is non-optimal for weighted graphs.",
    keyTakeaway: "BFS minimizes hop count, not weighted sum of distances or times.",
  },
  {
    id: 4,
    question: "Compare the Space and Time Complexity of Adjacency Matrix vs. Adjacency List for road networks.",
    category: 'Data Structures',
    answer: "Road networks are sparse graphs where each intersection has an average degree around 3-4 (deg(u) << V). An Adjacency Matrix takes O(V^2) memory and O(V) to iterate neighbors, wasting over 95% space on 0s. An Adjacency List consumes only O(V + E) space and allows visiting incident neighbors in O(deg(u)) time, which is vastly superior for geospatial routing.",
    keyTakeaway: "Adjacency List requires O(V+E) space and O(deg(u)) neighbor iteration; Matrix wastes O(V^2) memory.",
  },
  {
    id: 5,
    question: "What is the time complexity of Dijkstra's Algorithm with a Binary Min-Heap?",
    category: 'Algorithms',
    answer: "O((V + E) log V). Every vertex is inserted into the Min-Heap once (O(V log V)), and for every relaxed incident edge, a decrease-key/heap insert takes O(log V) time across all E edges (O(E log V)). Summing them gives O((V + E) log V).",
    keyTakeaway: "Time complexity is O((V + E) log V) with a standard Binary Min-Heap.",
  },
  {
    id: 6,
    question: "How does the Bellman-Ford algorithm detect negative weight cycles?",
    category: 'Algorithms',
    answer: "In a graph without negative cycles, any shortest simple path contains at most V-1 edges. Bellman-Ford performs V-1 relaxation passes over all E edges. If performing a V-th relaxation pass still succeeds in reducing any distance (dist[u] + weight < dist[v]), it mathematically proves that an infinitely reducible negative cycle exists.",
    keyTakeaway: "If edge relaxation succeeds on the V-th iteration, a negative cycle is detected.",
  },
  {
    id: 7,
    question: "What is the key trade-off between Dijkstra and A* Search?",
    category: 'Algorithms',
    answer: "Dijkstra performs an undirected radial search outward in 360 degrees, visiting all nodes within a radius before advancing. A* adds the heuristic f(n) = g(n) + h(n), steering the priority queue expansion directly along the vector toward the destination coordinate, significantly reducing the number of nodes visited while preserving mathematical optimality.",
    keyTakeaway: "A* directs search toward the target, visiting significantly fewer vertices than Dijkstra's radial expansion.",
  },
  {
    id: 8,
    question: "How does vehicle type impact multi-criteria route optimization in your system?",
    category: 'Traffic & Domain',
    answer: "Each vehicle type has distinct speed multipliers, fuel efficiencies, and emission profiles. Two-wheelers navigate congestion with higher average speeds and high mileage (45 km/L), sedans face standard congestion delays and moderate mileage (15 km/L), while transit buses have lower cruising speeds but generate dramatically lower per-commuter CO2 emissions (28 g/km vs 130 g/km).",
    keyTakeaway: "Vehicle parameters dynamically transform edge weights based on fuel efficiency, CO2, and traffic maneuverability.",
  },
  {
    id: 9,
    question: "How does dynamic time-of-day traffic modeling alter the optimal route?",
    category: 'Traffic & Domain',
    answer: "During rush hour peaks (8-10 AM and 5-8 PM), arterial roads experience congestion multipliers up to 2.4x. When the 'Fastest' preference is selected, edge traversal times on high-capacity arterials spike, causing the algorithm to divert traffic onto ring roads, expressways, or bypass routes that have higher distance but much higher effective speeds.",
    keyTakeaway: "Rush-hour multipliers alter edge weights, prompting the algorithm to dynamically favor expressways over congested arterials.",
  },
  {
    id: 10,
    question: "What algorithm is used to compute alternative routes, and what is its concept?",
    category: 'Algorithms',
    answer: "We use a variation of Yen's K-Shortest Paths algorithm. After finding the primary shortest path, we penalize or temporarily remove edges on that path and re-execute Dijkstra's search. This discovers the next-best structurally distinct alternative route without creating minor redundant variations.",
    keyTakeaway: "Alternative paths are generated via edge penalization and re-running Dijkstra, discovering distinct secondary corridors.",
  },
];

export const VivaQuestionsModal: React.FC<VivaQuestionsModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const filtered = VIVA_QUESTIONS.filter((q) => {
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Project Viva Voce Questions & Model Answers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Essential B.Tech external examination preparation for Graph DSA and Route Optimization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search viva questions or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-1.5 text-xs">
            {['All', 'Algorithms', 'Heuristics', 'Data Structures', 'Traffic & Domain'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="p-5 overflow-y-auto space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 shrink-0">
                    Q{item.id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.question}
                  </h4>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {item.category}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-9">
                {item.answer}
              </p>

              <div className="ml-9 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>Key Examiner Answer:</strong> {item.keyTakeaway}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching viva questions found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>10 Curated Academic Viva Voce Questions with Key Answers</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
