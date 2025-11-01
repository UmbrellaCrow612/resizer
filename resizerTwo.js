/**
 * Represents a resizer this is used to resize the width / or height of two container next to each other
 * used when you have two elements next to each other and want to allow the change width or height of said elements
 */
class ResizerTwo {
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
   * The element created to used to change the size child one and child two width of height
   * @type {HTMLDivElement | undefined}
   */
  #_handleElement = undefined;

  /**
   * Indicates if resizing is happening
   */
  #_isResizing = false;

  /**
   * Tracks if the resizer is currently added to a container
   */
  #_isAdded = false;

  /**
   * The flex given to the first element defaults to one
   */
  #_flexOne = 1;

  /**
   * The flex given to the second element defaults to one
   */
  #_flexTwo = 1;

  /**
   * Holds references to the event listeners for cleanup
   * @type {((event: MouseEvent) => void) | null}
   */
  #_mouseMoveHandler = null;
  /**
   * Holds references to the event listeners for cleanup
   * @type {((event: MouseEvent) => void) | null}
   */
  #_mouseUpHandler = null;

  /**
   * Represents the first child in the resizer
   * @type {HTMLElement | undefined}
   */
  #_childOne = undefined;

  /**
   * Represents the second child in the resizer
   * @type {HTMLElement | undefined}
   */
  #_childTwo = undefined;

  /**
   * Create a default resizer or pass options
   * @param {resizerOptions} options - Set of options to change the resize behaviour
   */
  constructor(
    options = { direction: "horizontal", minFlex: 0.3, handleStyles: {} }
  ) {
    this.#_options = {
      direction: options.direction || "horizontal",
      minFlex: options.minFlex || 0.3,
      handleStyles: options.handleStyles || {},
    };
    this.#checkOptions(this.#_options);
  }

  /**
   * Add the resize handle and manage state of resize between elements
   * @param {HTMLElement} container - The container to add resize to, this holds the elements to be resized
   */
  add(container) {
    if (this.#_isAdded) {
      throw new Error(
        "Resizer is already added to a container. Call remove() first."
      );
    }

    if (!container) {
      throw new Error("Container element not passed");
    }

    this.#_parentContainer = container;
    if (this.#_parentContainer.children.length != 2) {
      throw new Error("Container element must contain exactly two elements");
    }
    this.#setChildrenElements();

    this.#addHandle();
    this.#_isAdded = true;
  }

  /**
   * Sets the child one and child two elements to the two elements in the resizer
   */
  #setChildrenElements() {
    if (!this.#_parentContainer) {
      throw new Error("Container element not passed");
    }

    /** @type {any} */
    const children = this.#_parentContainer.children;

    this.#_childOne = children[0];
    this.#_childTwo = children[1];
  }

  /**
   * Remove the resize widget and any custom styles
   */
  remove() {
    if (!this.#_parentContainer || !this.#_isAdded) {
      throw new Error("No resizer added to a container");
    }

    // Remove event listeners
    if (this.#_mouseMoveHandler) {
      document.removeEventListener("mousemove", this.#_mouseMoveHandler);
      this.#_mouseMoveHandler = null;
    }
    if (this.#_mouseUpHandler) {
      document.removeEventListener("mouseup", this.#_mouseUpHandler);
      this.#_mouseUpHandler = null;
    }

    // Remove the handle element from DOM
    if (this.#_handleElement && this.#_handleElement.parentNode) {
      this.#_handleElement.parentNode.removeChild(this.#_handleElement);
      this.#_handleElement = undefined;
    }

    // Remove flex styles from children
    if (this.#_childOne) {
      this.#_childOne.style.flex = "";
    }
    if (this.#_childTwo) {
      this.#_childTwo.style.flex = "";
    }

    // Remove flex display styles from parent
    this.#_parentContainer.style.display = "";
    this.#_parentContainer.style.flexDirection = "";

    // Reset state
    this.#_isResizing = false;
    this.#_flexOne = 1;
    this.#_flexTwo = 1;
    this.#_childOne = undefined;
    this.#_childTwo = undefined;
    this.#_parentContainer = undefined;
    this.#_isAdded = false;
  }

  /**
   * Get the current flex values of the two elements
   * @returns {{flexOne: number, flexTwo: number}} The current flex values
   */
  getFlexValues() {
    return {
      flexOne: this.#_flexOne,
      flexTwo: this.#_flexTwo,
    };
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

    const customStyles = this.#_options?.handleStyles || {};

    // Apply default styles based on direction
    if (this.#_options?.direction === "horizontal") {
      this.#_handleElement.style.width = customStyles.width || "10px";
      this.#_handleElement.style.cursor = customStyles.cursor || "col-resize";
    } else {
      this.#_handleElement.style.height = customStyles.height || "10px";
      this.#_handleElement.style.cursor = customStyles.cursor || "row-resize";
    }

    this.#_handleElement.style.backgroundColor =
      customStyles.backgroundColor || "black";

    Object.keys(customStyles).forEach((property) => {
      if (
        property !== "width" &&
        property !== "height" &&
        property !== "backgroundColor" &&
        property !== "cursor"
      ) {
        // @ts-ignore
        this.#_handleElement.style[property] = customStyles[property];
      }
    });
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
    const mouseMoveHandler = (event) => {
      if (!this.#_isResizing) return;
      if (!this.#_parentContainer) return;
      if (!this.#_childOne || !this.#_childTwo) return;

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
      this.#_childOne.style.flex = this.#_flexOne.toString();
      this.#_childTwo.style.flex = this.#_flexTwo.toString();
    };

    const mouseUpHandler = () => {
      this.#_isResizing = false;
    };

    this.#_mouseMoveHandler = mouseMoveHandler;
    this.#_mouseUpHandler = mouseUpHandler;

    document.addEventListener("mousemove", this.#_mouseMoveHandler);
    document.addEventListener("mouseup", this.#_mouseUpHandler);
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

    if (!this.#_childTwo) {
      throw new Error(
        "Could not find the second HTML element within the container"
      );
    }

    this.#_parentContainer.insertBefore(this.#_handleElement, this.#_childTwo);
  }

  /**
   * Adds flex 1 to the child one and two
   */
  #addFlexToParentChildren() {
    if (!this.#_childOne || !this.#_childTwo) {
      throw new Error(
        "Could not find the first or second element within the container"
      );
    }

    this.#_childOne.style.flex = "1";
    this.#_childTwo.style.flex = "1";
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
      throw new Error("Min flex must be less than 1");
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
document.addEventListener("DOMContentLoaded", () => {
  const resize = new ResizerTwo({
    direction: "vertical",
    minFlex: 0.3,
    handleStyles: {
      width: "15px",
      backgroundColor: "#3b82f6",
      cursor: "col-resize",
      borderRadius: "4px",
      boxShadow: "0 0 5px rgba(0,0,0,0.3)",
      opacity: "0.8",
      transition: "background-color 0.2s ease",
    },
  });

  const target = document.getElementById("resizer_container");
  if (target) {
    resize.add(target);
    console.log("Resizer added");
    console.log("Initial flex values:", resize.getFlexValues());

    // Try to add again - this will throw an error
    // resize.add(target); // Uncommenting this will throw an error

    setTimeout(() => {
      console.log("Current flex values:", resize.getFlexValues());
      resize.remove();
      console.log("Resizer removed");
    }, 10000);
  } else {
    console.error("Container element not found");
  }
});
