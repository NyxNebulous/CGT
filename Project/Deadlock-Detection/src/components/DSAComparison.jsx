/**
 * DSAComparison.jsx
 * 
 * Component for comparing performance metrics across three Wait-for Graph (WFG) data structures:
 * - Adjacency List
 * - Adjacency Matrix
 * - HashMap of Sets
 * 
 * Displays a detailed table with metrics: Operations, Conflicts, Avg Time (ms), Memory Usage (bytes)
 * Enhancements:
 * - Conditional coloring for metrics (e.g., green for low values, red for high)
 * - Tooltips for metric explanations
 * - Bar visualizations within table cells for quick comparison
 * - Summary row with averages or totals where applicable
 * - Responsive design with Tailwind CSS
 * 
 * Receives metrics from App.jsx and renders dynamically
 * Assumes metrics are updated in parallel for all DS (TODO: implement parallel updates in App.jsx)
 */

import PropTypes from 'prop-types';

const DSAComparison = ({ metrics }) => {
  // Helper function to get color based on value relative to max
  const getColor = (value, max, isGoodLow = true) => {
    const ratio = value / max;
    if (isGoodLow) {
      // Lower is better (e.g., time, memory): green low, red high
      if (ratio < 0.33) return 'bg-green-600';
      if (ratio < 0.66) return 'bg-yellow-600';
      return 'bg-red-600';
    } else {
      // Higher is better or neutral (e.g., operations): blue scale
      if (ratio < 0.33) return 'bg-blue-300';
      if (ratio < 0.66) return 'bg-blue-500';
      return 'bg-blue-700';
    }
  };

  // Helper to format numbers
  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num % 1 === 0 ? num : num.toFixed(2);
    }
    return num;
  };

  // Calculate max values for scaling bars
  const maxOperations = Math.max(
    metrics.adjacencyList.operations,
    metrics.adjacencyMatrix.operations,
    metrics.hashMapSets.operations,
    1 // Avoid division by zero
  );
  const maxConflicts = Math.max(
    metrics.adjacencyList.conflicts,
    metrics.adjacencyMatrix.conflicts,
    metrics.hashMapSets.conflicts,
    1
  );
  const maxAvgTime = Math.max(
    metrics.adjacencyList.avgTime,
    metrics.adjacencyMatrix.avgTime,
    metrics.hashMapSets.avgTime,
    1
  );
  const maxMemory = Math.max(
    metrics.adjacencyList.memoryUsage,
    metrics.adjacencyMatrix.memoryUsage,
    metrics.hashMapSets.memoryUsage,
    1
  );

  // Calculate summary (averages)
  const avgOperations = (metrics.adjacencyList.operations + metrics.adjacencyMatrix.operations + metrics.hashMapSets.operations) / 3;
  const avgConflicts = (metrics.adjacencyList.conflicts + metrics.adjacencyMatrix.conflicts + metrics.hashMapSets.conflicts) / 3;
  const avgAvgTime = (metrics.adjacencyList.avgTime + metrics.adjacencyMatrix.avgTime + metrics.hashMapSets.avgTime) / 3;
  const avgMemory = (metrics.adjacencyList.memoryUsage + metrics.adjacencyMatrix.memoryUsage + metrics.hashMapSets.memoryUsage) / 3;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 shadow-xl">
      <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
        Data Structure Comparison
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        Performance metrics across WFG implementations. Bars represent relative values.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Data Structure</th>
              <th className="text-center py-3 px-4 text-slate-300 font-semibold" title="Total graph operations (add/remove/has edge)">
                Operations
              </th>
              <th className="text-center py-3 px-4 text-slate-300 font-semibold" title="Number of lock conflicts encountered">
                Conflicts
              </th>
              <th className="text-center py-3 px-4 text-slate-300 font-semibold" title="Average time per operation (ms)">
                Avg Time (ms)
              </th>
              <th className="text-center py-3 px-4 text-slate-300 font-semibold" title="Estimated memory usage (bytes)">
                Memory (bytes)
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Adjacency List Row */}
            <tr className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
              <td className="py-3 px-4 text-slate-300 font-medium">Adjacency List</td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyList.operations, maxOperations, false)}`}
                    style={{ width: `${(metrics.adjacencyList.operations / maxOperations) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyList.operations)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyList.conflicts, maxConflicts)}`}
                    style={{ width: `${(metrics.adjacencyList.conflicts / maxConflicts) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyList.conflicts)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyList.avgTime, maxAvgTime)}`}
                    style={{ width: `${(metrics.adjacencyList.avgTime / maxAvgTime) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyList.avgTime)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyList.memoryUsage, maxMemory)}`}
                    style={{ width: `${(metrics.adjacencyList.memoryUsage / maxMemory) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyList.memoryUsage)}
                </span>
              </td>
            </tr>

            {/* Adjacency Matrix Row */}
            <tr className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
              <td className="py-3 px-4 text-slate-300 font-medium">Adjacency Matrix</td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyMatrix.operations, maxOperations, false)}`}
                    style={{ width: `${(metrics.adjacencyMatrix.operations / maxOperations) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyMatrix.operations)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyMatrix.conflicts, maxConflicts)}`}
                    style={{ width: `${(metrics.adjacencyMatrix.conflicts / maxConflicts) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyMatrix.conflicts)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyMatrix.avgTime, maxAvgTime)}`}
                    style={{ width: `${(metrics.adjacencyMatrix.avgTime / maxAvgTime) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyMatrix.avgTime)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.adjacencyMatrix.memoryUsage, maxMemory)}`}
                    style={{ width: `${(metrics.adjacencyMatrix.memoryUsage / maxMemory) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.adjacencyMatrix.memoryUsage)}
                </span>
              </td>
            </tr>

            {/* HashMap of Sets Row */}
            <tr className="hover:bg-slate-700/50 transition-colors">
              <td className="py-3 px-4 text-slate-300 font-medium">HashMap of Sets</td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.hashMapSets.operations, maxOperations, false)}`}
                    style={{ width: `${(metrics.hashMapSets.operations / maxOperations) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.hashMapSets.operations)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.hashMapSets.conflicts, maxConflicts)}`}
                    style={{ width: `${(metrics.hashMapSets.conflicts / maxConflicts) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.hashMapSets.conflicts)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.hashMapSets.avgTime, maxAvgTime)}`}
                    style={{ width: `${(metrics.hashMapSets.avgTime / maxAvgTime) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.hashMapSets.avgTime)}
                </span>
              </td>
              <td className="text-center text-slate-200 relative">
                <div className="relative h-4 bg-slate-600 rounded mx-2">
                  <div
                    className={`absolute top-0 left-0 h-full rounded ${getColor(metrics.hashMapSets.memoryUsage, maxMemory)}`}
                    style={{ width: `${(metrics.hashMapSets.memoryUsage / maxMemory) * 100}%` }}
                  ></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  {formatNumber(metrics.hashMapSets.memoryUsage)}
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600 font-semibold">
              <td className="py-3 px-4 text-slate-200">Average</td>
              <td className="text-center text-slate-200">{formatNumber(avgOperations)}</td>
              <td className="text-center text-slate-200">{formatNumber(avgConflicts)}</td>
              <td className="text-center text-slate-200">{formatNumber(avgAvgTime)}</td>
              <td className="text-center text-slate-200">{formatNumber(avgMemory)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-4">
        * Metrics are estimates. Operations and conflicts are cumulative. Lower avg time and memory is better (green = good, red = poor).
      </p>
    </div>
  );
};

// PropTypes for type checking
DSAComparison.propTypes = {
  metrics: PropTypes.shape({
    adjacencyList: PropTypes.shape({
      operations: PropTypes.number.isRequired,
      conflicts: PropTypes.number.isRequired,
      avgTime: PropTypes.number.isRequired,
      memoryUsage: PropTypes.number.isRequired,
    }).isRequired,
    adjacencyMatrix: PropTypes.shape({
      operations: PropTypes.number.isRequired,
      conflicts: PropTypes.number.isRequired,
      avgTime: PropTypes.number.isRequired,
      memoryUsage: PropTypes.number.isRequired,
    }).isRequired,
    hashMapSets: PropTypes.shape({
      operations: PropTypes.number.isRequired,
      conflicts: PropTypes.number.isRequired,
      avgTime: PropTypes.number.isRequired,
      memoryUsage: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export default DSAComparison;