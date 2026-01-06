# umbr-resizer-two

A lightweight, zero-dependency TypeScript library that automatically manages a resizable handle between two children in a container. It uses a `MutationObserver` to stay active even if panels are dynamically added or removed.

## Installation

```bash
npm install umbr-resizer-two
```

---

## Features

* **Dynamic Detection**: Automatically injects a resizer handle when exactly two children are present.
* **Flex-Based**: Uses CSS flexbox for smooth, responsive layouts.
* **Directional Support**: Supports both `horizontal` (columns) and `vertical` (rows) resizing.
* **State Persistence**: Easily save and restore panel sizes using callbacks.
* **Highly Customizable**: Pass custom CSS properties directly to the resizer handle.

---

## Quick Start

### HTML Structure

You only need a container with two child elements.

```html
<div id="container">
  <div class="panel">Panel 1</div>
  <div class="panel">Panel 2</div>
</div>

```

### Initialization

```javascript
import { ResizerTwo } from 'umbr-resizer-two';

const container = document.getElementById("container");

const resizer = new ResizerTwo({
  container: container,
  direction: "horizontal", // or "vertical"
  minFlex: { firstChild: 0.1, secondChild: 0.1 },
  handleStyles: {
    width: "5px",
    backgroundColor: "#555",
    cursor: "col-resize",
  },
  initalFlex: { firstChild: 1, secondChild: 1 }, 
});

// Save the state when the user finishes resizing
resizer.on(() => {
  const currentValues = resizer.getFlexValues();
  localStorage.setItem('my_layout', JSON.stringify(currentValues));
});

```

---

## Options API

| Property | Type | Description |
| --- | --- | --- |
| `container` | `HTMLDivElement` | The parent element containing the two panels. |
| `direction` | `"horizontal" | "vertical"` | The flow of the children. |
| `minFlex` | `ResizerTwoChildrenFlex` | The minimum flex value allowed for each child. |
| `initalFlex` | `ResizerTwoChildrenFlex` | (Optional) The starting flex values for the panels. |
| `handleStyles` | `Record<string, string>` | CSS key-value pairs to style the resizer handle. |

---

## Methods

* **`on(callback: () => void)`**: Adds a listener that fires whenever the panels are resized.
* **`getFlexValues()`**: Returns the current flex values for both children.
* **`remove(callback: () => void)`**: Removes a specific listener.
* **`dispose()`**: Cleans up the mutation observer, event listeners, and removes the handle from the DOM.