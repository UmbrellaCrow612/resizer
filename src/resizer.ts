/**
 * Options required for resizer to work
 */
export type ResizerOptions = {
  /**
   * The parent element that contains exactly two children you want to add resizer handle between
   */
  container: HTMLDivElement;

  /**
   * Contains styles you want to apply to the handle
   */
  handleStyles: Record<string, string>;

  /**
   * Which direction children will be dragged / direction the handle will drag
   */
  direction: "vertical" | "horizontal";

  /**
   * The min flex either child can have
   */
  minFlex: number;

  /**
   * Key used for local storage to persist the flex values between sessions / re renders
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
};

/**
 * Represents a resizer class which manages the resize behaviour between two elements.
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

  constructor(options: ResizerOptions, callbacks: ResizeCallbacks = {}) {
    this._options = options;
    this._callbacks = callbacks;
    this.validateContainer(options.container);
    this.init();
  }

  private validateContainer(container: HTMLDivElement) {
    if (!container) {
      throw new Error("Container element not present");
    }

    if (container.children.length !== 2) {
      throw new Error("Container must have exactly two children");
    }
  }

  private init() {
    this._options.container.style.display = "flex";
    this._options.container.style.flexDirection =
      this._options.direction === "horizontal" ? "row" : "column";

    this.currentFlexValues = this.loadFlexValues();
    this.applyFlexToChildren();
    this.createHandle();
  }

  private getChildren(): [HTMLElement, HTMLElement] {
    const children = Array.from(this._options.container.children).filter(
      (child) => child !== this._handleElement,
    ) as HTMLElement[];
    return [children[0] as HTMLElement, children[1] as HTMLElement];
  }

  private applyFlexToChildren() {
    const [first, second] = this.getChildren();
    first.style.flex = String(this.currentFlexValues[0]);
    second.style.flex = String(this.currentFlexValues[1]);
  }

  private createHandle() {
    const [firstChild] = this.getChildren();

    this._handleElement = document.createElement("div");
    firstChild.after(this._handleElement);

    this.addHandleStyles();
    this.addHandleEventListeners();
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
    if (!this._handleElement) return;

    Object.entries(this._options.handleStyles).forEach(([property, value]) => {
      this._handleElement!.style[property as any] = value;
    });
  }

  private addHandleEventListeners() {
    this._handleElement?.addEventListener("mousedown", this.handleMouseDown);
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.startMousePos =
      this._options.direction === "horizontal" ? e.clientX : e.clientY;
    this.startFlexValues = [...this.currentFlexValues];
    this.containerSize = this.getContainerSize();

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    this._callbacks.onBeginDrag?.();

    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);
  };

  private handleMouseUp = () => {
    if (!this.isDragging) return;

    this.isDragging = false;
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    this.saveFlexValues(this.currentFlexValues);
    this._callbacks.onDragFinished?.([...this.currentFlexValues]);

    this.removeDragListeners();
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;

    const currentMousePos =
      this._options.direction === "horizontal" ? e.clientX : e.clientY;
    const deltaPixels = currentMousePos - this.startMousePos;

    const totalFlex = this.startFlexValues[0] + this.startFlexValues[1];
    const totalSize = this.containerSize;
    const deltaFlex = deltaPixels * (totalFlex / totalSize);

    let newFirstFlex = this.startFlexValues[0] + deltaFlex;
    let newSecondFlex = this.startFlexValues[1] - deltaFlex;
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
    this.applyFlexToChildren();
    this._callbacks.onDrag?.([...this.currentFlexValues]);
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
   * Remove the handle and any extra styles resizer applied
   * Safe to call from any callback
   */
  public dispose() {
    this.removeDragListeners();

    if (this.isDragging) {
      document.body.style.userSelect = "";
      this.isDragging = false;
    }

    this.removeHandle();

    this._options.container.style.display = "";
    this._options.container.style.flexDirection = "";

    const [first, second] = this.getChildren();
    first.style.flex = "";
    second.style.flex = "";
  }

  /**
   * Get current flex values
   */
  public getFlexValues(): [number, number] {
    return [...this.currentFlexValues];
  }

  /**
   * Set flex values programmatically
   */
  public setFlexValues(values: [number, number]) {
    this.currentFlexValues = [...values];
    this.applyFlexToChildren();
    this.saveFlexValues(this.currentFlexValues);
  }
}
