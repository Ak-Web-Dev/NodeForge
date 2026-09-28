/**
 * NodeForge — Main Entry Point
 * Wires up all systems: editor, nodes, engine, UI, project, tutorial, minimap.
 */
import { EventBus } from './core/EventBus.js';
import { State } from './core/State.js';
import { Camera } from './editor/Camera.js';
import { Canvas } from './editor/Canvas.js';
import { Selection } from './editor/Selection.js';
import { Connections } from './editor/Connections.js';
import { Node, generateNodeId } from './nodes/Node.js';
import { NodeRegistry } from './nodes/NodeRegistry.js';
import { Toolbar } from './ui/Toolbar.js';
import { Sidebar } from './ui/Sidebar.js';
import { Inspector } from './ui/Inspector.js';
import { ConsolePanel } from './ui/Console.js';
import { Serializer } from './project/Serializer.js';
import { Storage } from './project/Storage.js';
import { Executor } from './engine/Executor.js';
import { Compiler } from './engine/Compiler.js';

/* ── Core ── */
const bus = new EventBus();
const state = new State(bus);
const registry = new NodeRegistry();
globalThis.__nf_registry = registry;
globalThis.__nf_state = state;

/* ── Node types (loaded after registry is on globalThis) ── */
await Promise.all([
  import('./nodes/types/events.js'),
  import('./nodes/types/data.js'),
  import('./nodes/types/math.js'),
  import('./nodes/types/logic.js'),
  import('./nodes/types/flow.js'),
  import('./nodes/types/web.js'),
]);

/* ── Editor ── */
const camera = new Camera();
const canvas = new Canvas(state, bus, camera);
const connections = new Connections(state, bus, camera);
const selection = new Selection(state, bus, canvas);

/* ── UI ── */
const toolbar = new Toolbar(state, bus);
const sidebar = new Sidebar(state, bus, registry, canvas);
const inspector = new Inspector(state, bus, registry);
const consolePanel = new ConsolePanel(bus);

/* ── Project ── */
const storage = new Storage();
const serializer = new Serializer();
const executor = new Executor(state, registry, bus);

/* ── Node creation ── */
bus.on('node:create', (type, x, y) => {
  const def = registry.get(type);
  if (!def) { bus.emit('console:error', `Unknown node type: ${type}`); return; }
  const data = { id: generateNodeId(), type, x, y, data: {} };
  if (def.dataFields) {
    for (const f of def.dataFields) data.data[f.id] = f.defaultValue ?? '';
  }
  const node = new Node(def, data);
  const el = node.render({ state, bus, camera, connections });
  canvas.appendNode(el);
  data._instance = node;
  state.addNode(data);
  bus.emit('console:log', `Created "${def.name}"`);
  if (type === 'events.on_start') {
    bus.emit('console:log', 'Tip: Connect On Start → to another node\'s ← input, then press ▶ Run');
  }

});

/* ── Node selection via double-click ── */
document.getElementById('canvas').addEventListener('dblclick', (e) => {
  const nodeEl = e.target.closest('.node');
  if (!nodeEl) return;
  if (e.target.classList.contains('node-port') || e.target.tagName === 'INPUT') return;
  e.stopPropagation();
  const nodeId = nodeEl.dataset.nodeId;
  if (e.shiftKey) {
    selection.isSelected(nodeId) ? selection.deselect(nodeId) : selection.select(nodeId);
  } else {
    selection.deselectAll();
    selection.select(nodeId);
  }
});

/* ── Delete ── */
bus.on('action:delete', () => {
  const sel = state.get('selectedNodeIds');
  for (const id of sel) {
    const nd = state.get('nodes').get(id);
    if (nd?._instance) nd._instance.destroy();
    // Belt-and-suspenders: also remove DOM directly
    const domNode = document.getElementById(`node-${id}`);
    if (domNode) domNode.remove();
    state.set('connections', state.get('connections').filter(c => c.fromNode !== id && c.toNode !== id));
    state.removeNode(id);
  }
  selection.deselectAll();
  bus.emit('console:log', `Deleted ${sel.size} node(s)`);

});

/* ── Toolbar actions ── */
bus.on('action:run', () => executor.run());
bus.on('action:stop', () => executor.stop());

bus.on('action:new', () => {
  if (!confirm('New project? Unsaved changes will be lost.')) return;
  for (const [, nd] of state.get('nodes')) { if (nd._instance) nd._instance.destroy(); }
  state.set('nodes', new Map());
  state.set('connections', []);
  selection.deselectAll();
  state.set('projectName', 'Untitled');
  bus.emit('console:log', 'New project');

});

