/**
 * Math nodes — arithmetic operations.
 */
const reg = (def) => globalThis.__nf_registry?.register(def);

reg({
  type: 'math.add',
  name: 'Add',
  category: 'math',
  inputs: [{ id: 'a', name: 'A', type: 'number' }, { id: 'b', name: 'B', type: 'number' }],
  outputs: [{ id: 'result', name: 'Result', type: 'number' }],
  execute(ctx) { ctx.setOutput('result', (ctx.getInput('a') ?? 0) + (ctx.getInput('b') ?? 0)); },
});

reg({
  type: 'math.subtract',
  name: 'Subtract',
  category: 'math',
  inputs: [{ id: 'a', name: 'A', type: 'number' }, { id: 'b', name: 'B', type: 'number' }],
  outputs: [{ id: 'result', name: 'Result', type: 'number' }],
  execute(ctx) { ctx.setOutput('result', (ctx.getInput('a') ?? 0) - (ctx.getInput('b') ?? 0)); },
});

reg({
  type: 'math.multiply',
  name: 'Multiply',
  category: 'math',
  inputs: [{ id: 'a', name: 'A', type: 'number' }, { id: 'b', name: 'B', type: 'number' }],
  outputs: [{ id: 'result', name: 'Result', type: 'number' }],
  execute(ctx) { ctx.setOutput('result', (ctx.getInput('a') ?? 0) * (ctx.getInput('b') ?? 0)); },
});

reg({
  type: 'math.divide',
  name: 'Divide',
  category: 'math',
  inputs: [{ id: 'a', name: 'A', type: 'number' }, { id: 'b', name: 'B', type: 'number' }],
  outputs: [{ id: 'result', name: 'Result', type: 'number' }],
  execute(ctx) {
    const b = ctx.getInput('b') ?? 1;
    if (b === 0) throw new Error('Division by zero');
    ctx.setOutput('result', (ctx.getInput('a') ?? 0) / b);
  },
});

reg({
  type: 'math.random',
  name: 'Random',
  category: 'math',
  inputs: [{ id: 'min', name: 'Min', type: 'number' }, { id: 'max', name: 'Max', type: 'number' }],
  outputs: [{ id: 'result', name: 'Result', type: 'number' }],
  execute(ctx) {
    const min = ctx.getInput('min') ?? 0;
    const max = ctx.getInput('max') ?? 100;
    ctx.setOutput('result', Math.floor(Math.random() * (max - min + 1)) + min);
  },
});
