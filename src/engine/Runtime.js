/**
 * Runtime — execution context for a single node during graph execution.
 */
export class Runtime {
  constructor() {
    this.variables = new Map();
    this.nodeOutputs = new Map();
  }

  reset() {
    this.variables.clear();
    this.nodeOutputs.clear();
  }

  setVariable(name, value) { this.variables.set(name, value); }
  getVariable(name) { return this.variables.get(name); }

  /**
   * Get the output value from a connected source node.
   * If the source is a data-only node (no exec ports), execute it on-demand.
   */
  getInputValue(nodeId, portId, registry, bus) {
    const state = globalThis.__nf_state;
    const connections = state?.get('connections') || [];
    const conn = connections.find(c => c.toNode === nodeId && c.toPort === portId);
    if (!conn) return undefined;

    // Already computed? Return cached value
    const out = this.nodeOutputs.get(conn.fromNode);
    if (out && conn.fromPort in out) return out[conn.fromPort];

    // Source node hasn't executed yet — check if it's a data-only node
    const nodes = state?.get('nodes');
    const srcData = nodes?.get(conn.fromNode);
    if (!srcData) return undefined;
    const srcDef = registry.get(srcData.type);
    if (!srcDef?.execute) return undefined;

    const hasExecInput = (srcDef.inputs || []).some(p => p.type === 'exec');
    if (!this.nodeOutputs.has(conn.fromNode)) {
      // Node hasn't produced outputs yet — execute it now
      this.executeNode(conn.fromNode, registry, bus);
    }

    // Now return the computed value
    const out2 = this.nodeOutputs.get(conn.fromNode);
    return out2 ? out2[conn.fromPort] : undefined;
  }

  setOutput(nodeId, portId, value) {
    if (!this.nodeOutputs.has(nodeId)) this.nodeOutputs.set(nodeId, {});
    this.nodeOutputs.get(nodeId)[portId] = value;
  }

  async executeNode(nodeId, registry, bus) {
    const nodes = globalThis.__nf_state?.get('nodes');
    const nodeData = nodes?.get(nodeId);
    if (!nodeData) return;
    const def = registry.get(nodeData.type);
    if (!def?.execute) return;

    const ctx = {
      getData: (f) => nodeData.data?.[f],
      getInput: (p) => this.getInputValue(nodeId, p, registry, bus),
      setOutput: (p, v) => this.setOutput(nodeId, p, v),
      setVariable: (n, v) => this.setVariable(n, v),
      getVariable: (n) => this.getVariable(n),
      triggerOutput: async (portId) => {
        const connections = globalThis.__nf_state?.get('connections') || [];
        const outConns = connections.filter(c => c.fromNode === nodeId && c.fromPort === portId);
        bus.emit('node:executing', nodeId);
        for (const conn of outConns) {
          await this.executeNode(conn.toNode, registry, bus);
        }
      },
    };

    try {
      const result = def.execute(ctx);
      if (result && typeof result.then === 'function') await result;
    } catch (err) {
      bus.emit('console:error', `Node "${def.name}" failed: ${err.message}`);
    }
  }
}
