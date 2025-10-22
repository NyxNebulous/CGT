/**
 * wfgDataStructures.js
 * 
 * Implements three different data structures for representing Wait-for Graph (WFG):
 * 1. Adjacency List - Array/Object of arrays
 * 2. Adjacency Matrix - 2D array
 * 3. HashMap of Sets - Map with Set values
 * 
 * Each implementation provides:
 * - addEdge(from, to): Add a directed edge
 * - removeEdge(from, to): Remove a directed edge
 * - hasEdge(from, to): Check if edge exists
 * - getNeighbors(node): Get all outgoing edges from a node
 * - getAllEdges(): Get all edges in the graph
 * - clear(): Clear all edges
 * - getNodes(): Get all nodes in the graph
 * - Performance tracking for comparison
 */

// ==================== BASE CLASS ====================

/**
 * Base class for performance tracking across all data structures
 */
class BaseWFG {
  constructor(name) {
    this.name = name;
    this.operationCount = 0;
    this.totalTime = 0;
    this.operations = [];
  }

  /**
   * Track performance of an operation
   */
  trackOperation(operationName, fn) {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.operationCount++;
    this.totalTime += duration;
    this.operations.push({
      name: operationName,
      duration,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Get average operation time
   */
  getAverageTime() {
    return this.operationCount > 0 ? this.totalTime / this.operationCount : 0;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      operations: this.operationCount,
      totalTime: this.totalTime,
      avgTime: this.getAverageTime(),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage (to be overridden by subclasses)
   */
  estimateMemoryUsage() {
    return 0;
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.operationCount = 0;
    this.totalTime = 0;
    this.operations = [];
  }
}

// ==================== ADJACENCY LIST ====================

/**
 * Adjacency List implementation using JavaScript Object
 * Time Complexity:
 * - addEdge: O(1)
 * - removeEdge: O(E) where E is edges from node
 * - hasEdge: O(E)
 * - getNeighbors: O(1)
 * Space Complexity: O(V + E)
 */
export class AdjacencyListWFG extends BaseWFG {
  constructor() {
    super('Adjacency List');
    this.adjacencyList = {}; // { node: [neighbor1, neighbor2, ...] }
  }

  /**
   * Add a directed edge from 'from' to 'to'
   */
  addEdge(from, to) {
    return this.trackOperation('addEdge', () => {
      if (!this.adjacencyList[from]) {
        this.adjacencyList[from] = [];
      }
      if (!this.adjacencyList[from].includes(to)) {
        this.adjacencyList[from].push(to);
      }
      // Ensure 'to' node exists in the graph
      if (!this.adjacencyList[to]) {
        this.adjacencyList[to] = [];
      }
    });
  }

  /**
   * Remove a directed edge from 'from' to 'to'
   */
  removeEdge(from, to) {
    return this.trackOperation('removeEdge', () => {
      if (this.adjacencyList[from]) {
        this.adjacencyList[from] = this.adjacencyList[from].filter(node => node !== to);
      }
    });
  }

  /**
   * Check if edge exists from 'from' to 'to'
   */
  hasEdge(from, to) {
    return this.trackOperation('hasEdge', () => {
      return this.adjacencyList[from] ? this.adjacencyList[from].includes(to) : false;
    });
  }

  /**
   * Get all neighbors (outgoing edges) from a node
   */
  getNeighbors(node) {
    return this.trackOperation('getNeighbors', () => {
      return this.adjacencyList[node] || [];
    });
  }

  /**
   * Get all edges as array of {from, to} objects
   */
  getAllEdges() {
    return this.trackOperation('getAllEdges', () => {
      const edges = [];
      for (const from in this.adjacencyList) {
        for (const to of this.adjacencyList[from]) {
          edges.push({ from, to });
        }
      }
      return edges;
    });
  }

  /**
   * Get all nodes in the graph
   */
  getNodes() {
    return Object.keys(this.adjacencyList);
  }

  /**
   * Clear all edges
   */
  clear() {
    this.adjacencyList = {};
    this.resetMetrics();
  }

  /**
   * Estimate memory usage in bytes
   */
  estimateMemoryUsage() {
    const nodes = Object.keys(this.adjacencyList).length;
    const edges = this.getAllEdges().length;
    // Rough estimate: object overhead + keys + arrays
    return (nodes * 50) + (edges * 20);
  }

  /**
   * Get a copy of the adjacency list
   */
  getAdjacencyList() {
    return { ...this.adjacencyList };
  }
}

// ==================== ADJACENCY MATRIX ====================

/**
 * Adjacency Matrix implementation using 2D array
 * Time Complexity:
 * - addEdge: O(1)
 * - removeEdge: O(1)
 * - hasEdge: O(1)
 * - getNeighbors: O(V)
 * Space Complexity: O(V^2)
 */
export class AdjacencyMatrixWFG extends BaseWFG {
  constructor(nodes = []) {
    super('Adjacency Matrix');
    this.nodes = [...nodes]; // Array of node IDs
    this.nodeIndexMap = {}; // { nodeId: index }
    this.matrix = []; // 2D array

    // Initialize node index map and matrix
    this.initializeMatrix();
  }

  /**
   * Initialize the adjacency matrix
   */
  initializeMatrix() {
    const size = this.nodes.length;
    this.matrix = Array(size).fill(null).map(() => Array(size).fill(0));
    
    this.nodes.forEach((node, index) => {
      this.nodeIndexMap[node] = index;
    });
  }

  /**
   * Add a node to the graph (expands the matrix)
   */
  addNode(nodeId) {
    if (this.nodeIndexMap[nodeId] !== undefined) {
      return; // Node already exists
    }

    const newIndex = this.nodes.length;
    this.nodes.push(nodeId);
    this.nodeIndexMap[nodeId] = newIndex;

    // Expand matrix
    const newSize = this.nodes.length;
    
    // Add new column to existing rows
    for (let i = 0; i < this.matrix.length; i++) {
      this.matrix[i].push(0);
    }
    
    // Add new row
    this.matrix.push(Array(newSize).fill(0));
  }

  /**
   * Add a directed edge from 'from' to 'to'
   */
  addEdge(from, to) {
    return this.trackOperation('addEdge', () => {
      // Ensure both nodes exist
      if (this.nodeIndexMap[from] === undefined) {
        this.addNode(from);
      }
      if (this.nodeIndexMap[to] === undefined) {
        this.addNode(to);
      }

      const fromIndex = this.nodeIndexMap[from];
      const toIndex = this.nodeIndexMap[to];
      this.matrix[fromIndex][toIndex] = 1;
    });
  }

  /**
   * Remove a directed edge from 'from' to 'to'
   */
  removeEdge(from, to) {
    return this.trackOperation('removeEdge', () => {
      if (this.nodeIndexMap[from] === undefined || this.nodeIndexMap[to] === undefined) {
        return;
      }

      const fromIndex = this.nodeIndexMap[from];
      const toIndex = this.nodeIndexMap[to];
      this.matrix[fromIndex][toIndex] = 0;
    });
  }

  /**
   * Check if edge exists from 'from' to 'to'
   */
  hasEdge(from, to) {
    return this.trackOperation('hasEdge', () => {
      if (this.nodeIndexMap[from] === undefined || this.nodeIndexMap[to] === undefined) {
        return false;
      }

      const fromIndex = this.nodeIndexMap[from];
      const toIndex = this.nodeIndexMap[to];
      return this.matrix[fromIndex][toIndex] === 1;
    });
  }

  /**
   * Get all neighbors (outgoing edges) from a node
   */
  getNeighbors(node) {
    return this.trackOperation('getNeighbors', () => {
      if (this.nodeIndexMap[node] === undefined) {
        return [];
      }

      const fromIndex = this.nodeIndexMap[node];
      const neighbors = [];

      for (let i = 0; i < this.matrix[fromIndex].length; i++) {
        if (this.matrix[fromIndex][i] === 1) {
          neighbors.push(this.nodes[i]);
        }
      }

      return neighbors;
    });
  }

  /**
   * Get all edges as array of {from, to} objects
   */
  getAllEdges() {
    return this.trackOperation('getAllEdges', () => {
      const edges = [];

      for (let i = 0; i < this.matrix.length; i++) {
        for (let j = 0; j < this.matrix[i].length; j++) {
          if (this.matrix[i][j] === 1) {
            edges.push({
              from: this.nodes[i],
              to: this.nodes[j],
            });
          }
        }
      }

      return edges;
    });
  }

  /**
   * Get all nodes in the graph
   */
  getNodes() {
    return [...this.nodes];
  }

  /**
   * Clear all edges
   */
  clear() {
    this.initializeMatrix();
    this.resetMetrics();
  }

  /**
   * Estimate memory usage in bytes
   */
  estimateMemoryUsage() {
    const size = this.nodes.length;
    // 2D array: size^2 * 4 bytes per integer + overhead
    return (size * size * 4) + (size * 50);
  }

  /**
   * Get a copy of the matrix
   */
  getMatrix() {
    return this.matrix.map(row => [...row]);
  }
}

// ==================== HASHMAP OF SETS ====================

/**
 * HashMap of Sets implementation using JavaScript Map and Set
 * Time Complexity:
 * - addEdge: O(1)
 * - removeEdge: O(1)
 * - hasEdge: O(1)
 * - getNeighbors: O(1)
 * Space Complexity: O(V + E)
 */
export class HashMapSetsWFG extends BaseWFG {
  constructor() {
    super('HashMap of Sets');
    this.adjacencyMap = new Map(); // Map<node, Set<neighbor>>
  }

  /**
   * Add a directed edge from 'from' to 'to'
   */
  addEdge(from, to) {
    return this.trackOperation('addEdge', () => {
      if (!this.adjacencyMap.has(from)) {
        this.adjacencyMap.set(from, new Set());
      }
      this.adjacencyMap.get(from).add(to);

      // Ensure 'to' node exists in the graph
      if (!this.adjacencyMap.has(to)) {
        this.adjacencyMap.set(to, new Set());
      }
    });
  }

  /**
   * Remove a directed edge from 'from' to 'to'
   */
  removeEdge(from, to) {
    return this.trackOperation('removeEdge', () => {
      if (this.adjacencyMap.has(from)) {
        this.adjacencyMap.get(from).delete(to);
      }
    });
  }

  /**
   * Check if edge exists from 'from' to 'to'
   */
  hasEdge(from, to) {
    return this.trackOperation('hasEdge', () => {
      return this.adjacencyMap.has(from) && this.adjacencyMap.get(from).has(to);
    });
  }

  /**
   * Get all neighbors (outgoing edges) from a node
   */
  getNeighbors(node) {
    return this.trackOperation('getNeighbors', () => {
      if (!this.adjacencyMap.has(node)) {
        return [];
      }
      return Array.from(this.adjacencyMap.get(node));
    });
  }

  /**
   * Get all edges as array of {from, to} objects
   */
  getAllEdges() {
    return this.trackOperation('getAllEdges', () => {
      const edges = [];
      for (const [from, neighbors] of this.adjacencyMap.entries()) {
        for (const to of neighbors) {
          edges.push({ from, to });
        }
      }
      return edges;
    });
  }

  /**
   * Get all nodes in the graph
   */
  getNodes() {
    return Array.from(this.adjacencyMap.keys());
  }

  /**
   * Clear all edges
   */
  clear() {
    this.adjacencyMap.clear();
    this.resetMetrics();
  }

  /**
   * Estimate memory usage in bytes
   */
  estimateMemoryUsage() {
    const nodes = this.adjacencyMap.size;
    const edges = this.getAllEdges().length;
    // Map + Sets overhead: more efficient than matrix, similar to list
    return (nodes * 60) + (edges * 25);
  }

  /**
   * Get a copy of the adjacency map
   */
  getAdjacencyMap() {
    const copy = new Map();
    for (const [key, value] of this.adjacencyMap.entries()) {
      copy.set(key, new Set(value));
    }
    return copy;
  }
}

// ==================== FACTORY FUNCTION ====================

/**
 * Factory function to create WFG based on type
 */
export function createWFG(type, nodes = []) {
  switch (type) {
    case 'adjacencyList':
      return new AdjacencyListWFG();
    case 'adjacencyMatrix':
      return new AdjacencyMatrixWFG(nodes);
    case 'hashMapSets':
      return new HashMapSetsWFG();
    default:
      throw new Error(`Unknown WFG type: ${type}`);
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Compare performance of all three data structures
 */
export function compareDataStructures(operations) {
  const structures = {
    adjacencyList: new AdjacencyListWFG(),
    adjacencyMatrix: new AdjacencyMatrixWFG(['T1', 'T2', 'T3', 'T4', 'T5']),
    hashMapSets: new HashMapSetsWFG(),
  };

  const results = {};

  for (const [name, wfg] of Object.entries(structures)) {
    // Execute operations
    operations.forEach(op => {
      switch (op.type) {
        case 'addEdge':
          wfg.addEdge(op.from, op.to);
          break;
        case 'removeEdge':
          wfg.removeEdge(op.from, op.to);
          break;
        case 'hasEdge':
          wfg.hasEdge(op.from, op.to);
          break;
        case 'getNeighbors':
          wfg.getNeighbors(op.node);
          break;
      }
    });

    results[name] = wfg.getMetrics();
  }

  return results;
}

/**
 * Convert WFG to standard edge list format
 */
export function wfgToEdgeList(wfg) {
  return wfg.getAllEdges();
}

/**
 * Print WFG for debugging
 */
export function printWFG(wfg) {
  const edges = wfg.getAllEdges();
  console.log(`${wfg.name} - Total Edges: ${edges.length}`);
  edges.forEach(edge => {
    console.log(`  ${edge.from} -> ${edge.to}`);
  });
}