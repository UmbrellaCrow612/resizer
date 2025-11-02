# Resizer Two

A small, dependency-free library that allows you to resize the width or height of **two elements** using a resizable handle.

---

## 🧩 Design

- Designed specifically for **two elements only**
- Apply it to a **parent wrapper** containing the two elements
- Provides a **handle** to resize the flex ratio between them

---

## 🚫 Limitations

- ❌ Does **not** handle multiple children — it’s strictly for two elements
- You can, however, create **multiple instances** of `ResizerTwo` in different containers or components to achieve complex multi-pane layouts

---

## 🧠 Example Usage (via npm)

### 1️⃣ Install the package

```bash
npm install umbr-resizer-two
```

### 2️⃣ Import and use it

#### **In HTML (via CDN or local build)**

If you want to use it directly in a browser, include it via CDN or your built bundle:

```html
<script type="module">
  import { ResizerTwo } from "umbr-resizer-two";

  document.addEventListener("DOMContentLoaded", () => {
    const resize = new ResizerTwo({
      direction: "vertical",
      minFlex: 0.3,
    });

    const target = document.getElementById("resizer_container");
    if (target) {
      resize.add(target);
      console.log("Resizer added.");
      console.log("Initial flex values:", resize.getFlexValues());

      setTimeout(() => {
        console.log("Current flex values:", resize.getFlexValues());
        resize.remove();
        console.log("Resizer removed.");
      }, 10000);
    } else {
      console.error("Container element not found.");
    }
  });
</script>

<div class="wrapper" id="resizer_container">
  <div>resize one</div>
  <div>resize two</div>
</div>
```

---

#### **In JavaScript / TypeScript project**

```js
import { ResizerTwo } from "umbr-resizer-two";

const resize = new ResizerTwo({
  direction: "horizontal", // or "vertical"
  minFlex: 0.2,
});

const container = document.getElementById("resizer_container");
resize.add(container);
```

---

### Example CSS

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  display: flex;
  min-height: 0;
  min-width: 0;
}

.wrapper {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
```

---

## ⚙️ Building Locally

1. Build the distribution bundle

   ```bash
   npm run build
   ```

2. Verify your package contents

   ```bash
   npm pack
   ```

   → Ensure it only includes your JS and `.d.ts` files.

3. Bump the version before publishing

   ```bash
   npm version patch
   ```

4. Publish to npm

   ```bash
   npm publish --access public
   ```

---
