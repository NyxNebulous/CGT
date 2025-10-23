import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, GitBranch, Palette, Target, TrendingUp, Database, Clock, Zap } from 'lucide-react';

// ==================== DATA STRUCTURES ====================
class AdjacencyListWFG {
  constructor() {
    this.graph = {};
    this.nodes = new Set();
    this.operationCount = 0;
  }

  addNode(node) {
    this.operationCount++;
    if (!this.graph[node]) {
      this.graph[node] = [];
      this.nodes.add(node);
    }
  }

  addEdge(from, to) {
    this.operationCount++;
    this.addNode(from);
    this.addNode(to);
    if (!this.graph[from].includes(to)) {
      this.graph[from].push(to);
    }
  }

  getNeighbors(node) {
    this.operationCount++;
    return this.graph[node] || [];
  }

  getNodes() {
    return Array.from(this.nodes);
  }

  clear() {
    this.graph = {};
    this.nodes.clear();
    this.operationCount = 0;
  }

  // ...added: remove a node and all incident edges...
  removeNode(node) {
    this.operationCount++;
    if (!this.nodes.has(node)) return false;
    // remove outgoing edges
    delete this.graph[node];
    // remove incoming edges
    for (const n of Object.keys(this.graph)) {
      const arr = this.graph[n];
      const idx = arr.indexOf(node);
      if (idx !== -1) arr.splice(idx, 1);
    }
    this.nodes.delete(node);
    return true;
  }
}

class AdjacencyMatrixWFG {
  constructor(maxNodes = 20) {
    this.maxNodes = maxNodes;
    this.matrix = Array(maxNodes).fill(null).map(() => Array(maxNodes).fill(0));
    this.nodeMap = {};
    this.reverseMap = {};
    this.nodeCount = 0;
    this.operationCount = 0;
  }

  addNode(node) {
    this.operationCount++;
    if (!(node in this.nodeMap)) {
      this.nodeMap[node] = this.nodeCount;
      this.reverseMap[this.nodeCount] = node;
      this.nodeCount++;
    }
  }

  addEdge(from, to) {
    this.operationCount++;
    this.addNode(from);
    this.addNode(to);
    this.matrix[this.nodeMap[from]][this.nodeMap[to]] = 1;
  }

  getNeighbors(node) {
    this.operationCount++;
    if (!(node in this.nodeMap)) return [];
    const idx = this.nodeMap[node];
    const neighbors = [];
    for (let i = 0; i < this.nodeCount; i++) {
      if (this.matrix[idx][i] === 1) {
        neighbors.push(this.reverseMap[i]);
      }
    }
    return neighbors;
  }

  getNodes() {
    return Object.keys(this.nodeMap);
  }

  clear() {
    this.matrix = Array(this.maxNodes).fill(null).map(() => Array(this.maxNodes).fill(0));
    this.nodeMap = {};
    this.reverseMap = {};
    this.nodeCount = 0;
    this.operationCount = 0;
  }
}

class HashMapSetsWFG {
  constructor() {
    this.graph = new Map();
    this.operationCount = 0;
  }

  addNode(node) {
    this.operationCount++;
    if (!this.graph.has(node)) {
      this.graph.set(node, new Set());
    }
  }

  addEdge(from, to) {
    this.operationCount++;
    this.addNode(from);
    this.addNode(to);
    this.graph.get(from).add(to);
  }

  getNeighbors(node) {
    this.operationCount++;
    return this.graph.has(node) ? Array.from(this.graph.get(node)) : [];
  }

  getNodes() {
    return Array.from(this.graph.keys());
  }

  clear() {
    this.graph.clear();
    this.operationCount = 0;
  }
}

// ==================== ALGORITHMS ====================

