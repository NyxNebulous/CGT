/**
 * transactionManager.js
 * 
 * Manages transactions, resources, and lock operations.
 * Handles acquiring/releasing locks, updating Wait-for Graph (WFG),
 * blocking/unblocking transactions, and integrating deadlock detection.
 * 
 * Works with different WFG data structures via factory.
 * Tracks performance metrics for DSA comparison.
 * 
 * Key Features:
 * - Lock acquisition with wait queues
 * - Lock release with queue promotion
 * - WFG updates on wait/block
 * - Deadlock detection integration
 * - Transaction state management
 * - Performance tracking
 */

// Import dependencies
import { createWFG } from './wfgDataStructures';
import { detectDeadlock } from './deadlockDetection';

// ==================== TRANSACTION MANAGER CLASS ====================

/**
 * TransactionManager class
 * Coordinates transactions, resources, locks, and WFG
 */
export class TransactionManager {
  constructor(dataStructureType, transactions = [], resources = []) {
    this.dataStructureType = dataStructureType;
    
    // Initialize transactions (deep copy to avoid mutation)
    this.transactions = transactions.map(tx => ({
      ...tx,
      heldLocks: tx.heldLocks || [],      // Resources held by this tx
      waitingFor: tx.waitingFor || null,  // Resource it's waiting for (if any)
      status: tx.status || 'active',      // 'active' | 'waiting' | 'blocked' | 'aborted'
    }));

    // Initialize resources (deep copy)
    this.resources = resources.map(res => ({
      ...res,
      lockedBy: res.lockedBy || null,     // Transaction holding the lock (null if free)
      waitQueue: res.waitQueue || [],     // Queue of transactions waiting for this resource
    }));

    // Initialize WFG using factory
    const nodes = this.transactions.map(tx => tx.id);
    this.wfg = createWFG(dataStructureType, nodes);

    // Performance metrics
    this.metrics = {
      operations: 0,
      conflicts: 0,
      avgTime: 0,
      memoryUsage: 0,
      deadlocksDetected: 0,
    };

    // Bind methods
    this.acquireLock = this.acquireLock.bind(this);
    this.releaseLock = this.releaseLock.bind(this);
    this.detectDeadlock = this.detectDeadlock.bind(this);
    this.abortTransaction = this.abortTransaction.bind(this);
    this.updateMetrics = this.updateMetrics.bind(this);
  }

  /**
   * Attempt to acquire a lock on a resource for a transaction
   * @param {string} txId - Transaction ID
   * @param {string} resId - Resource ID
   * @returns {Object} - { success: boolean, message: string, updated: boolean }
   */
  acquireLock(txId, resId) {
    const startTime = performance.now();

    const tx = this.transactions.find(t => t.id === txId);
    const res = this.resources.find(r => r.id === resId);

    if (!tx || !res) {
      return { success: false, message: 'Invalid transaction or resource', updated: false };
    }

    if (tx.status !== 'active' && tx.status !== 'waiting') {
      return { success: false, message: `Transaction ${txId} is ${tx.status}`, updated: false };
    }

    if (tx.heldLocks.includes(resId)) {
      return { success: true, message: `Transaction ${txId} already holds ${resId}`, updated: false };
    }

    if (res.lockedBy === null) {
      // Resource is free: grant lock
      res.lockedBy = txId;
      tx.heldLocks.push(resId);
      tx.status = 'active';
      tx.waitingFor = null;

      // Remove any existing wait edges if tx was waiting elsewhere
      this.removeWaitEdges(txId);

      this.updateMetrics('acquireLock', performance.now() - startTime);
      return { success: true, message: `Lock granted on ${resId} to ${txId}`, updated: true };
    } else {
      // Resource is locked: add to wait queue
      if (!res.waitQueue.includes(txId)) {
        res.waitQueue.push(txId);
      }
      tx.waitingFor = resId;
      tx.status = 'waiting';

      // Update WFG: add edge from tx to the holder (and possibly others in queue if needed)
      // For standard WFG: tx waits for the current holder
      const holderTxId = res.lockedBy;
      this.wfg.addEdge(txId, holderTxId);

      // In some models, wait for all in front, but for deadlock detection, waiting for holder is sufficient

      this.metrics.conflicts++;
      this.updateMetrics('acquireLock (conflict)', performance.now() - startTime);
      return { success: false, message: `Waiting for ${resId} held by ${holderTxId}`, updated: true };
    }
  }

