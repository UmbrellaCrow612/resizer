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

  /**
   * How small a element can be shrun using the handles
   */
  minFlex: number;
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
    minFlex: 0.3,
  };

  /**
   * Callbacks functions to run when the panel has been resized
   */
  private readonly _callbacks: Set<() => void> = new Set();

  /**
   * Used to listen to the container element and run logic when it changes
   */
  private observer: MutationObserver = new MutationObserver(() =>
    this.onMutation()
  );

  /**
   * Store references to handles for cleanup
   */
  private handles: HTMLDivElement[] = [];

  /**
   * Track active resize state
   */
  private activeResize: {
    handle: HTMLDivElement;
    prevElement: HTMLElement;
    nextElement: HTMLElement;
    startPos: number;
    startPrevFlex: number;
    startNextFlex: number;
    startPrevSize: number;
    startNextSize: number;
  } | null = null;

  constructor(options: ResizerOptions) {
    this._options = {
      ...options,
    };

    if (!this._options.container) {
      throw new Error("Failed to pass a container to watch");
    }

    this.init();
  }

  /**
   * Begins to watch the container and adds handles between elements
   */
  private init() {
    let container = this._options.container;
    if (!container) {
      throw new Error("Failed to pass a container to watch");
    }

    container.style.display = "flex";
    container.style.flexDirection =
      this._options.direction === "horizontal" ? "row" : "column";

    this.observer.observe(container, {
      childList: true,
      subtree: false,
    });

    this.setupHandles();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  /**
   * Set up handles between all child elements
   */
  private setupHandles() {
    const container = this._options.container;
    if (!container) return;

    this.observer.disconnect();

    this.cleanupHandles();

    const children = Array.from(container.children).filter(
      (child) => !child.classList.contains("resizer-handle")
    ) as HTMLElement[];

    if (children.length < 2) {
      // Reconnect observer before returning
      this.observer.observe(container, {
        childList: true,
        subtree: false,
      });
      return;
    }

    children.forEach((child) => {
      if (!child.style.flex) {
        child.style.flex = "1";
      }
    });

    for (let i = 0; i < children.length - 1; i++) {
      const handle = this.createHandle();
      const nextChild = children[i + 1];

      container.insertBefore(handle, nextChild);
      this.handles.push(handle);
    }

    this.observer.observe(container, {
      childList: true,
      subtree: false,
    });
  }

  /**
   * Create a resize handle element
   */
  private createHandle(): HTMLDivElement {
    const handle = document.createElement("div");
    handle.classList.add("resizer-handle");
    handle.style.flexShrink = "0";
    handle.style.backgroundColor = "#ccc";
    handle.style.userSelect = "none";

    Object.entries(this._options.handleStyles).forEach(([key, value]) => {
      handle.style[key as any] = value;
    });

    handle.addEventListener("mousedown", (e) => this.onMouseDown(e, handle));

    return handle;
  }

  /**
   * Handle mouse down on a handle
   */
  private onMouseDown(e: MouseEvent, handle: HTMLDivElement) {
    e.preventDefault();

    const container = this._options.container;
    if (!container) return;

    const handleIndex = Array.from(container.children).indexOf(handle);
    const prevElement = container.children[handleIndex - 1] as HTMLElement;
    const nextElement = container.children[handleIndex + 1] as HTMLElement;

    if (!prevElement || !nextElement) return;

    const prevFlex = parseFloat(prevElement.style.flex || "1");
    const nextFlex = parseFloat(nextElement.style.flex || "1");

    const prevSize =
      this._options.direction === "horizontal"
        ? prevElement.offsetWidth
        : prevElement.offsetHeight;
    const nextSize =
      this._options.direction === "horizontal"
        ? nextElement.offsetWidth
        : nextElement.offsetHeight;

    this.activeResize = {
      handle,
      prevElement,
      nextElement,
      startPos:
        this._options.direction === "horizontal" ? e.clientX : e.clientY,
      startPrevFlex: prevFlex,
      startNextFlex: nextFlex,
      startPrevSize: prevSize,
      startNextSize: nextSize,
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor =
      this._options.direction === "horizontal" ? "col-resize" : "row-resize";

    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  /**
   * Handle mouse move during resize
   */
  private onMouseMove(e: MouseEvent) {
    if (!this.activeResize || !this._options.container) return;

    const currentPos =
      this._options.direction === "horizontal" ? e.clientX : e.clientY;
    const delta = currentPos - this.activeResize.startPos;

    // Calculate new sizes in pixels
    const newPrevSize = this.activeResize.startPrevSize + delta;
    const newNextSize = this.activeResize.startNextSize - delta;

    // Calculate total flex and total size
    const totalFlex =
      this.activeResize.startPrevFlex + this.activeResize.startNextFlex;
    const totalSize =
      this.activeResize.startPrevSize + this.activeResize.startNextSize;

    // Convert pixel sizes to flex values
    let newPrevFlex = (newPrevSize / totalSize) * totalFlex;
    let newNextFlex = (newNextSize / totalSize) * totalFlex;

    // Enforce minimum flex values
    if (newPrevFlex < this._options.minFlex) {
      newPrevFlex = this._options.minFlex;
      newNextFlex = totalFlex - this._options.minFlex;
    }

    if (newNextFlex < this._options.minFlex) {
      newNextFlex = this._options.minFlex;
      newPrevFlex = totalFlex - this._options.minFlex;
    }

    // Apply new flex values
    this.activeResize.prevElement.style.flex = String(newPrevFlex);
    this.activeResize.nextElement.style.flex = String(newNextFlex);

    // Trigger callbacks
    this._callbacks.forEach((cb) => cb());
  }

  /**
   * Handle mouse up to end resize
   */
  private onMouseUp() {
    if (!this.activeResize) return;

    this.activeResize = null;

    // Restore default cursor and text selection
    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
  }

  /**
   * Clean up existing handles
   */
  private cleanupHandles() {
    this.handles.forEach((handle) => {
      handle.removeEventListener("mousedown", (e) =>
        this.onMouseDown(e, handle)
      );
      handle.remove();
    });
    this.handles = [];
  }

  /**
   * Runs logic when the container is mutated
   */
  private onMutation = () => {
    // Re-setup handles when children change
    this.setupHandles();
  };

  /**
   * Register a callback to run when a user is moving the handle i.e resizing
   * @param callback The logic to run
   */
  on(callback: () => void) {
    this._callbacks.add(callback);
  }

  /**
   * Remove a callback you registered
   * @param callback The callback to remove
   */
  remove(callback: () => void) {
    this._callbacks.delete(callback);
  }

  /**
   * Clean up and disconnect observer
   */
  destroy() {
    this.observer.disconnect();
    this.cleanupHandles();
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);

    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }
}
