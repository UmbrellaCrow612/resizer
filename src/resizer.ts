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
 * Event callbacks type definitions
 */
export type ResizeCallbacks = {
  onBeginDrag?: () => void;
  onDrag?: (flexValues: [number, number]) => void;
  onDragFinished?: (flexValues: [number, number]) => void;
  onDragPastMin?: (
    side: "left" | "right" | "top" | "bottom",
    pixelsPast: number,
  ) => void;
  onChildCountChange?: (count: number) => void;
  onDragPastSingleChildThreshold?: (
    side: "left" | "right" | "top" | "bottom",
    pixelsPast: number,
  ) => void;
};

/**
 * Represents a resizer class which manages the resize behvaiour between two elements.
 */
export class Resizer {
  private _options: ResizerOptions;
  private _callbacks: ResizeCallbacks;
  private _handleElement: HTMLDivElement | null = null;
  private isDragging = false;
  private startMousePos = 0;
  private startFlexValues: [number, number] = [1, 1];
  private containerSize = 0;
  private currentFlexValues: [number, number] = [1, 1];
  private _previousTwoChildFlex: [number, number] | null = null;
  private _singleChildThreshold: number = 50;
  private _hasEmittedSingleChildThreshold = false;

  constructor(options: ResizerOptions, callbacks: ResizeCallbacks = {}) {
    this._options = options;
    this._callbacks = callbacks;
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

    this.currentFlexValues = this.loadFlexValues();

    this.applyFlexToChildren();

    this.updateHandlePosition();

    // Emit initial child count
    const children = this.getContentChildren();
    this._callbacks.onChildCountChange?.(children.length);
  }

  private getContentChildren(): HTMLElement[] {
    return Array.from(this._options.container.children).filter(
      (child) => child !== this._handleElement,
    ) as HTMLElement[];
  }

  private applyFlexToChildren() {
    const children = this.getContentChildren();

    if (children.length === 1) {
      // Single child gets flex 1
      children[0]!.style.flex = "1";
    } else if (children.length === 2) {
      // Two children get their respective flex values
      children[0]!.style.flex = String(this.currentFlexValues[0]);
      children[1]!.style.flex = String(this.currentFlexValues[1]);
    }
  }

  private updateHandlePosition() {
    const children = this.getContentChildren();

    if (children.length === 1) {
      // Handle before single child
      this.addHandleBefore(children[0]!);
    } else if (children.length === 2) {
      // Handle between two children
      this.addHandleBetween(children[0]!, children[1]!);
    }
  }

  private addHandleBefore(targetChild: HTMLElement) {
    if (this._handleElement) {
      this.removeHandle();
    }

    this._handleElement = document.createElement("div");
    targetChild.before(this._handleElement);

    this.addHandleStyles();
    this.addHandleEventListeners();
  }

  private addHandleBetween(firstChild: HTMLElement, _: HTMLElement) {
    if (this._handleElement) {
      this.removeHandle();
    }

    this._handleElement = document.createElement("div");
    firstChild.after(this._handleElement);

    this.addHandleStyles();
    this.addHandleEventListeners();
  }

  private removeHandle() {
    if (this._handleElement && this._handleElement.parentNode) {
      // Remove event listeners first
      this._handleElement.removeEventListener(
        "mousedown",
        this.handleMouseDown,
      );
      this._handleElement.parentNode.removeChild(this._handleElement);
      this._handleElement = null;
    }
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

  private saveFlexValues(values: [number, number]) {
    try {
      localStorage.setItem(this._options.storageKey, JSON.stringify(values));
    } catch (e) {
      // Ignore localStorage errors
    }
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

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.startMousePos =
      this._options.direction === "horizontal" ? e.clientX : e.clientY;
    this.startFlexValues = [...this.currentFlexValues] as [number, number];
    this.containerSize = this.getContainerSize();
    this._hasEmittedSingleChildThreshold = false;

    // Prevent text selection during drag
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    this._callbacks.onBeginDrag?.();

    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);
  };

  private handleMouseUp = () => {
    if (!this.isDragging) return;

    this.isDragging = false;

    // Restore text selection
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    // Only save flex values if we have 2 children
    const children = this.getContentChildren();
    if (children.length === 2) {
      this.saveFlexValues(this.currentFlexValues);
      this._callbacks.onDragFinished?.([...this.currentFlexValues] as [
        number,
        number,
      ]);
    }

    this.removeDragListeners();
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) {
      return;
    }

    const currentMousePos =
      this._options.direction === "horizontal" ? e.clientX : e.clientY;
    const deltaPixels = currentMousePos - this.startMousePos;

    const children = this.getContentChildren();

    // Handle single child case - check if dragged past threshold INTO the child
    if (children.length === 1) {
      const absDelta = Math.abs(deltaPixels);

      if (
        absDelta > this._singleChildThreshold &&
        !this._hasEmittedSingleChildThreshold
      ) {
        this._hasEmittedSingleChildThreshold = true;
        
        // Determine direction: positive delta means dragging INTO the child (right/bottom)
        // negative delta means dragging away from the child (left/top)
        const isHorizontal = this._options.direction === "horizontal";
        let side: "left" | "right" | "top" | "bottom";
        
        if (deltaPixels > 0) {
          // Dragging right (horizontal) or down (vertical) - INTO the child
          side = isHorizontal ? "right" : "bottom";
        } else {
          // Dragging left (horizontal) or up (vertical) - away from child, but since handle is before child,
          // dragging left means going past the child's left edge (into the space where previous child was)
          side = isHorizontal ? "left" : "top";
        }
        
        const pixelsPast = absDelta - this._singleChildThreshold;
        this._callbacks.onDragPastSingleChildThreshold?.(side, pixelsPast);
      }
      return;
    }

