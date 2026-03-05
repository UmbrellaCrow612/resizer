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
  private _callbacks: ResizeCallbacks;
  private _handleElement: HTMLDivElement | null = null;
  private isDragging = false;
  private startMousePos = 0;
  private startFlexValues: [number, number] = [1, 1];
  private containerSize = 0;
  private currentFlexValues: [number, number] = [1, 1];
  private _previousTwoChildFlex: [number, number] | null = null;

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
    // Only handle drag if we have 2 children
    const children = this.getContentChildren();
    if (children.length !== 2) return;

    this.isDragging = true;
    this.startMousePos =
      this._options.direction === "horizontal" ? e.clientX : e.clientY;
    this.startFlexValues = [...this.currentFlexValues] as [number, number];
    this.containerSize = this.getContainerSize();

    this._callbacks.onBeginDrag?.();

    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);
  };

  private handleMouseUp = () => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.saveFlexValues(this.currentFlexValues);
    this._callbacks.onDragFinished?.([...this.currentFlexValues] as [
      number,
      number,
    ]);
    this.removeDragListeners();
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) {
      return;
    }

    const currentMousePos =
      this._options.direction === "horizontal" ? e.clientX : e.clientY;
    const deltaPixels = currentMousePos - this.startMousePos;

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
}