bus.on('action:import-file', async () => {
  const result = await storage.importFile();
  if (!result) { bus.emit('console:warn', 'No file selected'); return; }
  for (const [, nd] of state.get('nodes')) { if (nd._instance) nd._instance.destroy(); }
  const { nodes: loaded } = serializer.deserialize(result.data, state);
  for (const nd of loaded) {
    const def = registry.get(nd.type);
    if (!def) continue;
    const node = new Node(def, nd);
    const el = node.render({ state, bus, camera, connections });
    canvas.appendNode(el);
    nd._instance = node;
    state.get('nodes').set(nd.id, nd);
  }
  const importName = result.name.replace(/\.[^.]+$/, '');
  state.set('projectName', importName);
  selection.deselectAll();
  connections.render();
  bus.emit('console:success', 'Project imported');
});

bus.on('action:export-file', () => {
  const name = state.get('projectName') || 'untitled';
  storage.exportFile(serializer.serialize(state), name + '.nodeforge');
  state.set('projectName', name);
  bus.emit('console:success', 'Project exported');
});

bus.on('action:view-code', async () => {
  const code = new Compiler(state, registry).compile();
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:500;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = `<div style="background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:8px;padding:20px;max-width:700px;width:90%;max-height:80vh;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong style="color:var(--text-primary)">Generated JavaScript</strong><button class="toolbar-btn" id="close-code-modal">Close</button></div>
    <pre style="flex:1;overflow:auto;background:var(--bg-primary);padding:12px;border-radius:4px;font-family:var(--font-mono);font-size:var(--font-size-sm);color:var(--text-primary);white-space:pre-wrap">${code.replace(/</g, '&lt;')}</pre></div>`;
  document.body.appendChild(modal);
  modal.querySelector('#close-code-modal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
});

/* ── Undo / Redo ── */
const undoStack = [];
const redoStack = [];

function pushUndo(action) {
  undoStack.push(action);
  redoStack.length = 0;
}

bus.on('node:moved', (id) => {
  // Debounced move undo — record final position on mouseup
});

bus.on('node:created', (nd) => {
  pushUndo({ type: 'create', nodeId: nd.id, nodeData: { ...nd, data: { ...nd.data } } });
});

bus.on('node:removed', (nd) => {
  pushUndo({ type: 'remove', nodeData: { ...nd, data: { ...nd.data } } });
});

bus.on('connection:created', (conn) => {
  pushUndo({ type: 'connect', conn: { ...conn } });
});

bus.on('connection:removed', (connId) => {
  pushUndo({ type: 'disconnect', connId });
});

bus.on('action:undo', () => {
  if (undoStack.length === 0) { bus.emit('console:warn', 'Nothing to undo'); return; }
  const action = undoStack.pop();
  redoStack.push(action);
  if (action.type === 'create') {
    const nd = state.get('nodes').get(action.nodeId);
    if (nd?._instance) nd._instance.destroy();
    state.removeNode(action.nodeId);
  } else if (action.type === 'remove') {
    const def = registry.get(action.nodeData.type);
    if (def) {
      const node = new Node(def, action.nodeData);
      const el = node.render({ state, bus, camera, connections });
      canvas.appendNode(el);
      action.nodeData._instance = node;
      state.addNode(action.nodeData);
    }
  }
  bus.emit('console:log', 'Undo');

});

bus.on('action:redo', () => {
  if (redoStack.length === 0) { bus.emit('console:warn', 'Nothing to redo'); return; }
  const action = redoStack.pop();
  undoStack.push(action);
  if (action.type === 'create') {
    const def = registry.get(action.nodeData.type);
    if (def) {
      const node = new Node(def, action.nodeData);
      const el = node.render({ state, bus, camera, connections });
      canvas.appendNode(el);
      action.nodeData._instance = node;
      state.addNode(action.nodeData);
    }
  } else if (action.type === 'remove') {
    const nd = state.get('nodes').get(action.nodeData.id);
    if (nd?._instance) nd._instance.destroy();
    state.removeNode(action.nodeData.id);
  }
  bus.emit('console:log', 'Redo');

});

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Delete' || e.key === 'Backspace') bus.emit('action:delete');
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); bus.emit('action:save'); }
  if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); bus.emit('action:undo'); }
  if (e.ctrlKey && e.shiftKey && e.key === 'z') { e.preventDefault(); bus.emit('action:redo'); }
  if (e.key === 'Escape') { selection.deselectAll(); connections.endTemp(); }
});

/* ── Node execution highlighting ── */
bus.on('node:executing', (nodeId) => {
  const nd = state.get('nodes').get(nodeId);
  if (nd?._instance) nd._instance.setRunning(true);
});

bus.on('node:run:stop', () => {
  for (const [, nd] of state.get('nodes')) { if (nd?._instance) nd._instance.setRunning(false); }
});

/* ── Connection deletion ── */
bus.on('connection:delete', (connId) => {
  state.removeConnection(connId);
  bus.emit('console:log', 'Connection deleted');
});