    // Handle two children case
    if (children.length !== 2) return;

    // Calculate total flex and current ratio
    const totalFlex = this.startFlexValues[0] + this.startFlexValues[1];
    const totalSize = this.containerSize;

    // Convert pixel delta to flex delta
    const deltaFlex = deltaPixels * (totalFlex / totalSize);

    let newFirstFlex = this.startFlexValues[0] + deltaFlex;
    let newSecondFlex = this.startFlexValues[1] - deltaFlex;

    // Check if dragged past min flex thresholds
    const minFlex = this._options.minFlex;

    if (newFirstFlex < minFlex) {
      const pixelsPast = (minFlex - newFirstFlex) * (totalSize / totalFlex);
      const side = this._options.direction === "horizontal" ? "left" : "top";
      this._callbacks.onDragPastMin?.(side, pixelsPast);
      newFirstFlex = minFlex;
      newSecondFlex = totalFlex - minFlex;
    } else if (newSecondFlex < minFlex) {
      const pixelsPast = (minFlex - newSecondFlex) * (totalSize / totalFlex);
      const side =
        this._options.direction === "horizontal" ? "right" : "bottom";
      this._callbacks.onDragPastMin?.(side, pixelsPast);
      newSecondFlex = minFlex;
      newFirstFlex = totalFlex - minFlex;
    }

    this.currentFlexValues = [newFirstFlex, newSecondFlex];

    // Apply to DOM
    this.applyFlexToChildren();

    // Emit callbacks
    this._callbacks.onDrag?.([...this.currentFlexValues] as [number, number]);
  };

  private getContainerSize(): number {
    const rect = this._options.container.getBoundingClientRect();
    return this._options.direction === "horizontal" ? rect.width : rect.height;
  }

  private removeDragListeners() {
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousemove", this.handleMouseMove);
  }

  /**
   * Remove the hande and any extra styles rezier applied
   */
  public dispose() {
    // Remove drag listeners if active
    if (this.isDragging) {
      this.removeDragListeners();
      // Restore text selection
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    }

    // Remove handle
    this.removeHandle();

    // Reset container styles
    this._options.container.style.display = "";
    this._options.container.style.flexDirection = "";

    // Reset children flex
    const children = this.getContentChildren();
    children.forEach((child) => {
      child.style.flex = "";
    });
  }

  /**
   * Get current flex values
   */
  public getFlexValues(): [number, number] {
    return [...this.currentFlexValues] as [number, number];
  }

  /**
   * Set flex values programmatically
   */
  public setFlexValues(values: [number, number]) {
    this.currentFlexValues = [...values] as [number, number];

    const children = this.getContentChildren();
    if (children.length === 2) {
      children[0]!.style.flex = String(this.currentFlexValues[0]);
      children[1]!.style.flex = String(this.currentFlexValues[1]);
    }

    this.saveFlexValues(this.currentFlexValues);
  }

  /**
   * Force update of handle position and flex application
   * Call this if you manually modify the DOM
   */
  public refresh() {
    const children = this.getContentChildren();
    const count = children.length;

    if (count === 0) {
      // No children, remove handle if exists
      this.removeHandle();
      this._callbacks.onChildCountChange?.(0);
      return;
    }

    if (count === 1) {
      // Transitioning to single child - store current flex values for later restoration
      if (this._previousTwoChildFlex === null && this.currentFlexValues) {
        this._previousTwoChildFlex = [...this.currentFlexValues] as [
          number,
          number,
        ];
      }

      // Single child always gets flex 1
      children[0]!.style.flex = "1";

      // Remove existing handle and reposition
      this.removeHandle();
      this.updateHandlePosition();

      this._callbacks.onChildCountChange?.(1);
    } else if (count === 2) {
      // Transitioning to two children - restore previous flex values if available
      if (this._previousTwoChildFlex !== null) {
        this.currentFlexValues = [...this._previousTwoChildFlex] as [
          number,
          number,
        ];
        // Clear the stored value after restoration
        this._previousTwoChildFlex = null;
      } else {
        // No stored values, use current or defaults
        this.currentFlexValues = this.loadFlexValues();
      }

      // Apply restored flex values
      children[0]!.style.flex = String(this.currentFlexValues[0]);
      children[1]!.style.flex = String(this.currentFlexValues[1]);

      // Remove existing handle and reposition between children
      this.removeHandle();
      this.updateHandlePosition();

      this._callbacks.onChildCountChange?.(2);
    } else {
      // More than 2 children - not supported, but still update handle position
      this.removeHandle();
      this._callbacks.onChildCountChange?.(count);
    }
  }

  /**
   * Set the threshold in pixels for single child drag to emit onDragPastSingleChildThreshold
   */
  public setSingleChildThreshold(pixels: number) {
    this._singleChildThreshold = pixels;
  }

  /**
   * Get the current single child drag threshold
   */
  public getSingleChildThreshold(): number {
    return this._singleChildThreshold;
  }
}