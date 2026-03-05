/**
 * Options required for rezier to work
 */
export type ResizerOptions = {
  /**
   * The parent element that contains the children you want to add resizer handle between
   */
  container: HTMLDivElement;

  /**
   * Contains styles you want to apply to the handle
   */
  handleStyles: Record<string, string>;

  /**
   * Which direction children will be draged / direction the handle will drag
   */
  direction: "vertical" | "horizontal";

  /**
   * The min flex either child can have
   */
  minFlex: number;

  /**
   * Key used for local stroage to persist the flex values between sessions / re renders
   */
  storageKey: string;
};

/**
 * Represents a resizer class which manages the resize behvaiour between two elements.
 *
 * Listen to a target div and adds a handle.
 *
 * When a single element is present the handle is on the left/right for example, when the handle is dragged past a certain point a event emitted for user to
 * to re render the element that was present beofre.
 *
 * When two elements are present the handle acts as a dragable element to change flex values between said two elements.
 *
 * When the user drags past the min flex of given child a event will be emitted to notify the user to unrender said element.
 *
 * When the user no longer wants any handle present you can dispose of it with dispose call.
 *
 * When the user drags the resizer a event is emitted to let the user react to resize being dragged
 *
 * When elements are removed or added it persists flex state between them and also between sessions if you define local stroage key
 *
 * When user drags it automacitlly saves flex state in local storage with key provided
 */
export class Resizer {
  private _options: ResizerOptions;
  private _handleElement: HTMLDivElement | null = null;
  private isDragging = false;

  constructor(options: ResizerOptions) {
    this._options = options;
    this.validateOptions(options);
    this.validateContainer(options.container);
    this.init();
  }

  private validateOptions(options: ResizerOptions) {
    if (!options.container) {
      throw new Error("Container element not present");
    }

    if (
      !options.direction ||
      (options.direction !== "vertical" && options.direction !== "horizontal")
    ) {
      throw new Error("Direction value must be vertical or horizontal");
    }
  }

  private validateContainer(container: HTMLDivElement) {
    if (!container) {
      throw new Error("Container element not present");
    }

    if (container.children.length == 0) {
      throw new Error("Container need to have at least one child");
    }
  }

  private init() {
    // apply display flex to parent and flex direction based direction
    this._options.container.style.display = "flex";
    this._options.container.style.flexDirection =
      this._options.direction === "horizontal" ? "row" : "column";

    // Apply default flex to children
    Array.from(this._options.container.children).forEach((child) => {
      const el = child as HTMLElement;
      el.style.flex = "1";
    });

    this.addHandle();
  }

  private loadFlexValues(): [number, number] {
    try {
      const stored = localStorage.getItem(this._options.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 2) {
          return [parsed[0], parsed[1]];
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return [1, 1];
  }

  private addHandle() {
    this._handleElement = document.createElement("div");
    const containerElement = this._options.container;

    // insert it between element one and element two
    // or
    // if one element before said element
    if (containerElement.children.length === 2) {
      const firstChild = containerElement.children[0] as HTMLDivElement;
      firstChild.after(this._handleElement);
    } else if (containerElement.children.length === 1) {
      // Insert before the single existing child
      const singleChild = containerElement.children[0] as HTMLDivElement;
      singleChild.before(this._handleElement);
    } else {
      throw new Error("Container element does not contain 2 or 1 elements");
    }

    this.addHandleStyles();
    this.addHandleEventListeners();
  }

  private addHandleStyles() {
    const handle = this._handleElement;
    if (!handle) {
      throw new Error("Cannot add styles to handle as is null");
    }

    Object.entries(this._options.handleStyles).forEach(([property, value]) => {
      handle.style[property as any] = value;
    });
  }

  private addHandleEventListeners() {
    const handle = this._handleElement;
    if (!handle) {
      throw new Error("Cannot add event listeners to handle as is null");
    }

    handle.addEventListener("mousedown", this.handleMouseDown);
  }

  private handleMouseDown = () => {
    this.isDragging = true;

    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    this.removeHandleEventListeners();
  };

  private handleMouseMove = () => {
    if (!this.isDragging) {
      return;
    }

    // Read the flex values from local stroage appky those
    // then change then based on direction they move
  };

  private removeHandleEventListeners = () => {
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousemove", this.handleMouseMove);
  };

  /**
   * Remove the hande and any extra styles rezier applied
   */
  public dispose() {
    this._options.container.style.display = "";
    this._options.container.style.flexDirection = "";

    Array.from(this._options.container.children).forEach((child) => {
      const el = child as HTMLElement;
      el.style.flex = "";
    });

    this.removeHandleEventListeners();
  }

  /**
   * ON INIT
   *
   * - Make sure parent has display flex, flex and flex direction base don direction flex 1 and flex direction: col : row
   * - Each child has flex value from default / stored state
   * - Add handle element with listners
   * - reset is just custom logic on drag listner and stuff
   */
  /**
   * API
   *
   * dispose
   *
   * onResize
   *
   * onBeginDrag
   *
   * onDrag -> accept callback
   *
   * onDragFinished -> accept callback
   *
   * onDragPast(how many pixels user drags past the min flex) -> call a callback
   *
   */
}
