/**
 * GraphVisualization.jsx
 * Beautiful and functional Wait-for Graph with proper deadlock detection
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Canvas, Node, Edge } from 'reaflow';
import { getDeadlockEdges, getNodeColors } from '../utils/deadlockDetection';

const GraphVisualization = ({ transactions, wfgEdges, deadlocks }) => {
  // Status color configuration
  const STATUS_COLORS = {
    active: '#10b981',    // Emerald
    waiting: '#f59e0b',   // Amber
    blocked: '#f97316',   // Orange
    aborted: '#6b7280',   // Gray
    deadlock: '#ef4444'   // Red
  };

  const STATUS_GLOWS = {
    active: 'rgba(16, 185, 129, 0.5)',
    waiting: 'rgba(245, 158, 11, 0.5)',
    blocked: 'rgba(249, 115, 22, 0.5)',
    aborted: 'rgba(107, 114, 128, 0.4)',
    deadlock: 'rgba(239, 68, 68, 0.7)'
  };

  // Prepare node data with FIXED logic
  const nodes = useMemo(() => {
    const nodeColors = getNodeColors(transactions.map(t => t.id), deadlocks);

    return transactions.map(tx => {
      const isInDeadlock = nodeColors[tx.id] === 'red';
      const displayStatus = isInDeadlock ? 'deadlock' : tx.status;
      const color = STATUS_COLORS[displayStatus];
      const glowColor = STATUS_GLOWS[displayStatus];

      return {
        id: tx.id,
        text: tx.id,
        data: {
          ...tx,
          color,
          glowColor,
          isDeadlock: isInDeadlock,
          displayStatus
        },
      };
    });
  }, [transactions, deadlocks]);

  // Prepare edges with FIXED logic
  const links = useMemo(() => {
    const deadlockEdges = getDeadlockEdges(deadlocks, { getAllEdges: () => wfgEdges });

    return wfgEdges.map(edge => {
      const isDeadlock = deadlockEdges.some(de =>
        de.from === edge.from && de.to === edge.to
      );

      return {
        id: `${edge.from}-${edge.to}`,
        from: edge.from,
        to: edge.to,
        data: { isDeadlock },
      };
    });
  }, [wfgEdges, deadlocks]);

  const onNodeClick = (event, node) => {
    const tx = node?.data;
    if (tx) {
      const deadlockWarning = tx.isDeadlock ? '\n\n🚨 PART OF DEADLOCK CYCLE' : '';
      alert(`Transaction: ${tx.id}
Status: ${tx.status}
Held Locks: ${tx.heldLocks.join(', ') || 'None'}
Waiting For: ${tx.waitingFor || 'None'}${deadlockWarning}`);
    }
  };

  const onEdgeClick = (event, edge) => {
    const message = edge.data.isDeadlock
      ? `🚨 DEADLOCK EDGE: ${edge.from} is waiting for ${edge.to}`
      : `${edge.from} is waiting for ${edge.to}`;
    alert(message);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-2xl min-h-[500px] relative overflow-hidden">
      {/* Ambient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2 flex items-center">
          <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3 animate-pulse"></span>
          Wait-for Graph
        </h2>

        <p className="text-sm text-slate-400 mb-6">
          Interactive visualization of transaction dependencies. <span className="text-red-400 font-semibold">Red pulsing nodes/edges</span> indicate deadlocks.
        </p>

        {nodes.length > 0 ? (
          <div className="relative w-full h-[550px] bg-slate-950/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 shadow-inner">
            <Canvas
              nodes={nodes}
              edges={links}
              maxWidth={1200}
              maxHeight={550}
              layoutOptions={{
                'elk.direction': 'RIGHT',
                'elk.spacing.nodeNode': 80,
                'elk.layered.spacing.nodeNodeBetweenLayers': 140,
                'elk.algorithm': 'layered',
              }}
              animated
              zoomable
              pannable
              fit
            >
              {(event) => (
                <>
                  {event.nodes.map(node => {
                    const { color, glowColor, isDeadlock, displayStatus } = node.data;

                    return (
                      <Node
                        key={node.id}
                        node={node}
                        width={120}
                        height={75}
                        onClick={(e) => onNodeClick(e, node)}
                        style={{
                          fill: 'transparent',
                          stroke: 'transparent',
                          strokeWidth: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <foreignObject width="100%" height="100%">
                          <div
                            className={isDeadlock ? 'animate-pulse' : ''}
                            style={{
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                              borderRadius: '12px',
                              border: `2px solid ${isDeadlock ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: displayStatus === 'waiting' ? '#1f2937' : '#fff',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              textShadow: displayStatus === 'waiting' ? 'none' : '0 2px 4px rgba(0,0,0,0.5)',
                              boxShadow: isDeadlock
                                ? `0 0 25px ${glowColor}, 0 0 45px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`
                                : `0 4px 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.08)';
                              e.currentTarget.style.boxShadow = `0 6px 35px ${glowColor}, 0 0 65px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.3)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = isDeadlock
                                ? `0 0 25px ${glowColor}, 0 0 45px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`
                                : `0 4px 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`;
                            }}
                          >
                            <div className="font-bold text-base">{node.text}</div>
                            <div style={{
                              fontSize: '0.65rem',
                              opacity: 0.95,
                              marginTop: '3px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {displayStatus}
                              {isDeadlock && ' 🚨'}
                            </div>
                          </div>
                        </foreignObject>
                      </Node>
                    );
                  })}

                  {event.edges.map(edge => (
                    <Edge
                      key={edge.id}
                      edge={edge}
                      onClick={(e) => onEdgeClick(e, edge)}
                      style={{
                        stroke: edge.data.isDeadlock ? '#ef4444' : '#64748b',
                        strokeWidth: edge.data.isDeadlock ? 3.5 : 2,
                        strokeDasharray: edge.data.isDeadlock ? '8,4' : 'none',
                        opacity: edge.data.isDeadlock ? 1 : 0.7,
                        filter: edge.data.isDeadlock
                          ? 'drop-shadow(0 0 10px #ef4444) drop-shadow(0 0 15px #ef4444)'
                          : 'drop-shadow(0 0 4px rgba(0,0,0,0.4))',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </>
              )}
            </Canvas>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[550px] border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-950/30">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-300 font-medium mb-2">No Transactions Available</p>
              <p className="text-sm text-slate-500">
                Start the simulation to visualize the Wait-for Graph
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Legend */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Transaction States</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(STATUS_COLORS).map(([status, color]) => {
              const glow = STATUS_GLOWS[status];
              return (
                <div key={status} className="flex items-center group">
                  <span
                    className={`w-4 h-4 rounded-full mr-2 shadow-lg transition-transform group-hover:scale-110 ${status === 'deadlock' ? 'animate-pulse' : ''}`}
                    style={{
                      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                      boxShadow: `0 0 10px ${glow}`
                    }}
                  ></span>
                  <span className={`text-sm font-medium ${status === 'deadlock' ? 'text-red-300' : 'text-slate-300'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status === 'deadlock' && ' 🚨'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Prop validation
GraphVisualization.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['active', 'waiting', 'blocked', 'aborted']).isRequired,
      heldLocks: PropTypes.arrayOf(PropTypes.string).isRequired,
      waitingFor: PropTypes.string,
    })
  ).isRequired,
  wfgEdges: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    })
  ).isRequired,
  deadlocks: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
};

export default GraphVisualization;