  /**
   * Release a lock on a resource held by a transaction
   * @param {string} txId - Transaction ID
   * @param {string} resId - Resource ID
   * @returns {Object} - { success: boolean, message: string, updated: boolean }
   */
  releaseLock(txId, resId) {
    const startTime = performance.now();

    const tx = this.transactions.find(t => t.id === txId);
    const res = this.resources.find(r => r.id === resId);

    if (!tx || !res) {
      return { success: false, message: 'Invalid transaction or resource', updated: false };
    }

    if (res.lockedBy !== txId) {
      return { success: false, message: `Transaction ${txId} does not hold ${resId}`, updated: false };
    }

    // Release the lock
    res.lockedBy = null;
    tx.heldLocks = tx.heldLocks.filter(id => id !== resId);

    // Remove any wait edges pointing to this tx for this resource
    // Actually, remove all incoming edges to this tx if no more locks held, but for precision:
    this.removeWaitEdgesForResource(resId);

    // Grant to next in wait queue if any
    if (res.waitQueue.length > 0) {
      const nextTxId = res.waitQueue.shift();
      const nextTx = this.transactions.find(t => t.id === nextTxId);

      if (nextTx) {
        res.lockedBy = nextTxId;
        nextTx.heldLocks.push(resId);
        nextTx.status = 'active';
        nextTx.waitingFor = null;

        // Update WFG: remove wait edge from nextTx
        this.removeWaitEdges(nextTxId);

        // Potentially update edges for remaining waiters
        if (res.waitQueue.length > 0) {
          // Remaining waiters now wait for the new holder
          res.waitQueue.forEach(waiterId => {
            this.wfg.addEdge(waiterId, nextTxId);
          });
        }
      }
    }

    this.updateMetrics('releaseLock', performance.now() - startTime);
    return { success: true, message: `Lock released on ${resId} by ${txId}`, updated: true };
  }

  /**
   * Detect deadlocks using the provided detection function
   * @returns {Object} - Result from detectDeadlock
   */
  detectDeadlock() {
    const result = detectDeadlock(this.wfg);
    if (result.hasCycle) {
      this.metrics.deadlocksDetected += result.cycles.length;
    }
    return result;
  }

  /**
   * Abort a transaction to resolve deadlock
   * @param {string} txId - Transaction ID to abort
   * @returns {Object} - { success: boolean, message: string }
   */
  abortTransaction(txId) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) {
      return { success: false, message: 'Invalid transaction' };
    }

    tx.status = 'aborted';

    // Release all held locks
    tx.heldLocks.forEach(resId => {
      this.releaseLock(txId, resId);
    });
    tx.heldLocks = [];

    // Remove from any wait queues
    this.resources.forEach(res => {
      res.waitQueue = res.waitQueue.filter(id => id !== txId);
    });
    tx.waitingFor = null;

    // Remove all edges related to this tx from WFG
    this.wfg.getNodes().forEach(node => {
      this.wfg.removeEdge(node, txId);
    });
    this.removeWaitEdges(txId);

    return { success: true, message: `Transaction ${txId} aborted` };
  }

  /**
   * Remove wait edges originating from a transaction
   * @param {string} txId - Transaction ID
   */
  removeWaitEdges(txId) {
    this.wfg.getNeighbors(txId).forEach(neighbor => {
      this.wfg.removeEdge(txId, neighbor);
    });
  }

  /**
   * Remove wait edges for a specific resource (incoming to previous holder)
   * @param {string} resId - Resource ID
   */
  removeWaitEdgesForResource(resId) {
    // For precision, but since WFG is tx-to-tx, not resource-specific, we may need to check if the edge was due to this resource
    // For simplicity, assume release removes relevant edges via holder change
    // TODO: If needed, track edge reasons for more accurate removal
  }

  /**
   * Update performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Time taken
   */
  updateMetrics(operation, duration) {
    this.metrics.operations++;
    this.metrics.avgTime = ((this.metrics.avgTime * (this.metrics.operations - 1)) + duration) / this.metrics.operations;
    this.metrics.memoryUsage = this.wfg.estimateMemoryUsage(); // From WFG instance
    // Note: conflicts updated separately
  }

  /**
   * Get current state (for App.jsx)
   * @returns {Object} - Current transactions, resources, wfgEdges, metrics
   */
  getState() {
    return {
      transactions: [...this.transactions],
      resources: [...this.resources],
      wfgEdges: this.wfg.getAllEdges(),
      metrics: { ...this.metrics },
    };
  }

  /**
   * Reset the manager
   */
  reset() {
    this.transactions.forEach(tx => {
      tx.status = 'active';
      tx.heldLocks = [];
      tx.waitingFor = null;
    });
    this.resources.forEach(res => {
      res.lockedBy = null;
      res.waitQueue = [];
    });
    this.wfg.clear();
    this.metrics = {
      operations: 0,
      conflicts: 0,
      avgTime: 0,
      memoryUsage: 0,
      deadlocksDetected: 0,
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate random lock operation for simulation
 * @param {Array} transactions - List of transactions
 * @param {Array} resources - List of resources
 * @returns {Object} - { txId, resId, action: 'acquire' | 'release' }
 */
export function generateRandomOperation(transactions, resources) {
  const activeTxs = transactions.filter(tx => tx.status === 'active' || tx.status === 'waiting');
  if (activeTxs.length === 0) return null;

  const tx = activeTxs[Math.floor(Math.random() * activeTxs.length)];
  const action = Math.random() > 0.5 && tx.heldLocks.length > 0 ? 'release' : 'acquire';

  let res;
  if (action === 'release') {
    res = tx.heldLocks[Math.floor(Math.random() * tx.heldLocks.length)];
  } else {
    res = resources[Math.floor(Math.random() * resources.length)].id;
  }

  return { txId: tx.id, resId: res, action };
}