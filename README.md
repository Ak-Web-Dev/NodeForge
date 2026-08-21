# NodeForge
JS on Nodes!
----
# NodeForge — Project Specification

## 1. Project Overview

Build a browser-based visual programming environment called **NodeForge**.

The core idea is:

> **Scratch uses blocks. NodeForge uses nodes.**

Users should be able to create programs visually by placing nodes on an infinite canvas and connecting them together. The nodes represent programming operations, events, data, logic, mathematics, and eventually web/DOM operations.

This is intended as a polished Hack Club Stardance project, not merely a prototype or toy.

The application should feel like a lightweight visual programming IDE.

---

# 2. Technology

Use:

* Vite
* Vanilla JavaScript / modern ES modules
* HTML
* CSS
* SVG for connections
* No React
* No unnecessary frameworks
* No backend for the initial version
* localStorage initially for project persistence

Use modern JavaScript features and keep the code modular.

Do not put the entire application into one JavaScript file.

---

# 3. Main Application Layout

The application should have a layout similar to a visual programming IDE:

```text
┌───────────────────────────────────────────────────────────────┐
│ NodeForge   File   Edit   View      ▶ Run   </> Code         │
├──────────────┬────────────────────────────────────┬───────────┤
│              │                                    │           │
│ NODE LIBRARY │          INFINITE CANVAS           │ INSPECTOR │
│              │                                    │           │
│ Events       │                                    │           │
│ Logic        │        [ NODE ]                    │ Selected  │
│ Math         │             │                      │ Node      │
│ Data         │             ▼                      │           │
│ Flow         │        [ NODE ]                    │ Properties│
│ Web          │                                    │           │
├──────────────┴────────────────────────────────────┴───────────┤
│ Console / Status                                              │
└───────────────────────────────────────────────────────────────┘
```

The central canvas is the main focus.

The UI should be clean, modern, dark, and developer-oriented without becoming excessively complicated.

---

# 4. Core Architecture

Separate the application into these major systems:

```text
Editor
 ├── Canvas
 ├── Camera
 ├── Selection
 └── Connections

Node System
 ├── Node
 ├── Node Registry
 └── Node Types

Execution Engine
 ├── Executor
 ├── Runtime
 └── Compiler

Project System
 ├── Serialization
 └── Storage

UI
 ├── Node Library
 ├── Inspector
 ├── Toolbar
 └── Console
```

Suggested structure:

```text
src/
├── main.js
│
├── editor/
│   ├── Canvas.js
│   ├── Camera.js
│   ├── Selection.js
│   └── Connections.js
│
├── nodes/
│   ├── Node.js
│   ├── NodeRegistry.js
│   └── types/
│       ├── events.js
│       ├── data.js
│       ├── math.js
│       ├── logic.js
│       ├── flow.js
│       └── web.js
│
├── engine/
│   ├── Executor.js
│   ├── Runtime.js
│   └── Compiler.js
│
├── project/
│   ├── Serializer.js
│   └── Storage.js
│
└── ui/
    ├── Sidebar.js
    ├── Inspector.js
    ├── Toolbar.js
    └── Console.js
```

The exact filenames can be adjusted if there is a better architecture, but maintain clear separation of responsibilities.

---

# 5. Node Architecture

Do not hard-code node behavior directly into the editor.

Create a generic node registry.

Conceptually, a node definition should contain:

```js
{
    type: "math.add",
    name: "Add",
    category: "Math",

    inputs: [
        { name: "A", type: "number" },
        { name: "B", type: "number" }
    ],

    outputs: [
        { name: "Result", type: "number" }
    ],

    execute(inputs) {
        return inputs.A + inputs.B;
    }
}
```

The actual architecture can differ, but the important requirement is that new nodes can be registered without modifying the core editor.

The editor should treat nodes generically.

---

# 6. Node Types

Start with a small but functional set.

## Events

* On Start
* On Click
* On Key Press

## Data

* Number
* String
* Boolean
* Variable
* Get Variable
* Set Variable

## Math

* Add
* Subtract
* Multiply
* Divide
* Random

## Logic

* If
* Compare
* AND
* OR
* NOT

## Flow

* Sequence
* Wait
* Repeat

## Web

Initially:

* Create Element
* Set Text
* Set Style
* Delete Element

Do not implement dozens of nodes immediately. Make a small number work extremely well first.

---

# 7. Ports

Nodes must have ports.

Ports represent either:

### Data flow

Example:

```text
[Number: 10] ─────→ [Add]
```

### Execution flow

Example:

```text
[On Click] ═══════→ [Set Text]
```

Clearly distinguish execution connections from data connections visually.

Connections should only be allowed when the types are compatible.

For example:

```text
Number → Number
String → String
Boolean → Boolean
```

Invalid connections should be rejected or clearly indicated.

---

# 8. Canvas

The canvas should behave like an infinite node editor.

Implement:

* Node dragging
* Canvas panning
* Zooming
* Node selection
* Multi-selection if practical
* Delete
* Duplicate
* Copy/paste if practical
* Grid
* Snap-to-grid if practical
* Connection creation
* Connection deletion
* Selection highlighting