// DFS-based Cycle Detection
function dfsDetectCycle(wfg) {
  const nodes = wfg.getNodes();
  const visited = new Set();
  const recStack = new Set();
  const trace = [];
  let cycleFound = null;

  function dfsVisit(node, path = []) {
    visited.add(node);
    recStack.add(node);
    trace.push({ type: 'visit', node, status: 'gray', path: [...path, node] });

    const neighbors = wfg.getNeighbors(node);
    for (const neighbor of neighbors) {
      trace.push({ type: 'edge', from: node, to: neighbor });

      if (!visited.has(neighbor)) {
        const result = dfsVisit(neighbor, [...path, node]);
        if (result) return result;
      } else if (recStack.has(neighbor)) {
        // reconstruct cycle starting at neighbor
        const cycle = [];
        // path currently is [...ancestors], node is current, neighbor is back edge target
        // Build from neighbor -> ... -> neighbor
        let cur = node;
        cycle.push(neighbor);
        while (cur !== neighbor && cur != null) {
          cycle.push(cur);
          cur = (trace.find(t => t.type === 'visit' && t.node === cur)?.path || []).slice(-2, -1)[0] || null;
          // fallback: use simple path array
        }
        // if reconstruction failed, fallback to simpler cycle from path + neighbor
        if (cycle.length < 2) {
          const fallback = [...path, node, neighbor];
          cycleFound = fallback;
          trace.push({ type: 'cycle', cycle: fallback });
          return fallback;
        }
        cycle.push(neighbor);
        cycle.reverse();
        trace.push({ type: 'cycle', cycle });
        cycleFound = cycle;
        return cycle;
      }
    }

    recStack.delete(node);
    trace.push({ type: 'backtrack', node, status: 'black' });
    return null;
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      const result = dfsVisit(node);
      if (result) break;
    }
  }

  return { cycle: cycleFound, trace, visited: visited.size };
}

// Select victim from detected cycle using heuristic: max out-degree (breaks most waits)
// If tie, choose node with largest sum of incoming+outgoing (degree)
function selectVictimFromCycle(wfg, cycle = []) {
  if (!cycle || cycle.length === 0) return null;
  let victim = cycle[0];
  let bestScore = -1;
  for (const node of cycle) {
    const outDeg = wfg.getNeighbors(node).length;
    // compute incoming degree
    let inDeg = 0;
    for (const n of wfg.getNodes()) {
      if (wfg.getNeighbors(n).includes(node)) inDeg++;
    }
    const score = outDeg + inDeg * 0.5; // prefer high outgoing
    if (score > bestScore) {
      bestScore = score;
      victim = node;
    }
  }
  return victim;
}

// Build conflict graph that respects indirect dependencies:
// conflict(u,v) if u reaches v OR v reaches u (directed reachability)
function computeConflictColorsByReachability(wfg) {
  const nodes = wfg.getNodes();
  // compute reachability via BFS from each node
  const reach = {};
  for (const n of nodes) {
    reach[n] = new Set();
    const q = [n];
    const seen = new Set([n]);
    while (q.length) {
      const cur = q.shift();
      for (const nb of wfg.getNeighbors(cur)) {
        if (!seen.has(nb)) {
          seen.add(nb);
          reach[n].add(nb);
          q.push(nb);
        }
      }
    }
  }

  // conflict adjacency: undirected edges between any pair with reachability one way or the other
  const conflictAdj = {};
  for (const a of nodes) {
    conflictAdj[a] = new Set();
  }
  for (const a of nodes) {
    for (const b of nodes) {
      if (a === b) continue;
      if (reach[a].has(b) || reach[b].has(a)) {
        conflictAdj[a].add(b);
        conflictAdj[b].add(a);
      }
    }
  }

  // greedy coloring on conflictAdj
  const colors = {};
  for (const node of nodes) {
    const used = new Set();
    for (const nb of conflictAdj[node]) {
      if (colors[nb] !== undefined) used.add(colors[nb]);
    }
    let c = 0;
    while (used.has(c)) c++;
    colors[node] = c;
  }

  const groups = {};
  for (const [node, c] of Object.entries(colors)) {
    if (!groups[c]) groups[c] = [];
    groups[c].push(node);
  }

  return { colors, groups, conflictAdj };
}

// ==================== MAIN COMPONENT ====================

