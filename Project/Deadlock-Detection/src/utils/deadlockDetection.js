/**
 * deadlockDetection.js
 * 
 * Implements deadlock detection algorithms for Wait-for Graphs (WFG)
 * 
 * A deadlock exists when there's a cycle in the Wait-for Graph:
 * - T1 waits for T2
 * - T2 waits for T3
 * - T3 waits for T1
 * 
 * Primary Algorithm: DFS-based cycle detection
 * - Time Complexity: O(V + E) where V = transactions, E = wait-for edges
 * - Space Complexity: O(V) for recursion stack and visited sets
 */

// ==================== DFS CYCLE DETECTION ====================

/**
 * Detect all cycles (deadlocks) in the Wait-for Graph using DFS
 * 
 * @param {Object} wfg - Wait-for Graph data structure (AdjacencyList, Matrix, or HashMap)
 * @returns {Object} - { hasCycle: boolean, cycles: Array<Array<string>>, visitedNodes: number }
 */
export function detectDeadlock(wfg) {
  const startTime = performance.now();
  
  const nodes = wfg.getNodes();
  const visited = new Set();      // Nodes completely processed
  const recStack = new Set();     // Nodes in current DFS path (recursion stack)
  const cycles = [];              // All detected cycles
  const pathMap = new Map();      // Track path to each node for cycle reconstruction

  /**
   * DFS helper function to detect cycles
   */
  function dfs(node, path = []) {
    // Mark current node as visited and add to recursion stack
    visited.add(node);
    recStack.add(node);
    path.push(node);

    // Get all neighbors (nodes this transaction is waiting for)
    const neighbors = wfg.getNeighbors(node);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        // If neighbor not visited, recursively visit it
        pathMap.set(neighbor, [...path]);
        
        if (dfs(neighbor, [...path])) {
          return true; // Cycle detected in deeper recursion
        }
      } else if (recStack.has(neighbor)) {
        // If neighbor is in recursion stack, we found a cycle
        const cycleStartIndex = path.indexOf(neighbor);
        const cycle = path.slice(cycleStartIndex);
        cycle.push(neighbor); // Complete the cycle
        
        // Check if this cycle is new (not a duplicate)
        if (!isCycleDuplicate(cycles, cycle)) {
          cycles.push(cycle);
        }
        
        return true;
      }
    }

    // Remove node from recursion stack before backtracking
    recStack.delete(node);
    return false;
  }

  // Run DFS from each unvisited node
  for (const node of nodes) {
    if (!visited.has(node)) {
      pathMap.set(node, []);
      dfs(node, []);
    }
  }

  const endTime = performance.now();
  const detectionTime = endTime - startTime;

  return {
    hasCycle: cycles.length > 0,
    cycles: cycles,
    visitedNodes: visited.size,
    detectionTime: detectionTime,
    timestamp: Date.now(),
  };
}

/**
 * Check if a cycle is a duplicate (same set of nodes in different order)
 */
function isCycleDuplicate(existingCycles, newCycle) {
  const newCycleSet = new Set(newCycle.slice(0, -1)); // Exclude last node (duplicate of first)
  
  for (const cycle of existingCycles) {
    const cycleSet = new Set(cycle.slice(0, -1));
    
    // Check if sets are equal (same nodes)
    if (newCycleSet.size === cycleSet.size && 
        [...newCycleSet].every(node => cycleSet.has(node))) {
      return true;
    }
  }
  
  return false;
}

// ==================== ALTERNATIVE: TARJAN'S ALGORITHM ====================

/**
 * Detect strongly connected components (SCCs) using Tarjan's algorithm
 * SCCs with more than 1 node represent deadlocks
 * 
 * @param {Object} wfg - Wait-for Graph data structure
 * @returns {Object} - { sccs: Array<Array<string>>, deadlocks: Array<Array<string>> }
 */
export function detectDeadlockTarjan(wfg) {
  const nodes = wfg.getNodes();
  const indices = new Map();
  const lowLinks = new Map();
  const onStack = new Set();
  const stack = [];
  const sccs = [];
  let index = 0;

  function strongConnect(node) {
    // Set depth index for node
    indices.set(node, index);
    lowLinks.set(node, index);
    index++;
    stack.push(node);
    onStack.add(node);

    // Consider successors of node
    const neighbors = wfg.getNeighbors(node);
    for (const neighbor of neighbors) {
      if (!indices.has(neighbor)) {
        // Neighbor not yet visited; recurse on it
        strongConnect(neighbor);
        lowLinks.set(node, Math.min(lowLinks.get(node), lowLinks.get(neighbor)));
      } else if (onStack.has(neighbor)) {
        // Neighbor is in stack and hence in current SCC
        lowLinks.set(node, Math.min(lowLinks.get(node), indices.get(neighbor)));
      }
    }

    // If node is a root node, pop the stack and generate an SCC
    if (lowLinks.get(node) === indices.get(node)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== node);
      
      sccs.push(scc);
    }
  }

  // Find SCCs
  for (const node of nodes) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  // Deadlocks are SCCs with more than 1 node
  const deadlocks = sccs.filter(scc => scc.length > 1);

  return {
    sccs: sccs,
    deadlocks: deadlocks,
    hasDeadlock: deadlocks.length > 0,
  };
}

// ==================== CYCLE UTILITIES ====================

