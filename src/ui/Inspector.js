/**
 * Inspector — right panel showing properties, value, and JS code for the selected node.
 */
export class Inspector {
  constructor(state, bus, registry) {
    this.state = state;
    this.bus = bus;
    this.registry = registry;
    this.el = document.getElementById('inspector');
    this._init();
  }

  _init() {
    this._renderEmpty();
    this.bus.on('selection:changed', (sel) => {
      if (sel.size === 1) this._renderNode([...sel][0]);
      else if (sel.size === 0) this._renderEmpty();
      else this.el.querySelector('.inspector-content').innerHTML = `<div class="inspector-empty">${sel.size} nodes selected</div>`;
    });
    this.bus.on('node:data:changed', (nodeId) => {
      const sel = this.state.get('selectedNodeIds');
      if (sel.size === 1 && [...sel][0] === nodeId) this._renderNode(nodeId);
    });
  }

  _renderEmpty() {
    this.el.innerHTML = `<div class="inspector-header">Inspector</div><div class="inspector-content"><div class="inspector-empty">Select a node to inspect</div></div>`;
  }

  _getNodeCode(nd, def) {
    const d = nd.data || {};
    const findSrc = (portId) => {
      const conn = this.state.get('connections').find(c => c.toNode === nd.id && c.toPort === portId);
      return conn ? '...' : null;
    };

    switch (nd.type) {
      case 'data.number': return `const node = ${d.value ?? 0};`;
      case 'data.string': return `const node = "${d.value ?? ''}";`;
      case 'data.boolean': return `const node = ${d.value === 'true'};`;
      case 'data.print': return `console.log(${findSrc('value') || 'value'});`;
      case 'data.set_variable': return `let ${d.name || 'myVar'} = ${findSrc('value') || '...'};`;
      case 'data.get_variable': return `const node = ${d.name || 'myVar'};`;
      case 'math.add': return `const node = ${findSrc('a') || '0'} + ${findSrc('b') || '0'};`;
      case 'math.subtract': return `const node = ${findSrc('a') || '0'} - ${findSrc('b') || '0'};`;
      case 'math.multiply': return `const node = ${findSrc('a') || '0'} * ${findSrc('b') || '0'};`;
      case 'math.divide': return `const node = ${findSrc('a') || '0'} / ${findSrc('b') || '1'};`;
      case 'math.random': return `const node = Math.floor(Math.random() * (${findSrc('max') || '100'} - ${findSrc('min') || '0'})) + ${findSrc('min') || '0'};`;
      case 'logic.if': return `if (${findSrc('condition') || '...'}) { ... }`;
      case 'logic.compare': return `const node = ${findSrc('a') || '...'} ${d.op || '=='} ${findSrc('b') || '...'};`;
      case 'logic.and': return `const node = ${findSrc('a') || '...'} && ${findSrc('b') || '...'};`;
      case 'logic.or': return `const node = ${findSrc('a') || '...'} || ${findSrc('b') || '...'};`;
      case 'logic.not': return `const node = !${findSrc('a') || '...'};`;
      case 'flow.wait': return `await new Promise(r => setTimeout(r, ${(d.duration ?? 1) * 1000}));`;
      case 'flow.sequence': return `// sequence: 1 → 2 → 3`;
      case 'flow.repeat': return `for (let i = 0; i < ${(d.count ?? 3)}; i++) { ... }`;
      case 'events.on_start': return `(function main() { ... })();`;
      case 'events.on_click': return `document.querySelector("${d.target || '#playground'}").addEventListener("click", () => { ... });`;
      case 'events.on_key': return `document.addEventListener("keydown", (e) => { if (e.key === "${d.key || 'Enter'}") { ... } });`;
      case 'web.create_element': return `const el = document.createElement("${d.tag || 'div'}");`;
      case 'web.set_text': return `document.querySelector(${findSrc('target') || '...'}).textContent = ${findSrc('text') || '...'};`;
      case 'web.set_style': return `document.querySelector(${findSrc('target') || '...'}).style.${d.property || 'color'} = ${findSrc('value') || '...'};`;
      case 'web.delete_element': return `document.querySelector(${findSrc('target') || '...'}).remove();`;
      default: return `// ${def.name}`;
    }
  }

  _getNodeValue(nd, def) {
    const outputs = def.outputs || [];
    if (outputs.length === 0) return null;
    // Check runtime for computed value
    const runtime = globalThis.__nf_runtime;
    if (!runtime) return null;
    const nodeOutputs = runtime.nodeOutputs.get(nd.id);
    if (!nodeOutputs) return null;
    // Return first output value
    for (const out of outputs) {
      if (out.type !== 'exec' && out.id in nodeOutputs) {
        return nodeOutputs[out.id];
      }
    }
    return null;
  }

  _renderNode(nodeId) {
    const nd = this.state.get('nodes').get(nodeId);
    if (!nd) return this._renderEmpty();
    const def = this.registry.get(nd.type);
    if (!def) return this._renderEmpty();

    let fields = '';
    if (def.dataFields) {
      for (const f of def.dataFields) {
        const val = nd.data?.[f.id] ?? f.defaultValue ?? '';
        fields += `<div class="inspector-field"><div class="inspector-field-label">${f.id}</div>
          <input class="inspector-field-input" type="${f.inputType || 'text'}" value="${String(val).replace(/"/g, '&quot;')}" data-field="${f.id}" /></div>`;
      }
    }

    // Value section
    const val = this._getNodeValue(nd, def);
    let valueHtml = '';
    if (val !== null && val !== undefined) {
      valueHtml = `<div class="inspector-field"><div class="inspector-field-label">Value</div>
        <div style="color:var(--accent-data);font-family:var(--font-mono);font-size:var(--font-size-sm);word-break:break-all">${String(val).replace(/</g, '&lt;')}</div></div>`;
    }

    // JS code section
    const code = this._getNodeCode(nd, def);

    this.el.innerHTML = `
      <div class="inspector-header">Inspector</div>
      <div class="inspector-content">
        <div class="inspector-field"><div class="inspector-field-label">Type</div><div style="color:var(--text-primary);font-size:var(--font-size-sm)">${def.name}</div></div>
        <div class="inspector-field"><div class="inspector-field-label">ID</div><div style="color:var(--text-muted);font-size:var(--font-size-xs);font-family:var(--font-mono)">${nodeId}</div></div>
        ${fields}
        ${valueHtml}
        <div class="inspector-field"><div class="inspector-field-label">JavaScript</div>
          <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:4px;padding:6px 8px;font-family:var(--font-mono);font-size:var(--font-size-xs);color:var(--accent-logic);word-break:break-all;line-height:1.4">${code.replace(/</g, '&lt;')}</div></div>
      </div>`;

    this.el.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('input', () => {
        const nodes = this.state.get('nodes');
        const nd = nodes.get(nodeId);
        if (!nd) return;
        nd.data = nd.data || {};
        nd.data[input.dataset.field] = input.value;
        this.bus.emit('node:data:changed', nodeId);
      });
    });
  }
}
