/**
 * TransactionInput.jsx
 * 
 * Component for configuring simulation parameters:
 * - Number of transactions
 * - Number of resources
 * - Wait-for Graph data structure selection
 * - Simulation speed
 * 
 * Passes updates to App.jsx via callback
 * Uses Tailwind CSS for styling
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TransactionInput = ({ config, onConfigChange, isRunning }) => {
  // Local state to manage form inputs (synced with parent config)
  const [formState, setFormState] = useState({
    numTransactions: config.numTransactions,
    numResources: config.numResources,
    selectedDataStructure: config.selectedDataStructure,
    simulationSpeed: config.simulationSpeed,
  });

  // Sync local state with parent config changes
  useEffect(() => {
    setFormState({
      numTransactions: config.numTransactions,
      numResources: config.numResources,
      selectedDataStructure: config.selectedDataStructure,
      simulationSpeed: config.simulationSpeed,
    });
  }, [config]);

  // Handle input changes and pass to parent
  const handleChange = (field, value) => {
    const newConfig = { ...formState, [field]: value };
    setFormState(newConfig);
    onConfigChange(newConfig); // Notify parent of changes
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'numTransactions' || name === 'numResources' ? parseInt(value) || 1 : value;
    handleChange(name, parsedValue);
  };

  // Handle simulation speed slider
  const handleSpeedChange = (e) => {
    handleChange('simulationSpeed', parseInt(e.target.value));
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 shadow-xl">
      <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
        Configuration
      </h2>
      <div className="space-y-4">
        {/* Number of Transactions */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Number of Transactions</label>
          <input
            type="number"
            name="numTransactions"
            value={formState.numTransactions}
            onChange={handleInputChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-400 focus:outline-none transition-colors"
            min="2"
            max="10"
            disabled={isRunning}
          />
          <p className="text-xs text-slate-400 mt-1">2–10 transactions</p>
        </div>

        {/* Number of Resources */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Number of Resources</label>
          <input
            type="number"
            name="numResources"
            value={formState.numResources}
            onChange={handleInputChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-400 focus:outline-none transition-colors"
            min="2"
            max="8"
            disabled={isRunning}
          />
          <p className="text-xs text-slate-400 mt-1">2–8 resources</p>
        </div>

        {/* Data Structure Selection */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">WFG Data Structure</label>
          <select
            name="selectedDataStructure"
            value={formState.selectedDataStructure}
            onChange={handleInputChange}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-400 focus:outline-none transition-colors"
            disabled={isRunning}
          >
            <option value="adjacencyList">Adjacency List</option>
            <option value="adjacencyMatrix">Adjacency Matrix</option>
            <option value="hashMapSets">HashMap of Sets</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">Choose data structure for Wait-for Graph</p>
        </div>

        {/* Simulation Speed */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Simulation Speed (ms/step)</label>
          <input
            type="range"
            name="simulationSpeed"
            value={formState.simulationSpeed}
            onChange={handleSpeedChange}
            className="w-full accent-purple-500"
            min="100"
            max="3000"
            step="100"
          />
          <p className="text-xs text-slate-400 mt-1">{formState.simulationSpeed} ms per step</p>
        </div>
      </div>
    </div>
  );
};

// PropTypes for type checking
TransactionInput.propTypes = {
  config: PropTypes.shape({
    numTransactions: PropTypes.number.isRequired,
    numResources: PropTypes.number.isRequired,
    selectedDataStructure: PropTypes.oneOf(['adjacencyList', 'adjacencyMatrix', 'hashMapSets']).isRequired,
    simulationSpeed: PropTypes.number.isRequired,
  }).isRequired,
  onConfigChange: PropTypes.func.isRequired,
  isRunning: PropTypes.bool.isRequired,
};

export default TransactionInput;