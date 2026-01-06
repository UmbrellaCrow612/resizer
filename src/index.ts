/**
 * Options to change the behaviour of the resizer
 */
export type ResizerOptions = {
  /**
   * Which direction the elements will be places i.e column based or row based this dictaes which direction the user can move the handle
   */
  direction: "horizontal" | "vertical";

  /**
   * Styles you want to apply to the handle
   */
  handleStyles: Record<string, string>;

  /**
   * The parent container that the resizer will watch and add handles between elements
   */
  container: HTMLDivElement | undefined;
};

/**
 * Get some basic default values for the handle styles
 * @param options The options passed
 * @returns Object with css field and it's value
 */
const getDefaultHandleStyles = (
  options: ResizerOptions
): Record<string, string> => {
  let styles: Record<string, string> = {};

  if (options.direction === "horizontal") {
    styles.width = "5px";
    styles.cursor = "col-resize";
  } else {
    styles.height = "5px";
    styles.cursor = "row-resize";
  }

  return styles;
};

/**
 * Used to create a resizer which when observin a element will add resize handles between elements and allow them to be
 * changed in either width or height
 */
export class Resizer {
  private _options: ResizerOptions = {
    direction: "horizontal",
    handleStyles: {},
    container: undefined,
  };

  /**
   * Callbacks functions to run when the panel has been resized
   */
  private readonly _callbacks: Set<() => void> = new Set();

  constructor(options: ResizerOptions) {
    this._options.handleStyles = {
      ...getDefaultHandleStyles(options),
    };
    this._options = {
      direction: options.direction,
      handleStyles: {
        ...options.handleStyles,
      },
      container: options.container,
    };

    if (!this._options.container) {
      throw new Error("Failed to pass a container to watch");
    }

    this.init();
  }

  /**
   * Beings to watch the container and adds handles between elements
   */
  private init() {
    let container = this._options.container;
    if (!container) {
      throw new Error("Failed to pass a container to watch");
    }
  }

  /**
   * Register a callback to run when a user is moving the handle i.e rezieing
   * @param callback The logic to run
   */
  on(callback: () => void) {
    this._callbacks.add(callback);
  }

  /**
   * Remove a callback you registred
   * @param callback The callback to remove
   */
  remove(callback: () => void) {
    this._callbacks.delete(callback);
  }
}
