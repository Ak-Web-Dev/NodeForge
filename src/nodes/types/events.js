/**
 * Event nodes — entry points that trigger execution flow.
 */
const reg = (def) => globalThis.__nf_registry?.register(def);

reg({
  type: 'events.on_start',
  name: 'On Start',
  category: 'events',
  inputs: [],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  execute(ctx) { ctx.triggerOutput('exec'); },
});

reg({
  type: 'events.on_click',
  name: 'On Click',
  category: 'events',
  inputs: [],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  dataFields: [{ id: 'target', inputType: 'text', placeholder: 'e.g. #btn, .box', defaultValue: '#playground' }],
  execute(ctx) {
    const sel = ctx.getData('target') || '#playground';
    const el = document.querySelector(sel);
    if (el) el.addEventListener('click', () => ctx.triggerOutput('exec'));
  },
});

reg({
  type: 'events.on_key',
  name: 'On Key Press',
  category: 'events',
  inputs: [],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }, { id: 'key', name: 'Key', type: 'string' }],
  dataFields: [{ id: 'key', inputType: 'text', placeholder: 'e.g. Enter', defaultValue: 'Enter' }],
  execute(ctx) {
    const targetKey = ctx.getData('key') || 'Enter';
    document.addEventListener('keydown', (e) => {
      if (e.key === targetKey) {
        ctx.setOutput('key', e.key);
        ctx.triggerOutput('exec');
      }
    });
  },
});