function App() {
  // Configuration
  const [numTransactions, setNumTransactions] = useState(6);
  const [currentDS, setCurrentDS] = useState('adjacencyList');

  // Data structures
  const [dataStructures] = useState({
    adjacencyList: new AdjacencyListWFG(),
    adjacencyMatrix: new AdjacencyMatrixWFG(),
    hashMapSets: new HashMapSetsWFG()
  });

  // new: snapshots and messages for before/after resolution
  const [preResolutionSnapshot, setPreResolutionSnapshot] = useState(null);
  const [resolutionMessage, setResolutionMessage] = useState('');

  // Algorithm state
  const [algorithmState, setAlgorithmState] = useState({
    dfs: { running: false, result: null, traceIndex: 0 },
    coloring: { running: false, result: null, traceIndex: 0 },
    bfs: { running: false, result: null, traceIndex: 0 }
  });

  // Visualization state
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [visualState, setVisualState] = useState({
    nodeColors: {},
    nodeStatus: {},
    highlightedEdges: [],
    victim: null
  });

  // Performance metrics
  const [metrics, setMetrics] = useState({
    adjacencyList: { time: 0, operations: 0, memory: 0 },
    adjacencyMatrix: { time: 0, operations: 0, memory: 0 },
    hashMapSets: { time: 0, operations: 0, memory: 0 }
  });

  // Initialize graph
  const initializeGraph = useCallback(() => {
    Object.values(dataStructures).forEach(ds => ds.clear());

    const nodes = Array.from({ length: numTransactions }, (_, i) => `T${i + 1}`);
    const edges = [];

    // Create realistic wait-for relationships
    for (let i = 0; i < nodes.length; i++) {
      Object.values(dataStructures).forEach(ds => ds.addNode(nodes[i]));
    }

    // Add edges (30-50% density with potential cycles)
    for (let i = 0; i < nodes.length; i++) {
      const numEdges = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numEdges; j++) {
        const target = Math.floor(Math.random() * nodes.length);
        if (target !== i) {
          Object.values(dataStructures).forEach(ds => {
            ds.addEdge(nodes[i], nodes[target]);
          });
          edges.push({ from: nodes[i], to: nodes[target] });
        }
      }
    }

    // Occasionally create explicit cycle for demonstration
    if (Math.random() > 0.5 && nodes.length >= 3) {
      const cycleSize = Math.min(3, nodes.length);
      for (let i = 0; i < cycleSize; i++) {
        const from = nodes[i];
        const to = nodes[(i + 1) % cycleSize];
        Object.values(dataStructures).forEach(ds => ds.addEdge(from, to));
        if (!edges.find(e => e.from === from && e.to === to)) {
          edges.push({ from, to });
        }
      }
    }

    setGraphData({ nodes, edges });
    setVisualState({ nodeColors: {}, nodeStatus: {}, highlightedEdges: [], victim: null });
    setAlgorithmState({
      dfs: { running: false, result: null, traceIndex: 0 },
      coloring: { running: false, result: null, traceIndex: 0 },
      bfs: { running: false, result: null, traceIndex: 0 }
    });
  }, [numTransactions, dataStructures]);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  // Run DFS Detection
  const runDFS = useCallback(() => {
    const wfg = dataStructures[currentDS];
    const startTime = performance.now();
    const result = dfsDetectCycle(wfg);
    const endTime = performance.now();

    setMetrics(prev => ({
      ...prev,
      [currentDS]: {
        ...prev[currentDS],
        time: endTime - startTime,
        operations: wfg.operationCount
      }
    }));

    setAlgorithmState(prev => ({
      ...prev,
      dfs: { running: false, result, traceIndex: 0 }
    }));

    // Update visualization
    const newStatus = {};
    result.trace.forEach(step => {
      if (step.type === 'visit' || step.type === 'backtrack') {
        newStatus[step.node] = step.status;
      }
    });
    setVisualState(prev => ({ ...prev, nodeStatus: newStatus }));
  }, [dataStructures, currentDS]);

  // Run Vertex Coloring
  const runColoring = useCallback(() => {
    const wfg = dataStructures[currentDS];
    const startTime = performance.now();
    const result = greedyVertexColoring(wfg);
    const endTime = performance.now();

    setMetrics(prev => ({
      ...prev,
      [currentDS]: {
        ...prev[currentDS],
        time: endTime - startTime,
        operations: wfg.operationCount
      }
    }));

    setAlgorithmState(prev => ({
      ...prev,
      coloring: { running: false, result, traceIndex: 0 }
    }));

    setVisualState(prev => ({ ...prev, nodeColors: result.colors }));
  }, [dataStructures, currentDS]);
