/**
 * Options to change the behaviour of the resizer
 */
export type ResizerOptions = {
  direction: "horizontal" | "vertical";
  handleStyles: Record<string, string>;
  container: HTMLDivElement | undefined;
  minFlex: number;
};

export class Resizer {
  private _options: ResizerOptions;
  private readonly _callbacks: Set<() => void> = new Set();
  private observer: MutationObserver;
  private handles: HTMLDivElement[] = [];

  private activeResize: {
    handleIndex: number;
    initialFlexes: number[];
    totalFlex: number;
    totalContainerSize: number;
    startPos: number;
  } | null = null;

  constructor(options: ResizerOptions) {
    this._options = { ...options };

    if (!this._options.container) {
      throw new Error("Failed to pass a container to watch");
    }

    this.observer = new MutationObserver(() => this.onMutation());
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.init();
  }

  private init() {
    const container = this._options.container!;
    container.style.display = "flex";
    container.style.flexDirection =
      this._options.direction === "horizontal" ? "row" : "column";

    this.setupHandles();
  }

  /**
   * Recalculates flex distribution and recreates handles
   */
  private setupHandles() {
    const container = this._options.container;
    if (!container) return;

    this.observer.disconnect();
    this.cleanupHandles();

    const children = Array.from(container.children).filter(
      (child) => !child.classList.contains("resizer-handle")
    ) as HTMLElement[];

    if (children.length === 0) {
      this.reobserve();
      return;
    }

    let totalExistingFlex = 0;
    let existingFlexCount = 0;

    children.forEach((child) => {
      const f = parseFloat(child.style.flex);
      if (!isNaN(f)) {
        totalExistingFlex += f;
        existingFlexCount++;
      }
    });

    // 2. Assign flex to new elements (average of existing, or 1)
    const averageFlex = existingFlexCount > 0 ? totalExistingFlex / existingFlexCount : 1;
    
    children.forEach((child) => {
      if (!child.style.flex || isNaN(parseFloat(child.style.flex))) {
        child.style.flex = String(averageFlex);
      }
    });

    // 3. Normalize: Make the sum of flex equal to the number of children
    // This ensures that "1" always represents the "standard" size
    const newTotalFlex = children.reduce((sum, child) => sum + parseFloat(child.style.flex), 0);
    const normalizationFactor = children.length / newTotalFlex;

    children.forEach((child) => {
      const currentFlex = parseFloat(child.style.flex);
      const normalizedFlex = currentFlex * normalizationFactor;
      // Enforce minFlex even during normalization
      child.style.flex = String(Math.max(normalizedFlex, this._options.minFlex));
    });

    // 4. Create handles between children
    for (let i = 0; i < children.length - 1; i++) {
      const handle = this.createHandle();
      const nextChild = children[i + 1];
      container.insertBefore(handle, nextChild);
      this.handles.push(handle);
    }

    this.reobserve();
  }

  private createHandle(): HTMLDivElement {
    const handle = document.createElement("div");
    handle.classList.add("resizer-handle");
    handle.style.flexShrink = "0";
    handle.style.backgroundColor = "#ccc";
    handle.style.userSelect = "none";
    handle.style.cursor = this._options.direction === "horizontal" ? "col-resize" : "row-resize";

    if (this._options.direction === "horizontal") {
      handle.style.width = "4px";
    } else {
      handle.style.height = "4px";
    }

    Object.entries(this._options.handleStyles).forEach(([key, value]) => {
      handle.style[key as any] = value;
    });

    handle.addEventListener("mousedown", (e) => this.onMouseDown(e, handle));
    return handle;
  }

  private onMouseDown(e: MouseEvent, handle: HTMLDivElement) {
    e.preventDefault();
    const container = this._options.container;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    const handleIndex = children.indexOf(handle);

    const initialFlexes = children.map((child) =>
      child.classList.contains("resizer-handle") ? 0 : parseFloat(child.style.flex || "1")
    );

    const totalFlex = initialFlexes.reduce((a, b) => a + b, 0);
    const totalContainerSize = this._options.direction === "horizontal" 
      ? container.offsetWidth 
      : container.offsetHeight;

    this.activeResize = {
      handleIndex,
      initialFlexes,
      totalFlex,
      totalContainerSize,
      startPos: this._options.direction === "horizontal" ? e.clientX : e.clientY,
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = this._options.direction === "horizontal" ? "col-resize" : "row-resize";
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.activeResize || !this._options.container) return;

    const { handleIndex, initialFlexes, totalFlex, totalContainerSize, startPos } = this.activeResize;
    const currentPos = this._options.direction === "horizontal" ? e.clientX : e.clientY;
    const deltaPx = currentPos - startPos;
    const deltaFlex = (deltaPx / totalContainerSize) * totalFlex;

    const children = Array.from(this._options.container.children) as HTMLElement[];
    const newFlexes = [...initialFlexes];

    if (deltaFlex > 0) {
      let remainingDelta = deltaFlex;
      for (let i = handleIndex + 1; i < newFlexes.length; i++) {
        if (children[i].classList.contains("resizer-handle")) continue;
        const shrinkable = newFlexes[i] - this._options.minFlex;
        const shrinkAmount = Math.min(remainingDelta, Math.max(0, shrinkable));
        newFlexes[i] -= shrinkAmount;
        remainingDelta -= shrinkAmount;
      }
      const actualShrinked = deltaFlex - remainingDelta;
      newFlexes[handleIndex - 1] += actualShrinked;
    } else if (deltaFlex < 0) {
      let remainingDelta = Math.abs(deltaFlex);
      for (let i = handleIndex - 1; i >= 0; i--) {
        if (children[i].classList.contains("resizer-handle")) continue;
        const shrinkable = newFlexes[i] - this._options.minFlex;
        const shrinkAmount = Math.min(remainingDelta, Math.max(0, shrinkable));
        newFlexes[i] -= shrinkAmount;
        remainingDelta -= shrinkAmount;
      }
      const actualShrinked = Math.abs(deltaFlex) - remainingDelta;
      newFlexes[handleIndex + 1] += actualShrinked;
    }

    newFlexes.forEach((flex, idx) => {
      if (!children[idx].classList.contains("resizer-handle")) {
        children[idx].style.flex = String(flex);
      }
    });

    this._callbacks.forEach((cb) => cb());
  }

  private onMouseUp() {
    this.activeResize = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
  }

  private reobserve() {
    if (this._options.container) {
      this.observer.observe(this._options.container, {
        childList: true,
        subtree: false,
      });
    }
  }

  private cleanupHandles() {
    this.handles.forEach((handle) => handle.remove());
    this.handles = [];
  }

  private onMutation = () => {
    this.setupHandles();
  };

  on(callback: () => void) { this._callbacks.add(callback); }
  remove(callback: () => void) { this._callbacks.delete(callback); }

  destroy() {
    this.observer.disconnect();
    this.cleanupHandles();
    this.onMouseUp();
  }
}