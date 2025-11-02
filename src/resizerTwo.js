/**
 * Represents a resizer that is used to resize the width or height of two adjacent containers.
 */
class ResizerTwo {
  /**
   * Holds a reference to the container that holds the elements to be resized.
   * @type {HTMLElement | undefined}
   */
  #_parentContainer = undefined;

  /**
   * Options passed to change the resizer's behavior.
   * @type {import("./types.js").resizerTwoOptions | undefined}
   */
  #_options = undefined;

  /**
   * The handle element created and used to change the width or height of the two child elements.
   * @type {HTMLDivElement | undefined}
   */
  #_handleElement = undefined;

  /**
   * Indicates if resizing is happening.
   */
  #_isResizing = false;

  /**
   * Tracks if the resizer is currently added to a container.
   */
  #_isAdded = false;

  /**
   * The flex value given to the first element; defaults to 1.
   */
  #_flexOne = 1;

  /**
   * The flex value given to the second element; defaults to 1.
   */
  #_flexTwo = 1;

  /**
   * Holds a reference to the mouse move event listener for cleanup.
   * @type {((event: MouseEvent) => void) | null}
   */
  #_mouseMoveHandler = null;
  /**
   * Holds a reference to the mouse up event listener for cleanup.
   * @type {((event: MouseEvent) => void) | null}
   */
  #_mouseUpHandler = null;

  /**
   * Represents the first child in the resizer.
   * @type {HTMLElement | undefined}
   */
  #_childOne = undefined;

  /**
   * Represents the second child in the resizer.
   * @type {HTMLElement | undefined}
   */
  #_childTwo = undefined;

  /**
   * A Set of callbacks to run when the resize logic is run.
   * @type {Set<import("./types.js").resizerTwoCallback>}
   */
  #_onResizeCallbacks = new Set();

  /**
   * Creates a default resizer or configures one with the provided options.
   * @param {import("./types.js").resizerTwoOptions} options - A set of options to change the resize behavior.
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
   * Adds the resize handle and manages the resizing state between the two elements.
   * @param {HTMLElement} container - The container to add the resizer to, which must hold exactly two child elements.
   */
  add(container) {
    if (this.#_isAdded) {
      throw new Error(
        "Resizer is already added to a container. Call remove() first."
      );
    }

    if (!container) {
      throw new Error("Container element not passed.");
    }

    this.#_parentContainer = container;
    if (this.#_parentContainer.children.length !== 2) {
      throw new Error("Container element must contain exactly two children.");
    }
    this.#setChildrenElements();

    this.#addHandle();
    this.#_isAdded = true;
  }

  /**
   * Finds and sets the internal references to the two child elements within the parent container.
   */
  #setChildrenElements() {
    if (!this.#_parentContainer) {
      throw new Error("Container element not passed.");
    }

    /** @type {any} */
    const children = this.#_parentContainer.children;

    this.#_childOne = children[0];
    this.#_childTwo = children[1];
  }

  /**
   * Removes the resizer handle, event listeners, and custom styles from the container.
   */
  remove() {
    if (!this.#_parentContainer || !this.#_isAdded) {
      throw new Error("No resizer has been added to a container.");
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

    // Remove the handle element from the DOM
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
    this.#_childOne = undefined;
    this.#_childTwo = undefined;
    this.#_parentContainer = undefined;
    this.#_onResizeCallbacks = new Set();
    this.#_isAdded = false;
  }

  /**
   * Registers a callback function to be executed when a resize event occurs.
   * @param {import("./types.js").resizerTwoCallback} callback
   * @returns {(() => void)} An unsubscribe function that removes the registered callback.
   */
  onResize(callback) {
    this.#_onResizeCallbacks.add(callback);

    return () => this.#_onResizeCallbacks.delete(callback);
  }

  /**
   * Gets the current flex values of the two elements.
   * @returns {{flexOne: number, flexTwo: number}} The current flex values.
   */
  getFlexValues() {
    return {
      flexOne: this.#_flexOne,
      flexTwo: this.#_flexTwo,
    };
  }

  /**
   * Adds the resizer handle, listeners, and styles.
   */
  #addHandle() {
    if (!this.#_parentContainer) {
      throw new Error("Container element not passed.");
    }

    this.#_handleElement = document.createElement("div");
    this.#addHandleStyles();
    this.#addHandleListeners();

    this.#addFlexToParentChildren();
    this.#addDisplayFlexDirectionToParent();

    this.#insertHandleIntoParent();
  }

  /**
   * Adds the styles to the handle element.
   */
  #addHandleStyles() {
    if (!this.#_handleElement) {
      throw new Error("Handle element not found.");
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

  /**
   * Adds the mousedown, mousemove, and mouseup event listeners for resizing logic.
   */
  #addHandleListeners() {
    if (!this.#_handleElement) throw new Error("Handle element not found.");
    if (!this.#_parentContainer) throw new Error("Container not found.");

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

      // Run callbacks
      this.#_onResizeCallbacks.forEach((cb) => cb());
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
   * Inserts the handle HTML element into the parent container between the two children.
   */
  #insertHandleIntoParent() {
    if (!this.#_parentContainer) {
      throw new Error("No resizer has been added to a container.");
    }

    if (!this.#_handleElement) {
      throw new Error("Handle element not found.");
    }

    if (!this.#_childTwo) {
      throw new Error(
        "Could not find the second HTML element within the container."
      );
    }

    this.#_parentContainer.insertBefore(this.#_handleElement, this.#_childTwo);
  }

  /**
   * Adds flex values to the first and second child elements.
   */
  #addFlexToParentChildren() {
    if (!this.#_childOne || !this.#_childTwo) {
      throw new Error(
        "Could not find the first or second element within the container."
      );
    }

    this.#_childOne.style.flex = this.#_flexOne.toString();
    this.#_childTwo.style.flex = this.#_flexTwo.toString();
  }

  /**
   * Sets the parent container's display to 'flex' and sets 'flexDirection' based on the orientation.
   */
  #addDisplayFlexDirectionToParent() {
    if (!this.#_parentContainer) {
      throw new Error("Container element not passed.");
    }

    this.#_parentContainer.style.display = "flex";

    if (this.#_options?.direction === "vertical") {
      this.#_parentContainer.style.flexDirection = "column";
    } else {
      this.#_parentContainer.style.flexDirection = "row";
    }
  }

  /**
   * Checks if a flex number is greater than 0 and less than 1.
   * @param {number} flexNumber - The flex number to check.
   */
  #checkMinFlex(flexNumber) {
    if (flexNumber < 0) {
      throw new Error("minFlex must be greater than 0.");
    }
    if (flexNumber >= 1) {
      throw new Error("minFlex must be less than 1.");
    }
  }

  /**
   * Checks if a direction is a valid one.
   * @param {any} direction - The direction to check.
   */
  #checkDirection(direction) {
    /** @type {import("./types.js").resizerTwoDirection} */
    const h = "horizontal";
    /** @type {import("./types.js").resizerTwoDirection} */
    const v = "vertical";

    const valid = new Set([h, v]);

    if (!valid.has(direction)) {
      throw new Error("Direction must be 'vertical' or 'horizontal'.");
    }
  }

  /**
   * Checks if the passed options conform to the required constraints.
   * @param {import("./types.js").resizerTwoOptions} options - The options to check.
   */
  #checkOptions(options) {
    this.#checkMinFlex(options.minFlex);
    this.#checkDirection(options.direction);
  }
}

export default ResizerTwo;
