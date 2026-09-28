/**
 * Flow nodes — execution flow control.
 */
const reg = (def) => globalThis.__nf_registry?.register(def);

reg({
  type: 'flow.sequence',
  name: 'Sequence',
  category: 'flow',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }],
  outputs: [{ id: 'a', name: '1 →', type: 'exec' }, { id: 'b', name: '2 →', type: 'exec' }, { id: 'c', name: '3 →', type: 'exec' }],
  execute(ctx) { ctx.triggerOutput('a'); ctx.triggerOutput('b'); ctx.triggerOutput('c'); },
});

reg({
  type: 'flow.wait',
  name: 'Wait',
  category: 'flow',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'duration', name: 'Sec', type: 'number' }],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  dataFields: [{ id: 'duration', inputType: 'number', defaultValue: 1 }],
  execute(ctx) {
    const secs = ctx.getInput('duration') ?? ctx.getData('duration') ?? 1;
    return new Promise((resolve) => {
      setTimeout(() => { ctx.triggerOutput('exec'); resolve(); }, secs * 1000);
    });
  },
});

reg({
  type: 'flow.repeat',
  name: 'Repeat',
  category: 'flow',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'count', name: 'Count', type: 'number' }],
  outputs: [{ id: 'body', name: 'Loop →', type: 'exec' }, { id: 'done', name: 'Done →', type: 'exec' }],
  dataFields: [{ id: 'count', inputType: 'number', defaultValue: 3 }],
  execute(ctx) {
    const count = ctx.getInput('count') ?? ctx.getData('count') ?? 3;
    return (async () => {
      for (let i = 0; i < count; i++) await ctx.triggerOutput('body');
      ctx.triggerOutput('done');
    })();
  },
});
