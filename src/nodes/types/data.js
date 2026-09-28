/**
 * Data nodes — constants, variables, and output.
 */
const reg = (def) => globalThis.__nf_registry?.register(def);

reg({
  type: 'data.number',
  name: 'Number',
  category: 'data',
  inputs: [],
  outputs: [{ id: 'value', name: 'Value', type: 'number' }],
  dataFields: [{ id: 'value', inputType: 'number', defaultValue: 0 }],
  execute(ctx) { ctx.setOutput('value', ctx.getData('value') ?? 0); },
});

reg({
  type: 'data.string',
  name: 'String',
  category: 'data',
  inputs: [],
  outputs: [{ id: 'value', name: 'Value', type: 'string' }],
  dataFields: [{ id: 'value', inputType: 'text', defaultValue: '', placeholder: 'text...' }],
  execute(ctx) { ctx.setOutput('value', ctx.getData('value') ?? ''); },
});

reg({
  type: 'data.boolean',
  name: 'Boolean',
  category: 'data',
  inputs: [],
  outputs: [{ id: 'value', name: 'Value', type: 'boolean' }],
  dataFields: [{ id: 'value', inputType: 'text', defaultValue: 'true', placeholder: 'true / false' }],
  execute(ctx) {
    const v = ctx.getData('value');
    ctx.setOutput('value', v === 'true' || v === true);
  },
});

reg({
  type: 'data.print',
  name: 'Print',
  category: 'data',
  inputs: [
    { id: 'exec', name: '←', type: 'exec' },
    { id: 'value', name: 'Value', type: 'any' },
  ],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  execute(ctx) {
    const val = ctx.getInput('value');
    globalThis.__nf_state?.bus?.emit('console:log', `Output: ${JSON.stringify(val)}`);
    ctx.triggerOutput('exec');
  },
});

reg({
  type: 'data.set_variable',
  name: 'Set Variable',
  category: 'data',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }, { id: 'value', name: 'Value', type: 'any' }],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }],
  dataFields: [{ id: 'name', inputType: 'text', defaultValue: 'myVar', placeholder: 'variable name' }],
  execute(ctx) {
    ctx.setVariable(ctx.getData('name'), ctx.getInput('value'));
    ctx.triggerOutput('exec');
  },
});

reg({
  type: 'data.get_variable',
  name: 'Get Variable',
  category: 'data',
  inputs: [],
  outputs: [{ id: 'value', name: 'Value', type: 'any' }],
  dataFields: [{ id: 'name', inputType: 'text', defaultValue: 'myVar', placeholder: 'variable name' }],
  execute(ctx) { ctx.setOutput('value', ctx.getVariable(ctx.getData('name'))); },
});

reg({
  type: 'data.prompt_number',
  name: 'Prompt Number',
  category: 'data',
  inputs: [{ id: 'exec', name: '←', type: 'exec' }],
  outputs: [{ id: 'exec', name: '→', type: 'exec' }, { id: 'value', name: 'Number', type: 'number' }],
  dataFields: [{ id: 'message', inputType: 'text', defaultValue: 'Enter a number:', placeholder: 'prompt message' }],
  execute(ctx) {
    const msg = ctx.getData('message') || 'Enter a number:';
    const raw = window.prompt(msg, '');
    const num = raw === null ? 0 : Number(raw);
    ctx.setOutput('value', isNaN(num) ? 0 : num);
    ctx.triggerOutput('exec');
  },
});