Use SVG for connections.

Nodes can be regular HTML elements positioned over the SVG layer.

Conceptually:

```text
HTML layer
 ├── Node
 ├── Node
 └── Node

SVG layer
 ├── Connection
 ├── Connection
 └── Connection
```

Connections should update dynamically when nodes move.

Use curved paths rather than simple straight lines if practical.

---

# 9. Camera System

The canvas should have a virtual camera with:

```text
x
y
zoom
```

Nodes should exist in world coordinates rather than being permanently tied to screen coordinates.

This will make zooming and panning reliable.

Mouse interactions should correctly convert between:

```text
screen coordinates
        ↓
world coordinates
```

---

# 10. Node Interaction

Users should be able to:

* Drag nodes
* Select nodes
* Move nodes
* Connect ports
* Delete nodes
* Duplicate nodes
* Open node properties
* Change editable values

Dragging from a port should display a temporary connection following the cursor.

Dropping onto a compatible port should create the connection.

---

# 11. Inspector

When a node is selected, show its editable properties on the right.

For example:

```text
SELECTED NODE

Set Text

Text
[ Hello World ]

Element
[ #player ]

────────────────

Type
Web / DOM
```

The inspector should be generated from node metadata where practical instead of being individually hard-coded for every node.

---

# 12. Node Library

The left sidebar should contain searchable node categories.

Example:

```text
SEARCH NODES...

EVENTS
  On Start
  On Click
  Key Press

LOGIC
  If
  Compare
  AND
  OR

MATH
  Add
  Subtract
  Multiply
  Divide

DATA
  Number
  String
  Boolean
  Variable

WEB
  Create Element
  Set Text
  Set Style
```

Dragging a node from the library onto the canvas should create an instance.

Also allow double-clicking a node type to create it at the center of the current viewport.

---

# 13. Project Data Model

Do not save the project as HTML.

Represent the graph as serializable JSON.

Example:

```js
{
    version: 1,

    nodes: [
        {
            id: "node-1",
            type: "event.start",
            x: 200,
            y: 150,
            data: {}
        },

        {
            id: "node-2",
            type: "math.add",
            x: 500,
            y: 150,
            data: {}
        }
    ],

    connections: [
        {
            id: "connection-1",
            fromNode: "node-1",
            fromPort: "exec",
            toNode: "node-2",
            toPort: "exec"
        }
    ]
}
```

The format should be versioned so it can be upgraded later.

---

# 14. Saving

Initially use localStorage.

Implement:

* New Project
* Save
* Save As if practical
* Load
* Autosave
* Reset

Later support:

```text
Export .nodeforge
Import .nodeforge
```

The exported project should be a JSON-based file.

---

# 15. Execution Engine

This is one of the most important parts of the application.

The graph must actually execute.

Do not fake execution by simply highlighting nodes.

Execution should follow the graph.

For example:

```text
[ON START]
     │
     ▼
[SET VARIABLE]
     │
     ▼
[IF]
   ┌─┴─┐
 YES   NO
  │     │
  ▼     ▼
[MOVE] [WAIT]
```

The executor should understand:

* Execution flow
* Data flow
* Variables
* Conditions
* Loops
* Node outputs
* Node state

The architecture should allow new node types to define their own execution behavior.

---

# 16. Runtime Visualization

When a project is running, visually indicate the current execution state.

For example:

```text
[ON START] 🟢
     │
     ▼
[SET VALUE] 🟢
     │
     ▼
[IF] 🟡
```

Animate the execution signal travelling along connections if practical.

This is a major visual feature and should make the system feel alive.

Do not sacrifice core functionality for fancy animation, though.

---

# 17. Playground

Create a separate runtime/playground area where web-related nodes can affect actual DOM elements.

For example:

```text
[ON CLICK]
     │
     ▼
[SET TEXT]
     │
     ▼
[SET COLOR]
```

could control an element in the playground.

The playground should demonstrate that the nodes are actually programming something.

Eventually it should be possible to make small interactive experiences.

---

# 18. JavaScript Compiler

Add a:

```text
</> VIEW CODE
```

button.

The graph should be convertible into readable JavaScript where possible.

For example:

```text
[10] ──→ [ADD] ←── [20]
```

should produce something conceptually like:

```js
const result = 10 + 20;
```

And:

```text
[ON CLICK]
     ↓
[SET TEXT]
```

could produce:

```js
element.addEventListener("click", () => {
    element.textContent = "Hello";
});
```

The generated code should be formatted and readable.

Do not make the generated code intentionally complicated.

---

# 19. Console

Add a small console/status area.

It should show:

```text
Project loaded
Node created
Running...
Program finished
Error: incompatible connection
```

Node execution errors should be understandable.

Avoid exposing raw JavaScript errors without context.

For example:

Bad:

```text
TypeError: Cannot read properties of undefined...
```

Better:

```text
Node "Set Text" failed:
The target element does not exist.
```

---

# 20. Error Handling

The editor should prevent obvious invalid states.

Examples:

