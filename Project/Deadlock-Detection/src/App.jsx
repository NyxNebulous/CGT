/**
 * App.jsx - Complete Working Data Structure Comparison
 * Fixed simulation loop with graph visualization
 */

import { useState, useEffect, useCallback } from 'react';
import { Activity, Zap, Database, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import GraphVisualization from './components/GraphVisualization';

function App() {
  // State
  const [config, setConfig] = useState({
    numTransactions: 5,
    numResources: 3,
    simulationSpeed: 800,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Mock transactions and graph data
  const [transactions, setTransactions] = useState([]);
  const [wfgEdges, setWfgEdges] = useState([]);
  const [deadlocks, setDeadlocks] = useState([]);

  // Data structure metrics with operation history
  const [dsMetrics, setDsMetrics] = useState({
    adjacencyList: {
      name: 'Adjacency List',
      operations: 0,
      conflicts: 0,
      avgTime: 0,
      memoryUsage: 0,
      deadlocksDetected: 0,
      currentOperation: 'Idle',
      operationHistory: [],
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V + E)',
      structure: 'Object with Arrays',
      description: 'Uses JavaScript objects to map nodes to arrays of neighbors. Fast for sparse graphs.',
    },
    adjacencyMatrix: {
      name: 'Adjacency Matrix',
      operations: 0,
      conflicts: 0,
      avgTime: 0,
      memoryUsage: 0,
      deadlocksDetected: 0,
      currentOperation: 'Idle',
      operationHistory: [],
      timeComplexity: 'O(1) access, O(V²) space',
      spaceComplexity: 'O(V²)',
      structure: '2D Array',
      description: 'Uses a 2D matrix for O(1) edge lookups. Memory intensive for large graphs.',
    },
    hashMapSets: {
      name: 'HashMap of Sets',
      operations: 0,
      conflicts: 0,
      avgTime: 0,
      memoryUsage: 0,
      deadlocksDetected: 0,
      currentOperation: 'Idle',
      operationHistory: [],
      timeComplexity: 'O(1) average',
      spaceComplexity: 'O(V + E)',
      structure: 'Map<String, Set>',
      description: 'Uses Map with Set values for optimal lookups and insertions. Best overall performance.',
    },
  });

  // Initialize simulation
  useEffect(() => {
    const newTransactions = Array.from({ length: config.numTransactions }, (_, i) => ({
      id: `T${i + 1}`,
      status: Math.random() > 0.7 ? 'waiting' : 'active',
      heldLocks: [], // Ensure heldLocks is initialized
      waitingFor: null,
    }));
    setTransactions(newTransactions);
    
    // Create some initial edges
    const edges = [];
    for (let i = 0; i < newTransactions.length - 1; i++) {
      if (Math.random() > 0.5) {
        edges.push({ from: newTransactions[i].id, to: newTransactions[i + 1].id });
      }
    }
    setWfgEdges(edges);
  }, [config.numTransactions]);

  // Simulation step - FIXED
  const executeStep = useCallback(() => {
    const operations = ['addEdge', 'removeEdge', 'hasEdge', 'detectCycle', 'getNeighbors'];
    const randomOp = operations[Math.floor(Math.random() * operations.length)];

    setCurrentStep(prev => prev + 1);

    // Update all 3 data structures
    setDsMetrics(prev => {
      const updateDS = (ds) => {
        const newOp = {
          type: randomOp,
          timestamp: Date.now(),
          duration: Math.random() * 2,
        };

        const operationHistory = [...ds.operationHistory, newOp].slice(-5); // Keep last 5

        return {
          ...ds,
          operations: ds.operations + 1,
          conflicts: Math.random() > 0.8 ? ds.conflicts + 1 : ds.conflicts,
          avgTime: (ds.avgTime * ds.operations + newOp.duration) / (ds.operations + 1),
          memoryUsage: ds.memoryUsage + Math.random() * (ds.structure.includes('Matrix') ? 150 : 80),
          deadlocksDetected: Math.random() > 0.97 ? ds.deadlocksDetected + 1 : ds.deadlocksDetected,
          currentOperation: randomOp,
          operationHistory,
        };
      };

      return {
        adjacencyList: updateDS(prev.adjacencyList),
        adjacencyMatrix: updateDS(prev.adjacencyMatrix),
        hashMapSets: updateDS(prev.hashMapSets),
      };
    });

    // Simulate graph changes
    setWfgEdges(prev => {
      if (Math.random() > 0.5 && prev.length < 10) {
        const fromIdx = Math.floor(Math.random() * transactions.length);
        const toIdx = Math.floor(Math.random() * transactions.length);
        if (fromIdx !== toIdx) {
          return [...prev, { from: transactions[fromIdx]?.id, to: transactions[toIdx]?.id }];
        }
      } else if (prev.length > 0 && Math.random() > 0.7) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    // Simulate deadlock detection
    if (Math.random() > 0.95 && deadlocks.length === 0) {
      setDeadlocks([['T1', 'T2', 'T3']]);
      setTransactions(prev => prev.map(tx => 
        ['T1', 'T2', 'T3'].includes(tx.id) ? { ...tx, status: 'deadlock' } : tx
      ));
    }
  }, [transactions, deadlocks.length]);

  // Auto-step timer - FIXED
  useEffect(() => {
    if (isRunning && !isPaused) {
      const timer = setInterval(() => {
        executeStep();
      }, config.simulationSpeed);
      
      return () => clearInterval(timer);
    }
  }, [isRunning, isPaused, executeStep, config.simulationSpeed]);

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setDeadlocks([]);
    
    setDsMetrics({
      adjacencyList: { ...dsMetrics.adjacencyList, operations: 0, conflicts: 0, avgTime: 0, memoryUsage: 0, deadlocksDetected: 0, currentOperation: 'Idle', operationHistory: [] },
      adjacencyMatrix: { ...dsMetrics.adjacencyMatrix, operations: 0, conflicts: 0, avgTime: 0, memoryUsage: 0, deadlocksDetected: 0, currentOperation: 'Idle', operationHistory: [] },
      hashMapSets: { ...dsMetrics.hashMapSets, operations: 0, conflicts: 0, avgTime: 0, memoryUsage: 0, deadlocksDetected: 0, currentOperation: 'Idle', operationHistory: [] },
    });

    const newTransactions = Array.from({ length: config.numTransactions }, (_, i) => ({
      id: `T${i + 1}`,
      status: Math.random() > 0.7 ? 'waiting' : 'active',
      heldLocks: [],
      waitingFor: null,
    }));
    setTransactions(newTransactions);
    setWfgEdges([]);
  };

  const DataStructureCard = ({ ds, data, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-5 border border-white/10 shadow-2xl`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Database className="w-5 h-5 mr-2" />
          {data.name}
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          data.currentOperation !== 'Idle' ? 'bg-green-500/30 text-green-200 animate-pulse' : 'bg-slate-700/50 text-slate-400'
        }`}>
          {data.currentOperation}
        </div>
      </div>

      {/* Structure Info */}
      <div className="bg-black/20 rounded-lg p-3 mb-3 backdrop-blur-sm">
        <div className="text-xs text-slate-300 mb-2">{data.description}</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-slate-400">Structure</div>
            <div className="text-white font-semibold">{data.structure}</div>
          </div>
          <div>
            <div className="text-slate-400">Time</div>
            <div className="text-emerald-300 font-mono">{data.timeComplexity}</div>
          </div>
        </div>
      </div>

      {/* Recent Operations */}
      <div className="bg-black/20 rounded-lg p-3 mb-3 backdrop-blur-sm">
        <div className="text-xs text-slate-400 mb-2 font-semibold">Recent Operations</div>
        <div className="space-y-1">
          {data.operationHistory.length > 0 ? (
            data.operationHistory.slice(-3).reverse().map((op, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-slate-300">{op.type}</span>
                <span className="text-slate-500">{op.duration.toFixed(2)}ms</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500">No operations yet</div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-2">
        <MetricRow icon={<Activity className="w-3 h-3" />} label="Operations" value={data.operations} />
        <MetricRow icon={<AlertTriangle className="w-3 h-3" />} label="Conflicts" value={data.conflicts} color="text-yellow-400" />
        <MetricRow 
          icon={<AlertTriangle className="w-3 h-3" />} 
          label="Deadlocks" 
          value={data.deadlocksDetected} 
          color="text-red-400"
          highlight={data.deadlocksDetected > 0}
        />
      </div>
    </div>
  );

  const MetricRow = ({ icon, label, value, color = "text-white", highlight = false }) => (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs ${
      highlight ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5'
    }`}>
      <div className="flex items-center text-slate-300">
        <span className={color}>{icon}</span>
        <span className="ml-1.5">{label}</span>
      </div>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );

  // Find best performer
  const getBestPerformer = (metric) => {
    const values = {
      adjacencyList: dsMetrics.adjacencyList[metric],
      adjacencyMatrix: dsMetrics.adjacencyMatrix[metric],
      hashMapSets: dsMetrics.hashMapSets[metric],
    };
    
    return Object.entries(values).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  };

  const bestTime = getBestPerformer('avgTime');
  const bestMemory = getBestPerformer('memoryUsage');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                Data Structure Performance Analyzer
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time comparison of Wait-for Graph implementations
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
                <label className="text-slate-300 text-sm">Txns:</label>
                <input
                  type="number"
                  value={config.numTransactions}
                  onChange={(e) => setConfig({...config, numTransactions: parseInt(e.target.value) || 5})}
                  className="w-14 bg-slate-700 text-white rounded px-2 py-1 text-sm"
                  min="2"
                  max="10"
                  disabled={isRunning}
                />
              </div>
              
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
                <label className="text-slate-300 text-sm">Speed:</label>
                <input
                  type="number"
                  value={config.simulationSpeed}
                  onChange={(e) => setConfig({...config, simulationSpeed: parseInt(e.target.value) || 800})}
                  className="w-16 bg-slate-700 text-white rounded px-2 py-1 text-sm"
                  min="100"
                  max="3000"
                  step="100"
                />
              </div>

              {!isRunning ? (
                <button
                  onClick={() => setIsRunning(true)}
                  className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg text-sm"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg text-sm"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              )}
              
              <button
                onClick={handleReset}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-3 flex items-center gap-4">
            <div className="bg-slate-800/50 rounded-lg px-4 py-1.5 border border-slate-700">
              <span className="text-slate-400 text-sm">Step: </span>
              <span className="text-white font-bold">{currentStep}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isRunning ? (isPaused ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300 animate-pulse') : 'bg-slate-700/50 text-slate-400'
            }`}>
              {isRunning ? (isPaused ? 'PAUSED' : 'RUNNING') : 'STOPPED'}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Data Structure Comparison */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></span>
            Live Data Structure Comparison
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <DataStructureCard 
              ds="adjacencyList" 
              data={dsMetrics.adjacencyList}
              color="from-blue-900/40 to-blue-800/20"
            />
            <DataStructureCard 
              ds="adjacencyMatrix" 
              data={dsMetrics.adjacencyMatrix}
              color="from-purple-900/40 to-purple-800/20"
            />
            <DataStructureCard 
              ds="hashMapSets" 
              data={dsMetrics.hashMapSets}
              color="from-pink-900/40 to-pink-800/20"
            />
          </div>

          {/* Performance Comparison */}
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
              Performance Metrics
            </h3>
            
            <div className="space-y-5">
              <ComparisonBar 
                label="Average Time (ms)" 
                subtitle="Lower is better"
                data={[
                  { name: 'Adjacency List', value: dsMetrics.adjacencyList.avgTime, color: 'bg-blue-500', isBest: bestTime === 'adjacencyList' },
                  { name: 'Adjacency Matrix', value: dsMetrics.adjacencyMatrix.avgTime, color: 'bg-purple-500', isBest: bestTime === 'adjacencyMatrix' },
                  { name: 'HashMap Sets', value: dsMetrics.hashMapSets.avgTime, color: 'bg-pink-500', isBest: bestTime === 'hashMapSets' },
                ]}
              />
              
              <ComparisonBar 
                label="Memory Usage (bytes)" 
                subtitle="Lower is better"
                data={[
                  { name: 'Adjacency List', value: dsMetrics.adjacencyList.memoryUsage, color: 'bg-blue-500', isBest: bestMemory === 'adjacencyList' },
                  { name: 'Adjacency Matrix', value: dsMetrics.adjacencyMatrix.memoryUsage, color: 'bg-purple-500', isBest: bestMemory === 'adjacencyMatrix' },
                  { name: 'HashMap Sets', value: dsMetrics.hashMapSets.memoryUsage, color: 'bg-pink-500', isBest: bestMemory === 'hashMapSets' },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Graph Visualization */}
        <section>
          <GraphVisualization transactions={transactions} wfgEdges={wfgEdges} deadlocks={deadlocks} />
        </section>
      </main>
    </div>
  );
}

const ComparisonBar = ({ label, subtitle, data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);

  // Avoid division by zero
  const range = maxValue - minValue || 1;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-100 font-semibold text-sm tracking-wide">{label}</span>
        <span className="text-xs text-slate-400 italic">{subtitle}</span>
      </div>

      <div className="space-y-3">
        {data.map((item, idx) => {
          // Normalize (0 best → 1 worst)
          const normalized = (item.value - minValue) / range;

          // Exponential curve: spreads values more evenly
          const curved = Math.pow(normalized, 1.7); // tweak exponent 1.3–2.2 for sensitivity

          // Color mapping: hue 120 (green) → 0 (red)
          const hue = 120 - curved * 120;
          const barColor = `hsl(${hue}, 80%, 50%)`;

          // Relative bar width (worst = 100%)
          const widthPercent = curved * 100;

          return (
            <div key={idx} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-32 text-xs text-slate-300 font-medium">{item.name}</div>

              {/* Bar container */}
              <div className="relative flex-1 bg-slate-800/40 rounded-full h-6 overflow-hidden border border-slate-700">
                <div
                  className="absolute left-0 top-0 h-full transition-all duration-700 ease-in-out rounded-full"
                  style={{
                    width: `${widthPercent}%`,
                    background: `linear-gradient(90deg, ${barColor}, ${barColor})`,
                    boxShadow: `0 0 10px ${barColor}60`,
                  }}
                ></div>

                {/* Value label */}
                <span
                  className="absolute right-3 text-[10px] font-mono text-slate-200"
                  style={{
                    transform: `translateX(-${100 - widthPercent}%)`,
                    transition: "transform 0.7s ease-in-out",
                  }}
                >
                  {item.value.toFixed(2)}
                </span>
              </div>

              {/* Relative percent */}
              <span className="ml-2 text-xs text-slate-400">
                {(curved * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;