// ...existing code...

  // Run BFS Victim Selection
  const runBFS = useCallback(() => {
    const wfg = dataStructures[currentDS];
    const startTime = performance.now();
    const result = bfsVictimSelection(wfg);
    const endTime = performance.now();

    setMetrics(prev => ({
      ...prev,
      [currentDS]: {
        ...prev[currentDS],
        time: endTime - startTime,
        operations: wfg.operationCount
      }
    }));

    setAlgorithmState(prev => ({
      ...prev,
      bfs: { running: false, result, traceIndex: 0 }
    }));

    setVisualState(prev => ({ ...prev, victim: result.victim }));
  }, [dataStructures, currentDS]);

  // --- ADDED HELPERS & MISSING HANDLERS ---
  // snapshot current graphData
  const snapshotGraph = useCallback(() => {
    return { nodes: [...graphData.nodes], edges: graphData.edges.map(e => ({ ...e })) };
  }, [graphData]);

  // update graphData from the active data structure (reads neighbors)
  const updateGraphFromActiveDS = useCallback(() => {
    const wfg = dataStructures[currentDS];
    const nodes = wfg.getNodes();
    const edges = [];
    for (const from of nodes) {
      for (const to of wfg.getNeighbors(from)) {
        edges.push({ from, to });
      }
    }
    setGraphData({ nodes, edges });
  }, [dataStructures, currentDS]);

  // wrapper: use reachability coloring as greedyVertexColoring result
  function greedyVertexColoring(wfg) {
    const res = computeConflictColorsByReachability(wfg);
    return {
      colors: res.colors,
      groups: res.groups,
      chromaticNumber: Object.keys(res.groups).length
    };
  }

  // BFS-based victim selection: prefer node in cycle with largest sum of distances (breaks more dependencies)
  function bfsVictimSelection(wfg) {
    const cycleResult = dfsDetectCycle(wfg);
    const cycle = cycleResult.cycle;
    if (!cycle || cycle.length === 0) {
      return { victim: null, cycle: null };
    }

    // compute BFS distances sum for each cycle node
    function bfsSum(start) {
      const q = [start];
      const seen = new Set([start]);
      let dist = { [start]: 0 };
      let idx = 0;
      while (idx < q.length) {
        const cur = q[idx++];
        for (const nb of wfg.getNeighbors(cur)) {
          if (!seen.has(nb)) {
            seen.add(nb);
            dist[nb] = dist[cur] + 1;
            q.push(nb);
          }
        }
      }
      // sum distances to all reachable nodes
      return Object.values(dist).reduce((a, b) => a + b, 0);
    }

    let best = null;
    let bestScore = -Infinity;
    for (const node of cycle) {
      const score = bfsSum(node);
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    }

    // fallback to degree heuristic if tie / null
    if (!best) best = selectVictimFromCycle(wfg, cycle);

    return { victim: best, cycle };
  }

  // Resolve deadlock: choose victim, remove it from active DS, update graph and re-run analyses
  const resolveDeadlock = useCallback(() => {
    const wfg = dataStructures[currentDS];
    const detect = dfsDetectCycle(wfg);
    if (!detect.cycle || detect.cycle.length === 0) {
      setResolutionMessage('No cycle detected — nothing to resolve.');
      return;
    }

    // save snapshot
    setPreResolutionSnapshot(snapshotGraph());

    const { victim } = bfsVictimSelection(wfg);
    if (!victim) {
      setResolutionMessage('Could not select a victim.');
      return;
    }

    // remove victim node from the authoritative adjacency list (works for all DS with removeNode)
    if (typeof wfg.removeNode === 'function') {
      wfg.removeNode(victim);
    } else {
      // fallback: remove outgoing edges and ensure node no longer appears
      // for DS without removeNode, remove all incoming edges and skip node in getNodes usage
      for (const n of wfg.getNodes()) {
        const neighs = wfg.getNeighbors(n);
        if (neighs.includes(victim) && typeof wfg.removeEdge === 'function') {
          wfg.removeEdge(n, victim);
        }
      }
    }

    // update UI graph
    updateGraphFromActiveDS();

    // re-run DFS and coloring
    const postDFS = dfsDetectCycle(wfg);
    const coloring = computeConflictColorsByReachability(wfg);

    setAlgorithmState(prev => ({
      ...prev,
      dfs: { running: false, result: postDFS, traceIndex: 0 },
      coloring: { running: false, result: { chromaticNumber: Object.keys(coloring.groups).length, groups: coloring.groups }, traceIndex: 0 }
    }));

    setVisualState(prev => ({ ...prev, nodeColors: coloring.colors, victim }));
    setResolutionMessage(`Victim ${victim} aborted and removed. Re-ran DFS and recomputed coloring.`);

    // update metrics
    setMetrics(prev => ({
      ...prev,
      [currentDS]: {
        ...prev[currentDS],
        operations: wfg.operationCount
      }
    }));
  }, [dataStructures, currentDS, snapshotGraph, updateGraphFromActiveDS]);

  // Reachability coloring runner (button referenced runReachabilityColoring)
  const runReachabilityColoring = useCallback(() => {
    const wfg = dataStructures[currentDS];
    const startTime = performance.now();
    const res = computeConflictColorsByReachability(wfg);
    const endTime = performance.now();

    setMetrics(prev => ({
      ...prev,
      [currentDS]: {
        ...prev[currentDS],
        time: endTime - startTime,
        operations: wfg.operationCount
      }
    }));

    setAlgorithmState(prev => ({
      ...prev,
      coloring: { running: false, result: { chromaticNumber: Object.keys(res.groups).length, groups: res.groups }, traceIndex: 0 }
    }));

    setVisualState(prev => ({ ...prev, nodeColors: res.colors }));
  }, [dataStructures, currentDS]);

  const colorPalette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Graph Theory Deadlock Analyzer
          </h1>
          <p className="text-slate-400 text-sm mt-1">DFS Detection • Deadlock Resolution • Reachability Coloring</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Control Panel */}
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-slate-300 text-sm">Transactions:</label>
              <input
                type="number"
                value={numTransactions}
                onChange={(e) => setNumTransactions(Math.max(2, Math.min(10, parseInt(e.target.value) || 6)))}
                className="w-16 bg-slate-800 rounded px-2 py-1 text-sm border border-slate-600"
                min="2"
                max="10"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-300 text-sm">Data Structure:</label>
              <select
                value={currentDS}
                onChange={(e) => setCurrentDS(e.target.value)}
                className="bg-slate-800 rounded px-3 py-1 text-sm border border-slate-600"
              >
                <option value="adjacencyList">Adjacency List (authoritative)</option>
                <option value="adjacencyMatrix">Adjacency Matrix</option>
                <option value="hashMapSets">HashMap Sets</option>
              </select>
            </div>

            <button
              onClick={initializeGraph}
              className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg text-sm font-semibold hover:from-slate-500 hover:to-slate-600 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Graph
            </button>
          </div>

          {/* Algorithm Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runDFS}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-semibold hover:from-blue-500 hover:to-blue-600 transition-all flex items-center gap-2"
            >
              <GitBranch className="w-4 h-4" />
              Detect Deadlock (DFS)
            </button>

            <button
              onClick={resolveDeadlock}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 rounded-lg font-semibold hover:from-red-500 hover:to-red-600 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Resolve Deadlock (Abort Victim)
            </button>

            <button
              onClick={runReachabilityColoring}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg font-semibold hover:from-purple-500 hover:to-purple-600 transition-all flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              Compute Safe Batches (Coloring)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* DFS Results */}
          <div className="bg-slate-900/50 rounded-xl p-5 border border-blue-500/30">
            <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              DFS Detection
            </h3>
            {algorithmState.dfs.result ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cycle Found:</span>
                  <span className={algorithmState.dfs.result.cycle ? 'text-red-400 font-bold' : 'text-green-400'}>
                    {algorithmState.dfs.result.cycle ? 'YES' : 'NO'}
                  </span>
                </div>
                {algorithmState.dfs.result.cycle && (
                  <div className="bg-red-500/10 rounded p-2 border border-red-500/30">
                    <div className="text-xs text-slate-400 mb-1">Deadlock Cycle:</div>
                    <div className="text-red-300 font-mono text-xs">
                      {algorithmState.dfs.result.cycle.join(' → ')}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Nodes Visited:</span>
                  <span className="text-white font-semibold">{algorithmState.dfs.result.visited}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span className="text-cyan-400 font-mono text-xs">{metrics.adjacencyList.time.toFixed(2)}ms</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Run DFS to detect cycles</div>
            )}
          </div>

          {/* Coloring Results */}
          <div className="bg-slate-900/50 rounded-xl p-5 border border-purple-500/30">
            <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Safe Execution (Reachability Coloring)
            </h3>
            {algorithmState.coloring.result ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Batches (colors):</span>
                  <span className="text-purple-300 font-bold">{algorithmState.coloring.result.chromaticNumber}</span>
                </div>
                <div className="bg-purple-500/10 rounded p-2 border border-purple-500/30">
                  <div className="text-xs text-slate-400 mb-2">Concurrent Groups (no indirect conflicts)</div>
                  <div className="space-y-1">
                    {Object.entries(algorithmState.coloring.result.groups).map(([color, nodes]) => (
                      <div key={color} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-white/30"
                          style={{ backgroundColor: colorPalette[parseInt(color) % colorPalette.length] }}
                        />
                        <span className="text-slate-300 text-xs">{nodes.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span className="text-cyan-400 font-mono text-xs">{metrics.adjacencyList.time.toFixed(2)}ms</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Compute coloring to get safe execution batches</div>
            )}
          </div>

          {/* BFS / Resolution Results */}
          <div className="bg-slate-900/50 rounded-xl p-5 border border-pink-500/30">
            <h3 className="text-lg font-bold text-pink-400 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Resolution
            </h3>
            <div className="space-y-2 text-sm">
              <div className="text-slate-400">Last action:</div>
              <div className="text-white text-sm">{resolutionMessage || 'No resolution performed yet.'}</div>

              {preResolutionSnapshot && (
                <div className="bg-pink-500/5 p-2 rounded border border-pink-500/20 text-xs text-slate-300">
                  Pre-resolution snapshot saved.
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-400">Last Victim:</span>
                <span className="text-pink-300 font-bold">{visualState.victim || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Operations (adj list):</span>
                <span className="text-white font-semibold">{metrics.adjacencyList.operations}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Visualization (current) */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">Wait-For Graph (current)</h3>
          <svg viewBox="0 0 800 500" className="w-full h-[500px] bg-slate-950/50 rounded-lg">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
              </marker>
            </defs>

            {/* Edges */}
            {graphData.edges.map((edge, idx) => {
              const fromIdx = graphData.nodes.indexOf(edge.from);
              const toIdx = graphData.nodes.indexOf(edge.to);
              const fromAngle = (fromIdx / graphData.nodes.length) * 2 * Math.PI;
              const toAngle = (toIdx / graphData.nodes.length) * 2 * Math.PI;
              const radius = 180;
              const cx = 400, cy = 250;

              const x1 = cx + radius * Math.cos(fromAngle);
              const y1 = cy + radius * Math.sin(fromAngle);
              const x2 = cx + radius * Math.cos(toAngle);
              const y2 = cy + radius * Math.sin(toAngle);

              const isCycleEdge = algorithmState.dfs.result?.cycle &&
                algorithmState.dfs.result.cycle.some((node, i) =>
                  i < algorithmState.dfs.result.cycle.length - 1 &&
                  algorithmState.dfs.result.cycle[i] === edge.from &&
                  algorithmState.dfs.result.cycle[i + 1] === edge.to
                );

              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isCycleEdge ? '#ef4444' : '#64748b'}
                  strokeWidth={isCycleEdge ? 3 : 2}
                  markerEnd={isCycleEdge ? 'url(#arrowhead-red)' : 'url(#arrowhead)'}
                  opacity={isCycleEdge ? 1 : 0.6}
                />
              );
            })}

            {/* Nodes */}
            {graphData.nodes.map((node, idx) => {
              const angle = (idx / graphData.nodes.length) * 2 * Math.PI;
              const radius = 180;
              const x = 400 + radius * Math.cos(angle);
              const y = 250 + radius * Math.sin(angle);

              let fillColor = '#475569';
              if (visualState.victim === node) {
                fillColor = '#ec4899';
              } else if (visualState.nodeColors[node] !== undefined) {
                fillColor = colorPalette[visualState.nodeColors[node] % colorPalette.length];
              } else if (visualState.nodeStatus[node] === 'gray') {
                fillColor = '#fbbf24';
              } else if (visualState.nodeStatus[node] === 'black') {
                fillColor = '#22c55e';
              }

              const isInCycle = algorithmState.dfs.result?.cycle?.includes(node);

              return (
                <g key={node}>
                  <circle
                    cx={x}
                    cy={y}
                    r={25}
                    fill={fillColor}
                    stroke={isInCycle ? '#ef4444' : '#94a3b8'}
                    strokeWidth={isInCycle ? 3 : 2}
                    className={visualState.victim === node ? 'animate-pulse' : ''}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-sm font-bold fill-white"
                  >
                    {node}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-600"></div>
              <span className="text-slate-400">Unvisited Node</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-slate-400">Visiting (DFS)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-slate-400">Visited (DFS)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
              <span className="text-slate-400">Victim (Resolved)</span>
            </div>
            {colorPalette.map((color, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-slate-400">Color Group {idx}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-gray-500"></div>
              <span className="text-slate-400">Normal Edge</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500"></div>
              <span className="text-slate-400">Cycle Edge</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;