* Invalid connection types
* Missing required inputs
* Circular execution where unsupported
* Missing variables
* Invalid DOM targets

Show useful error messages.

Never allow an error in one node to completely destroy the editor.

---

# 21. Undo / Redo

Implement an undo/redo history.

At minimum support:

* Create node
* Delete node
* Move node
* Connect
* Disconnect
* Change node property

Keyboard shortcuts:

```text
Ctrl + Z
Ctrl + Shift + Z
```

Avoid recording every tiny mouse movement as a separate undo step. Group drag operations into one action.

---

# 22. Keyboard Shortcuts

Implement useful shortcuts:

```text
Ctrl + Z          Undo
Ctrl + Shift + Z  Redo
Delete            Delete selected
Ctrl + C          Copy
Ctrl + V          Paste
Ctrl + D          Duplicate
Ctrl + S          Save
Space + Drag      Pan
Mouse Wheel       Zoom
Escape            Cancel connection
```

Add a shortcut/help menu later.

---

# 23. Minimap

Once the canvas is functional, add a small minimap in the bottom-right.

It should show:

```text
┌─────────────┐
│ • •         │
│    •••      │
│       •     │
│   ┌────┐    │
│   │VIEW│    │
│   └────┘    │
└─────────────┘
```

This is optional for the MVP.

---

# 24. Tutorial

The first launch should not dump the user onto an empty canvas without explanation.

Create an interactive tutorial.

Explain:

1. What nodes are
2. What ports are
3. How connections work
4. Difference between data and execution
5. How to run a program

The first tutorial should have the user build:

```text
[ON START]
     ↓
[SET TEXT]
```

Then run it.

The philosophy should be:

> Scratch uses blocks. NodeForge uses nodes.

---

# 25. Visual Design

Use a polished developer-tool aesthetic.

Dark interface.

Suggested characteristics:

* Dark background
* Slightly lighter panels
* Rounded node cards
* Clear node categories
* Colored node category accents
* Thin borders
* Subtle shadows
* Smooth transitions
* Clear typography
* Plenty of canvas space

Do not overuse gradients, glassmorphism, glowing effects, or animations.

The editor should prioritize usability over visual gimmicks.

---

# 26. Important UX Principle

The canvas should remain the focus.

Do not make the sidebar or inspector consume most of the screen.

Users should feel like they have a large workspace.

---

# 27. MVP Definition

Before adding advanced features, make this exact workflow work:

```text
Open NodeForge
       ↓
Create Number 10
       ↓
Create Number 20
       ↓
Create Add node
       ↓
Connect both numbers to Add
       ↓
Run
       ↓
Get 30
```

Then:

```text
On Start
   ↓
Set Text
   ↓
Playground displays "Hello World"
```

If these two workflows work reliably, the foundation is good.

---

# 28. Development Order

Build in this order.

### Phase 1

Create Vite project and application shell.

### Phase 2

Build canvas:

* pan
* zoom
* grid
* node positioning

### Phase 3

Build node system:

* Node class
* Node registry
* Node rendering
* ports

### Phase 4

Build SVG connections.

### Phase 5

Implement data flow.

Start with:

```text
Number → Add → Output
```

### Phase 6

Implement execution flow.

Start with:

```text
On Start → Output
```

### Phase 7

Add:

* variables
* If
* comparisons
* loops

### Phase 8

Add web/DOM nodes and playground.

### Phase 9

Add JavaScript generation.

### Phase 10

Add:

* save/load
* undo/redo
* keyboard shortcuts
* minimap
* tutorial
* polish

---

# 29. Do Not Overbuild Initially

Do NOT immediately implement:

* Multiplayer
* Accounts
* Cloud storage
* AI-generated nodes
* Plugin marketplace
* Real-time collaboration
* Full JavaScript parser
* Every possible programming construct
* Complex backend

These can be future ideas.

The first priority is:

> **A really good node editor with a genuinely working execution engine.**

---

# 30. Coding Standards

Keep the code:

* Modular
* Readable
* Commented where the reasoning is non-obvious
* Free of unnecessary dependencies
* Easy to extend

Avoid giant classes.

Avoid global variables where possible.

Avoid putting application state directly into random DOM elements.

Have a central project/editor state.

Use unique node IDs.

Keep serialization deterministic and stable.

Do not rewrite working systems unnecessarily.

---

# 31. Important Development Rule

Before implementing a feature, inspect the existing project and understand its current architecture.

Do not blindly overwrite files.

If the project already contains useful code, preserve and improve it.

After implementing a feature:

1. Run the project.
2. Check the browser console.
3. Test the feature manually.
4. Fix errors before moving on.
5. Keep the application runnable after every major step.

Do not leave the project in a half-working state between phases.

---

# 32. Final Goal

The finished NodeForge should feel like:

**Scratch + visual scripting + a lightweight web development environment.**

The user should be able to look at a graph and immediately understand:

```text
Event
  ↓
Logic
  ↓
Data
  ↓
Action
```

And then press **Run** and actually see it happen.

The core identity of the project is:

> **Scratch uses blocks. We use nodes.**
