# Graph Theory Deadlock Analyzer

Minimal React + Vite app that demonstrates wait‑for graph analysis, deadlock detection, victim selection and safe-batch computation using simple in-memory data structures.

Quick links
- Source UI: [src/App.jsx](src/App.jsx)
- Entrypoint: [src/main.jsx](src/main.jsx)
- Vite config: [vite.config.js](vite.config.js)
- Package manifest: [package.json](package.json)
- Page: [index.html](index.html)
- Styles: [src/index.css](src/index.css)

Features
- Generate synthetic wait‑for graphs and visualize them.
- Detect cycles (deadlocks) using DFS: see [`dfsDetectCycle`](src/App.jsx).
- Select victims to abort using BFS-based heuristic: see [`bfsVictimSelection`](src/App.jsx) and [`selectVictimFromCycle`](src/App.jsx).
- Compute conflict-aware batches (graph coloring by reachability): see [`computeConflictColorsByReachability`](src/App.jsx) and [`greedyVertexColoring`](src/App.jsx).
- Multiple WFG representations implemented for comparison: [`AdjacencyListWFG`](src/App.jsx), [`AdjacencyMatrixWFG`](src/App.jsx), [`HashMapSetsWFG`](src/App.jsx).
- UI actions to reset graph, detect deadlocks, compute safe batches and resolve deadlocks (abort victim).

Getting started

1. Install
```sh
npm install
```

2. Run dev server
```sh
npm run dev
```

Open http://localhost:5173 (Vite default) or follow the terminal output.

How to use the app (UI)
"Transactions": set number of nodes (T1, T2, ...).
"Data Structure": pick the authoritative WFG representation.
"Reset Graph": regenerate a random wait‑for graph.
"Detect Deadlock (DFS)": runs dfsDetectCycle and highlights cycle nodes/edges.
"Compute Safe Batches (Coloring)": runs reachability-based coloring (computeConflictColorsByReachability / greedyVertexColoring) and colors nodes by batch.
"Resolve Deadlock (Abort Victim)": runs the victim selection (bfsVictimSelection) and removes the chosen node via removeNode, then re-runs detection and coloring
