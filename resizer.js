/**
 * Represents a resizer
 */
class Resizer {
  /**
   * Holds a ref to the container that holds the resize elements
   * @type {HTMLElement | undefined}
   */
  #_parentContainer = undefined;

  /**
   * Options passed to change the resizer behaviour
   * @type {resizerOptions | undefined}
   */
  #_options = undefined;

  /**
   * The element created to used to change the size of a container
   * @type {HTMLDivElement | undefined}
   */
  #_handleElement = undefined;

  /**
   * Indicates if resizing is happening
   */
  #_isResizing = false;

  /**
   * The flex given to the first element defaults to one
   */
  #_flexOne = 1;

  /**
   * The flex given to the second element defaults to one
   */
  #_flexTwo = 1;

  /**
   * Create a default resizer or pass options
   * @param {resizerOptions} options - Set of options to change the resize behaviour
   */
  constructor(options = { direction: "horizontal", minFlex: 0.3 }) {
    this.#_options = options;

    this.#checkOptions(this.#_options);
  }

  /**
   * Add the resize handle and manage state of resize between elements
   * @param {HTMLElement} container - The container to add resize to, this holds the elements to be resized
   */
  add(container) {
    if (!container) {
      throw new Error("Container element not passed");
    }

    this.#_parentContainer = container;
    if (this.#_parentContainer.children.length != 2) {
      throw new Error("Container element contains more than two elements");
    }

    this.#addHandle();
  }

  /**
   * Remove the resize widget and any custom styles
   */
  remove() {
    if (!this.#_parentContainer) {
      throw new Error("No resizer added to a container");
    }

    // todo remove styles added to parent and remove styles added to children and the resizer handler
  }

  /**
   * Adds the resizer handle bar, listners and styles
   */
  #addHandle() {
    if (!this.#_parentContainer) {
      throw new Error("Container element not passed");
    }

    this.#_handleElement = document.createElement("div");
    this.#addHandleStyles();
    this.#addHandleListners();

    this.#addFlexToParentChildren();
    this.#addDisplayFlexDirectionToParent();

    this.#insertHandleIntoParent();
  }

  /**
   * Adds the styles to the handle element
   */
  #addHandleStyles() {
    if (!this.#_handleElement) {
      throw new Error("Handle element not found");
    }

    if (this.#_options?.direction === "horizontal") {
      this.#_handleElement.style.width = "10px";
      this.#_handleElement.style.cursor = "col-resize";
    } else {
      this.#_handleElement.style.height = "10px";
      this.#_handleElement.style.cursor = "row-resize";
    }

    this.#_handleElement.style.backgroundColor = "black";
  }

  #addHandleListners() {
    if (!this.#_handleElement) throw new Error("Handle element not found");
    if (!this.#_parentContainer) throw new Error("Container not found");

    const isHorizontal = this.#_options?.direction === "horizontal";

    this.#_handleElement.addEventListener("mousedown", (event) => {
      event.preventDefault();
      this.#_isResizing = true;
    });

    /** @param {MouseEvent} event  */
    const handleMouseMove = (event) => {
      if (!this.#_isResizing) return;
      if (!this.#_parentContainer) return;

      const containerRect = this.#_parentContainer.getBoundingClientRect();
      let position, totalSize;

      if (isHorizontal) {
        position = event.clientX - containerRect.left;
        totalSize = containerRect.width;
      } else {
        position = event.clientY - containerRect.top;
        totalSize = containerRect.height;
      }

      // Calculate the ratio for the first element
      const ratio = position / totalSize;

      // Apply min flex constraints
      const minFlex = this.#_options?.minFlex || 0.3;
      const maxFlex = 1 - minFlex;

      // Clamp the ratio between minFlex and maxFlex
      const clampedRatio = Math.max(minFlex, Math.min(maxFlex, ratio));

      // Calculate flex values
      this.#_flexOne = clampedRatio;
      this.#_flexTwo = 1 - clampedRatio;

      // Apply flex values to children
      const children = this.#_parentContainer.children;
      if (children[0] instanceof HTMLElement) {
        children[0].style.flex = this.#_flexOne.toString();
      }
      if (children[2] instanceof HTMLElement) {
        children[2].style.flex = this.#_flexTwo.toString();
      }
    };

    const handleMouseUp = () => {
      this.#_isResizing = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  /**
   * Adds the handle html element into the parent container
   */
  #insertHandleIntoParent() {
    if (!this.#_parentContainer) {
      throw new Error("No resizer added to a container");
    }

    if (!this.#_handleElement) {
      throw new Error("Handle element not found");
    }

    const children = this.#_parentContainer.children;
    this.#_parentContainer.insertBefore(this.#_handleElement, children[1]);
  }

  /**
   * Adds flex 1 to the children
   */
  #addFlexToParentChildren() {
    if (!this.#_parentContainer) {
      throw new Error("Container element not passed");
    }
    /** @type {any} */
    const children = this.#_parentContainer.children;

    for (let i = 0; i < children.length; i++) {
      /** @type {HTMLElement} */
      const child = children[i];

      child.style.flex = "1";
    }
  }

  /**
   * Adds display flex and `col` or default flex based on direction
   */
  #addDisplayFlexDirectionToParent() {
    if (!this.#_parentContainer) {
      throw new Error("Container element not passed");
    }

    this.#_parentContainer.style.display = "flex";

    if (this.#_options?.direction == "vertical") {
      this.#_parentContainer.style.flexDirection = "column";
    } else {
      this.#_parentContainer.style.flexDirection = "row";
    }
  }

  /**
   * Check if a flex number is greater than 0 and less than 1
   * @param {number} flexNumber - The flex number to check
   */
  #checkMinFlex(flexNumber) {
    if (flexNumber < 0) {
      throw new Error("Min flex must be greater than 0");
    }
    if (flexNumber > 1) {
      throw new Error("Min flex must be greater than 1");
    }
  }

  /**
   * Check if a direction is valid one
   * @param {any} direction The direction to check
   */
  #checkDirection(direction) {
    /** @type {resizerDirection} */
    let h = "horizontal";
    /** @type {resizerDirection} */
    let v = "vertical";

    let valid = new Set([h, v]);

    if (!valid.has(direction)) {
      throw new Error("Direction is not vertical or horizontal");
    }
  }

  /**
   * Checks if options passed confirm to our constraints
   * @param {resizerOptions} options - The options to check
   */
  #checkOptions(options) {
    this.#checkMinFlex(options.minFlex);
    this.#checkDirection(options.direction);
  }
}

// Usage example

setTimeout(() => {
  var resize = new Resizer({ direction: "horizontal", minFlex: 0.3 });

  let target = document.getElementById("resizer_container");
  if (target) {
    resize.add(target);
    console.log("added");
  } else {
    console.log("Not found");
  }
}, 200);

// pass options to contructor lie direction etc
// call open
// open adds the widget in the middle
// add event listner
