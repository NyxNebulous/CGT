/**
 * SimulationControls.jsx
 * 
 * Component for controlling the simulation flow:
 * - Start/Stop simulation
 * - Pause/Resume simulation
 * - Reset simulation
 * - Step-by-step execution
 * - Display current step and simulation status
 * 
 * Communicates with App.jsx via callbacks
 * Uses Tailwind CSS for styling
 */

import PropTypes from 'prop-types';

const SimulationControls = ({ isRunning, isPaused, currentStep, onStart, onPause, onResume, onReset, onStepForward }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 shadow-xl">
      <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
        Simulation Controls
      </h2>
      <div className="space-y-3">
        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={isRunning && !isPaused}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
        >
          {isRunning && !isPaused ? 'Running...' : 'Start'}
        </button>

        {/* Pause/Resume Button */}
        <button
          onClick={isPaused ? onResume : onPause}
          disabled={!isRunning}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
        >
          Reset
        </button>

        {/* Step Forward Button */}
        <button
          onClick={onStepForward}
          disabled={isRunning && !isPaused}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
        >
          Step Forward
        </button>
      </div>

      {/* Simulation Status */}
      <div className="mt-4 pt-4 border-t border-slate-600">
        <p className="text-sm text-slate-300">
          Current Step: <span className="font-bold text-purple-300">{currentStep}</span>
        </p>
        <p className="text-sm text-slate-300 mt-1">
          Status:{' '}
          <span className="font-bold text-purple-300">
            {!isRunning ? 'Idle' : isPaused ? 'Paused' : 'Running'}
          </span>
        </p>
      </div>
    </div>
  );
};

// PropTypes for type checking
SimulationControls.propTypes = {
  isRunning: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  currentStep: PropTypes.number.isRequired,
  onStart: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onResume: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onStepForward: PropTypes.func.isRequired,
};

export default SimulationControls;