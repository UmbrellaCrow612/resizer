# Resizer two

Small libary allows you to resize width or height or two elements with a resizer

Design:

- Used for onyl to elements
- Apply to a parent wrapper fo two elements
- Offers a handle to resize the flex of the two

Will not do:

- Hanbdle multiple chidren. Designed for two elements - you can make multiple clases in diffrent areas or components and use them in
  conjunction to get multiple resize areas that play with each other but the libary itself is aimed at two elements

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

          // Try to add again - this will throw an error
          // resize.add(target); // Uncommenting this will throw an error

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
    <title>Document</title>
  </head>
  <body>
    <div class="wrapper" id="resizer_container">
      <div>resize one</div>
      <div>resize two</div>
    </div>
  </body>
</html>
```

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


# Building 

Run 

- `npm run build:types`
- `remove other files from dist and leave .d file`
- `npm run build`