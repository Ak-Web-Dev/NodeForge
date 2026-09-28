/**
 * Executor — top-level graph execution controller.
 */
import { Runtime } from './Runtime.js';

export class Executor {
  constructor(state, registry, bus) {
    this.state = state;
    this.registry = registry;
    this.bus = bus;
    this.runtime = new Runtime();
    globalThis.__nf_runtime = this.runtime;
  }

  async run() {
    if (this.state.get('isRunning')) return;
    this.state.set('isRunning', true);
    this.runtime.reset();
    this.bus.emit('console:log', '▶ Running...');
    this.bus.emit('node:run:start');

    const nodes = this.state.get('nodes');
    const entryNodes = [];
    for (const [id, nd] of nodes) {
      const def = this.registry.get(nd.type);
      if (!def) continue;
      const hasExecIn = (def.inputs || []).some(p => p.type === 'exec');
      const hasExecOut = (def.outputs || []).some(p => p.type === 'exec');
      if (!hasExecIn && hasExecOut) entryNodes.push(id);
    }

    if (entryNodes.length === 0) {
      this.bus.emit('console:warn', 'No event nodes found. Add an "On Start" to begin.');
      this.stop();
      return;
    }

    try {
      for (const id of entryNodes) {
        await this.runtime.executeNode(id, this.registry, this.bus);
      }
      this.bus.emit('console:success', '✓ Program finished');
    } catch (err) {
      this.bus.emit('console:error', `Execution error: ${err.message}`);
    }
    this.stop();
  }

  stop() {
    this.state.set('isRunning', false);
    this.bus.emit('node:run:stop');
  }
}
