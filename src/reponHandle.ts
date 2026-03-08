export type ReOpenHandleOptions = {
  /** Container with exactly one child */
  container: HTMLDivElement;
  /** Handle styles */
  handleStyles: Record<string, string>;
  /** Which side to place the handle: "left"|"top" or "right"|"bottom" */
  position: "left" | "right" | "top" | "bottom";
};

export type ReOpenHandleCallbacks = {
  onBeginDrag?: () => void;
  /** Called during drag with pixels dragged (positive = toward the open side) */
  onDrag?: (pixels: number) => void;
  onDragFinished?: (pixels: number) => void;
};

/**
 * Handle that sits on one side of a single child and emits drag events.
 * Does not modify flex/layout - just reports drag distance.
 */
export class ResizerReOpenHandle {
  private _options: ReOpenHandleOptions;
  private _callbacks: ReOpenHandleCallbacks;
  private _handleElement: HTMLDivElement | null = null;
  private _childElement: HTMLElement | null = null;
  private isDragging = false;
  private startMousePos = 0;
  private currentDragPixels = 0;
  private isHorizontal: boolean;

  constructor(
    options: ReOpenHandleOptions,
    callbacks: ReOpenHandleCallbacks = {},
  ) {
    this._options = options;
    this._callbacks = callbacks;
    this.isHorizontal =
      options.position === "left" || options.position === "right";
    this.validate();
    this.init();
  }

  private validate() {
    if (!this._options.container) {
      throw new Error("Container element not present");
    }
    if (this._options.container.children.length !== 1) {
      throw new Error("Container must have exactly one child");
    }
    const validPositions = ["left", "right", "top", "bottom"];
    if (!validPositions.includes(this._options.position)) {
      throw new Error("Position must be left, right, top, or bottom");
    }
  }

  private init() {
    this._childElement = this._options.container.children[0] as HTMLElement;
    this._options.container.style.display = "flex";
    this._options.container.style.flexDirection = this.isHorizontal
      ? "row"
      : "column";

    this.createHandle();
  }

  private createHandle() {
    this._handleElement = document.createElement("div");

    const isBefore =
      this._options.position === "left" || this._options.position === "top";

    if (isBefore) {
      this._options.container.insertBefore(
        this._handleElement,
        this._childElement,
      );
    } else {
      this._options.container.appendChild(this._handleElement);
    }

    // Prevent flex from resizing handle
    this._handleElement.style.flexShrink = "0";

    this.addStyles();
    this.addListeners();
  }

  private addStyles() {
    if (!this._handleElement) return;

    Object.entries(this._options.handleStyles).forEach(([prop, val]) => {
      this._handleElement!.style[prop as any] = val;
    });
  }

  private addListeners() {
    this._handleElement?.addEventListener("mousedown", this.handleMouseDown);
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.startMousePos = this.isHorizontal ? e.clientX : e.clientY;
    this.currentDragPixels = 0;

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    this._callbacks.onBeginDrag?.();

    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;

    const currentPos = this.isHorizontal ? e.clientX : e.clientY;
    const rawDelta = currentPos - this.startMousePos;

    // Adjust delta based on position:
    // "left"/"top": dragging right/down (positive) opens, left/up (negative) closes
    // "right"/"bottom": dragging left/up (negative) opens, right/down (positive) closes
    const isStartPosition =
      this._options.position === "left" || this._options.position === "top";
    this.currentDragPixels = isStartPosition ? rawDelta : -rawDelta;

    this._callbacks.onDrag?.(this.currentDragPixels);
  };

  private handleMouseUp = () => {
    if (!this.isDragging) return;

    this.isDragging = false;
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    this._callbacks.onDragFinished?.(this.currentDragPixels);

    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousemove", this.handleMouseMove);
  };

  /** Get current drag distance in pixels */
  public getDragPixels(): number {
    return this.currentDragPixels;
  }

  /** Programmatically set position (removes and re-creates handle) */
  public setPosition(position: "left" | "right" | "top" | "bottom") {
    this._options.position = position;
    this.isHorizontal = position === "left" || position === "right";
    this._options.container.style.flexDirection = this.isHorizontal
      ? "row"
      : "column";

    this.removeHandle();
    this.createHandle();
  }

  /** Clean up and remove handle - safe to call mid-drag */
  public dispose() {
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousemove", this.handleMouseMove);

    if (this.isDragging) {
      document.body.style.userSelect = "";
      this.isDragging = false; 
    }

    this.removeHandle();

    this._options.container.style.display = "";
    this._options.container.style.flexDirection = "";
  }

  private removeHandle() {
    if (this._handleElement) {
      this._handleElement.removeEventListener(
        "mousedown",
        this.handleMouseDown,
      );
      this._handleElement.remove();
      this._handleElement = null;
    }
  }
}
