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
  }

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
