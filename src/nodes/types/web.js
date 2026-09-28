/**
 * Web/DOM nodes — create, modify, delete elements in the Playground.
 */
const reg = (def) => globalThis.__nf_registry?.register(def);

reg({
  type: 'web.create_element',
  name: 'Create Element',
  category: 'web',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'parent', name: 'Parent', type: 'string' }],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }, { id: 'element', name: 'Element', type: 'string' }],
  dataFields: [{ id: 'tag', inputType: 'text', defaultValue: 'div', placeholder: 'tag' }, { id: 'id', inputType: 'text', defaultValue: '', placeholder: 'id (optional)' }],
  execute(ctx) {
    const tag = ctx.getData('tag') || 'div';
    const id = ctx.getData('id');
    const sel = ctx.getInput('parent');
    const parent = sel ? document.querySelector(sel) : document.querySelector('#playground');
    if (!parent) throw new Error(`Parent "${sel || '#playground'}" not found`);
    const el = document.createElement(tag);
    if (id) el.id = id;
    parent.appendChild(el);
    ctx.setOutput('element', id ? '#' + id : null);
    ctx.triggerOutput('exec');
  },
});

reg({
  type: 'web.set_text',
  name: 'Set Text',
  category: 'web',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'target', name: 'Target', type: 'string' }, { id: 'text', name: 'Text', type: 'string' }],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  execute(ctx) {
    const el = document.querySelector(ctx.getInput('target'));
    if (!el) throw new Error(`Element "${ctx.getInput('target')}" not found`);
    el.textContent = String(ctx.getInput('text') ?? '');
    ctx.triggerOutput('exec');
  },
});

reg({
  type: 'web.set_style',
  name: 'Set Style',
  category: 'web',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'target', name: 'Target', type: 'string' }, { id: 'value', name: 'Value', type: 'string' }],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  dataFields: [{ id: 'property', inputType: 'text', defaultValue: 'color', placeholder: 'CSS property' }],
  execute(ctx) {
    const el = document.querySelector(ctx.getInput('target'));
    if (!el) throw new Error(`Element "${ctx.getInput('target')}" not found`);
    el.style[ctx.getData('property') || 'color'] = String(ctx.getInput('value'));
    ctx.triggerOutput('exec');
  },
});

reg({
  type: 'web.delete_element',
  name: 'Delete Element',
  category: 'web',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'target', name: 'Target', type: 'string' }],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  execute(ctx) {
    const el = document.querySelector(ctx.getInput('target'));
    if (!el) throw new Error(`Element "${ctx.getInput('target')}" not found`);
    el.remove();
    ctx.triggerOutput('exec');
  },
});
