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

## 🧠 Example Usage

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="styles.css" />
    <script src="./src/resizerTwo.js"></script>

    <script>
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

          // Uncommenting this will throw an error (already added)
          // resize.add(target);

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
    <title>Resizer Two Example</title>
  </head>
  <body>
    <div class="wrapper" id="resizer_container">
      <div>resize one</div>
      <div>resize two</div>
    </div>
  </body>
</html>
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

## ⚙️ Building

1. Generate TypeScript types

   ```bash
   npm run build:types
   ```

- Copy over the resizer js file into dist

2. Check your package contents

   ```bash
   npm pack
   ```

   → Ensure it only includes your JS and `.d.ts` files.

3. Publish to npm

   ```bash
   npm publish --access public
   ```

_(Remember to bump the version before publishing new releases!)_
