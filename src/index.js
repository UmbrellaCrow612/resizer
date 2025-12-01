/**
 * Represents a resizer which is used to resize the width or height between two elements
 */
export default class Resizer {
  /**
   * @type {HTMLDivElement | undefined}
   */
  #_parentElement = undefined;

  /**
   * @type {MutationObserver}
   */
  #_mutationObservor = new MutationObserver(() => {
    this.#try_add_handle();
  });

  /**
   * @type {boolean}
   */
  #_isBeingObserved = false;

  /**
   * @type {HTMLDivElement}
   */
  #_handleElement = document.createElement("div");

  /**
   * @type {HTMLElement | undefined}
   */
  #_childOne = undefined;

  /**
   * @type {HTMLElement | undefined}
   */
  #_childTwo = undefined;

  /**
   * Preserve flex values between child removals
   */
  #_lastFlexOne = 1;
  #_lastFlexTwo = 1;

  /**
   * Configuration options
   * @type {import("./types").resizerTwoOptions}
   */
  #_options = {
    direction: "horizontal",
    minFlex: 0.1,
    handleStyles: {},
  };

  /**
   * Creates a Resizer instance
   * @param {import("./types").resizerTwoOptions} options Options to control the behavior of the resizer
   */
  constructor(options = { direction: "vertical", minFlex: 0.2 }) {
    this.#_options = { ...this.#_options, ...options };
  }

  /**
   * Starts observing the parent container
   * @param {HTMLDivElement} element The parent container to observe
   */
  observe(element) {
    if (!element) throw new Error("Container element not passed");
    if (this.#_isBeingObserved) {
      console.warn("An element is already being observed");
      return;
    }

    this.#_parentElement = element;
    this.#_mutationObservor.observe(this.#_parentElement, { childList: true });
    this.#try_add_handle();
  }

  /**
   * Adds or removes the handle depending on children
   */
  #try_add_handle() {
    if (!this.#_parentElement) throw new Error("Container element not passed");

    const pureChildren = Array.from(this.#_parentElement.children).filter(
      (x) => x !== this.#_handleElement
    );

    const handleExists = Array.from(this.#_parentElement.children).includes(
      this.#_handleElement
    );

    if (pureChildren.length === 2) {
      if (!handleExists) {
        const [firstChild, secondChild] = pureChildren;
        // @ts-ignore
        this.#_childOne = firstChild;
        // @ts-ignore
        this.#_childTwo = secondChild;

        this.#applyHandleStyles();
        this.#addDragListeners();

        // Apply previously saved flex values
        // @ts-ignore
        this.#_childOne.style.flex = this.#_lastFlexOne.toString();
        // @ts-ignore
        this.#_childTwo.style.flex = this.#_lastFlexTwo.toString();

        this.#_parentElement.insertBefore(this.#_handleElement, secondChild);
      }
    } else {
      if (handleExists) {
        if (this.#_childOne && this.#_childTwo) {
          this.#_lastFlexOne = parseFloat(
            this.#_childOne.style.flex || this.#_lastFlexOne.toString()
          );
          this.#_lastFlexTwo = parseFloat(
            this.#_childTwo.style.flex || this.#_lastFlexTwo.toString()
          );

          this.#_childOne.style.removeProperty("flex");
          this.#_childTwo.style.removeProperty("flex");

          this.#_childOne = undefined;
          this.#_childTwo = undefined;
        }

        this.#_parentElement.removeChild(this.#_handleElement);
      }
    }
  }

  /**
   * Applies custom styles from options to the handle
   */
  #applyHandleStyles() {
    const defaultStyles = {
      width: this.#_options.direction === "horizontal" ? "5px" : "100%",
      height: this.#_options.direction === "horizontal" ? "100%" : "5px",
      backgroundColor: "#ccc",
      cursor:
        this.#_options.direction === "horizontal" ? "col-resize" : "row-resize",
      userSelect: "none",
      zIndex: "10",
    };

    Object.assign(
      this.#_handleElement.style,
      defaultStyles,
      this.#_options.handleStyles
    );
  }

  /**
   * Adds draggable behavior to the handle to change flex values
   */
  #addDragListeners() {
    let isDragging = false;
    let startPos = 0;
    let startFlexOne = 0;
    let startFlexTwo = 0;
    let initialFlexSum = 0;

    /**
     * @param {MouseEvent} e
     */
    const onMouseMove = (e) => {
      if (!isDragging) return;
      if (!this.#_parentElement) return;
      if (!this.#_childOne) return;
      if (!this.#_childTwo) return;

      const rect = this.#_parentElement.getBoundingClientRect();

      if (this.#_options.direction === "horizontal") {
        const delta = e.clientX - startPos;
        const parentWidth = rect.width;

        let flexOne = (startFlexOne / initialFlexSum) * parentWidth + delta;

        flexOne = (flexOne * initialFlexSum) / parentWidth;

        let flexTwo = initialFlexSum - flexOne;

        flexOne = Math.max(this.#_options.minFlex, flexOne);
        flexTwo = Math.max(this.#_options.minFlex, flexTwo);

        if (flexOne === this.#_options.minFlex) {
          flexTwo = initialFlexSum - this.#_options.minFlex;
        } else if (flexTwo === this.#_options.minFlex) {
          flexOne = initialFlexSum - this.#_options.minFlex;
        }

        this.#_childOne.style.flex = flexOne.toString();
        this.#_childTwo.style.flex = flexTwo.toString();
      } else {
        const delta = e.clientY - startPos;
        const parentHeight = rect.height;

        let flexOne = (startFlexOne / initialFlexSum) * parentHeight + delta;

        flexOne = (flexOne * initialFlexSum) / parentHeight;
        let flexTwo = initialFlexSum - flexOne;

        flexOne = Math.max(this.#_options.minFlex, flexOne);
        flexTwo = Math.max(this.#_options.minFlex, flexTwo);

        if (flexOne === this.#_options.minFlex) {
          flexTwo = initialFlexSum - this.#_options.minFlex;
        } else if (flexTwo === this.#_options.minFlex) {
          flexOne = initialFlexSum - this.#_options.minFlex;
        }

        this.#_childOne.style.flex = flexOne.toString();
        this.#_childTwo.style.flex = flexTwo.toString();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    this.#_handleElement.addEventListener("mousedown", (e) => {
      if (!this.#_parentElement) return;
      if (!this.#_childOne) return;
      if (!this.#_childTwo) return;

      isDragging = true;
      startPos =
        this.#_options.direction === "horizontal" ? e.clientX : e.clientY;

      startFlexOne = parseFloat(
        this.#_childOne.style.flex || this.#_lastFlexOne.toString()
      );
      startFlexTwo = parseFloat(
        this.#_childTwo.style.flex || this.#_lastFlexTwo.toString()
      );
      initialFlexSum = startFlexOne + startFlexTwo;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }
}
