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
   * Create a default resizer or pass options
   * @param {resizerOptions} options - Set of options to change the resize behaviour
   */
  constructor(options = { direction: "horizontal", minFlex: 0.3 }) {
    this.#_options = options;
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
   * Remove the resize widget and any styles added to it
   */
  remove() {
    if (!this.#_parentContainer) {
      throw new Error("No resizer added to a container");
    }
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
    this.#adddHandleListners();

    this.#addFlexToParentChildren();

    this.#insertHandleIntoParent();
  }

  /**
   * Adds the styles to the handle element
   */
  #addHandleStyles() {
    if (!this.#_handleElement) {
      throw new Error("Handle element not found");
    }

    // add styles - based on options for now do vertical - also custom styles
    if (this.#_options?.direction === "horizontal") {
      this.#_handleElement.style.height = "10px";
      this.#_handleElement.style.cursor = "row-resize";
    } else {
      this.#_handleElement.style.width = "10px";
      this.#_handleElement.style.cursor = "col-resize";
    }

    this.#_handleElement.style.backgroundColor = "black";
  }

  #adddHandleListners() {
    if (!this.#_handleElement) throw new Error("Handle element not found");
    if (!this.#_parentContainer) throw new Error("Container not found");

    // add listners
    if (this.#_options?.direction == "vertical") {
      this.#_handleElement.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.#_isResizing = true;
      });
    } else {
      this.#_handleElement.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.#_isResizing = true;
      });
    }
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
}

// Usage example

setTimeout(() => {
  var resize = new Resizer();

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