/**
 * Get the shortest cycle in the graph (minimum deadlock size)
 */
export function getShortestCycle(cycles) {
  if (cycles.length === 0) return null;
  
  return cycles.reduce((shortest, current) => {
    return current.length < shortest.length ? current : shortest;
  });
}

/**
 * Get all transactions involved in any deadlock
 */
export function getDeadlockedTransactions(cycles) {
  const deadlocked = new Set();
  
  cycles.forEach(cycle => {
    cycle.forEach(node => {
      if (node) deadlocked.add(node);
    });
  });
  
  return Array.from(deadlocked);
}

/**
 * Format cycles for display
 */
export function formatCycles(cycles) {
  return cycles.map((cycle, index) => ({
    id: index + 1,
    path: cycle.join(' → '),
    nodes: cycle.slice(0, -1), // Exclude duplicate last node
    length: cycle.length - 1,
  }));
}

/**
 * Check if a specific transaction is involved in a deadlock
 */
export function isTransactionDeadlocked(transactionId, cycles) {
  return cycles.some(cycle => cycle.includes(transactionId));
}

// ==================== DEADLOCK RESOLUTION STRATEGIES ====================

/**
 * Select victim transaction for abortion (simple strategy: youngest transaction)
 * In real systems, factors like priority, work done, etc. are considered
 */
export function selectVictim(cycle, transactions) {
  if (!cycle || cycle.length === 0) return null;
  
  // Simple strategy: select the transaction with highest ID (youngest)
  const cycleNodes = cycle.slice(0, -1); // Remove duplicate last node
  const victims = cycleNodes.map(nodeId => {
    const tx = transactions.find(t => t.id === nodeId);
    return { id: nodeId, ...tx };
  });
  
  // Sort by ID and return the last one
  victims.sort((a, b) => {
    const numA = parseInt(a.id.substring(1));
    const numB = parseInt(b.id.substring(1));
    return numA - numB;
  });
  
  return victims[victims.length - 1];
}

/**
 * Get resolution strategy for a deadlock
 */
export function getResolutionStrategy(cycle, transactions) {
  const victim = selectVictim(cycle, transactions);
  
  return {
    strategy: 'abort',
    victim: victim?.id,
    reason: 'Transaction selected for abortion to break deadlock cycle',
    affectedTransactions: cycle.slice(0, -1),
    cycle: cycle,
  };
}

// ==================== PERFORMANCE ANALYSIS ====================

/**
 * Analyze WFG properties for performance insights
 */
export function analyzeWFG(wfg) {
  const nodes = wfg.getNodes();
  const edges = wfg.getAllEdges();
  
  // Calculate in-degree and out-degree for each node
  const inDegree = new Map();
  const outDegree = new Map();
  
  nodes.forEach(node => {
    inDegree.set(node, 0);
    outDegree.set(node, 0);
  });
  
  edges.forEach(edge => {
    outDegree.set(edge.from, (outDegree.get(edge.from) || 0) + 1);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  });
  
  // Find nodes with no outgoing edges (not waiting for anyone)
  const freeNodes = nodes.filter(node => outDegree.get(node) === 0);
  
  // Find nodes with no incoming edges (no one waiting for them)
  const independentNodes = nodes.filter(node => inDegree.get(node) === 0);
  
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    avgOutDegree: edges.length / nodes.length || 0,
    freeNodes: freeNodes,
    independentNodes: independentNodes,
    graphDensity: (edges.length / (nodes.length * (nodes.length - 1))) || 0,
  };
}

/**
 * Compare detection performance across multiple WFG structures
 */
export function compareDetectionPerformance(wfgStructures) {
  const results = {};
  
  for (const [type, wfg] of Object.entries(wfgStructures)) {
    const result = detectDeadlock(wfg);
    results[type] = {
      hasCycle: result.hasCycle,
      cycleCount: result.cycles.length,
      detectionTime: result.detectionTime,
      visitedNodes: result.visitedNodes,
    };
  }
  
  return results;
}

// ==================== VISUALIZATION HELPERS ====================

/**
 * Get edges that are part of deadlock cycles (for highlighting in visualization)
 */
export function getDeadlockEdges(cycles, wfg) {
  const deadlockEdges = new Set();
  
  cycles.forEach(cycle => {
    for (let i = 0; i < cycle.length - 1; i++) {
      const from = cycle[i];
      const to = cycle[i + 1];
      deadlockEdges.add(`${from}->${to}`);
    }
  });
  
  return Array.from(deadlockEdges).map(edge => {
    const [from, to] = edge.split('->');
    return { from, to, isDeadlock: true };
  });
}

/**
 * Get node colors based on deadlock involvement
 */
export function getNodeColors(nodes, cycles) {
  const colors = {};
  const deadlockedNodes = getDeadlockedTransactions(cycles);
  
  nodes.forEach(node => {
    colors[node] = deadlockedNodes.includes(node) ? 'red' : 'green';
  });
  
  return colors;
}

// ==================== EXPORTS ====================

export default {
  detectDeadlock,
  detectDeadlockTarjan,
  getShortestCycle,
  getDeadlockedTransactions,
  formatCycles,
  isTransactionDeadlocked,
  selectVictim,
  getResolutionStrategy,
  analyzeWFG,
  compareDetectionPerformance,
  getDeadlockEdges,
  getNodeColors,
};