/* ── Playground panel ── */
function createPlayground() {
  let pg = document.getElementById('playground');
  if (pg) return pg;
  pg = document.createElement('div');
  pg.id = 'playground';
  pg.style.cssText = 'position:absolute;bottom:8px;left:8px;right:200px;min-height:80px;max-height:200px;overflow:auto;background:var(--bg-surface);border:1px solid var(--border-color);border-radius:6px;padding:10px;font-size:var(--font-size-sm);color:var(--text-primary);z-index:40';
  pg.innerHTML = `<div style="color:var(--text-muted);font-size:var(--font-size-xs);margin-bottom:6px">Playground — Web nodes render DOM elements here</div><div id="playground-content" style="min-height:30px"></div>`;
  document.getElementById('canvas-container').appendChild(pg);
  return pg;
}

let playgroundVisible = true;
createPlayground();

bus.on('action:playground-toggle', () => {
  playgroundVisible = !playgroundVisible;
  const pg = document.getElementById('playground') || createPlayground();
  pg.style.display = playgroundVisible ? 'block' : 'none';
});

/* ── Tutorial ── */
function showTutorial(force) {
  if (!force) {
    const seen = localStorage.getItem('nodeforge_tutorial_seen');
    if (seen) return;
  }

  const steps = [
    {
      title: 'Welcome to NodeForge!',
      text: 'NodeForge is a visual programming environment. Instead of writing code, you connect nodes together. Think of it as Scratch, but with nodes instead of blocks.',
    },
    {
      title: 'What are Nodes?',
      text: 'Each node represents an operation — a math formula, a variable, an event, or a DOM action. You\'ll find all available nodes in the sidebar on the left. Drag them onto the canvas.',
    },
    {
      title: 'Ports & Connections',
      text: '<strong>Inputs</strong> are on the left side of each node, <strong>outputs</strong> on the right. Drag from an output port (circle) to an input port to connect them.<br><br><span style="color:var(--conn-exec)">■ Red connections</span> = execution flow (the order things happen)<br><span style="color:var(--conn-data)">■ Teal connections</span> = data flow (values moving between nodes)',
    },
    {
      title: 'Try It: Hello World!',
      text: '<strong>Step 1:</strong> From the sidebar, drag an <strong>On Start</strong> node onto the canvas.<br><strong>Step 2:</strong> Drag a <strong>Print</strong> node (under Data) onto the canvas.<br><strong>Step 3:</strong> Drag a <strong>String</strong> node and type "Hello World" in its text field.<br><strong>Step 4:</strong> Connect: String → Print (Value port), then On Start → Print (← port).<br><strong>Step 5:</strong> Click <strong style="color:var(--accent-data)">▶ Run</strong>!',
    },
    {
      title: 'How On Start Works',
      text: '<strong>On Start</strong> fires when you press <strong>▶ Run</strong>. Connect its <strong style="color:var(--conn-exec)">→ output</strong> to the <strong style="color:var(--conn-exec)">← input</strong> of any node to make it execute.<br><br>You can chain nodes: On Start → Set Variable → If → Print. The execution follows the red connections.',
    },
    {
      title: 'Canvas Controls',
      text: `<strong>Pan:</strong> Click and drag on empty canvas space, or hold <strong>middle mouse button</strong> and drag.<br>
<strong>Zoom:</strong> Use the <strong>mouse wheel</strong> to zoom in and out.<br>
<strong>Select:</strong> Double-click a node to select it. Its properties appear in the Inspector on the right.<br>
<strong>Multi-select:</strong> Hold <strong>Shift</strong> and double-click multiple nodes.<br>
<strong>Move:</strong> Click and drag a node to reposition it.<br>
<strong>Delete:</strong> Select a node and press <strong>Delete</strong> or <strong>Backspace</strong>.<br>
<strong>Disconnect:</strong> Drag from a connected port away to remove the connection.<br>
<strong>Cancel:</strong> Press <strong>Escape</strong> to deselect all and cancel any in-progress connection.`,
    },
  ];

  let step = 0;
  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';
  document.body.appendChild(overlay);

  function renderStep() {
    overlay.innerHTML = `<div class="tutorial-card">
      <div class="step-indicator">Step ${step + 1} of ${steps.length}</div>
      <h2>${steps[step].title}</h2>
      <p>${steps[step].text}</p>
      <div>
        <button id="tutorial-next">${step < steps.length - 1 ? 'Next →' : 'Get Started!'}</button>
        ${step > 0 ? '<button class="secondary" id="tutorial-prev">← Back</button>' : ''}
        <button class="secondary" id="tutorial-skip">Skip Tutorial</button>
      </div>
    </div>`;

    overlay.querySelector('#tutorial-next').addEventListener('click', () => {
      step++;
      if (step >= steps.length) { overlay.remove(); localStorage.setItem('nodeforge_tutorial_seen', '1'); }
      else renderStep();
    });

    const prevBtn = overlay.querySelector('#tutorial-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => { step--; renderStep(); });

    overlay.querySelector('#tutorial-skip').addEventListener('click', () => {
      overlay.remove();
      localStorage.setItem('nodeforge_tutorial_seen', '1');
    });
  }
  renderStep();
}

showTutorial();
bus.on('action:show-tutorial', () => showTutorial(true));
bus.emit('console:log', 'NodeForge ready');
