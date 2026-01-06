/**
 * Shape of the cildren it holds and there flex values
 */
export type ResizerTwoChildrenFlex = {
  /**
   * The flex value of the first child
   */
  firstChild: number;

  /**
   * The flex value of the secodn child
   */
  secondChild: number;
};

/**
 * Options to change the behvaiour
 */
export type ResizerTwoOptions = {
  /**
   * Min flex that each child can have
   */
  minFlex: ResizerTwoChildrenFlex;

  /**
   * Optional valuyes to set inital flex values for the children
   */
  initalFlex: ResizerTwoChildrenFlex | undefined;

  /**
   * Key value pairs of css properties and there values
   */
  handleStyles: Record<string, string>;

  /**
   * The parent element that contains the elements we want to add resize to
   */
  container: HTMLDivElement;

  /**
   * The direction to make the children either row based or column based
   */
  direction: "vertical" | "horizontal";
};

/**
 * Simple resizer that listens to a specific container and if elemnents or removed or added when the count is equal to two then
 * a handle is added between the two elements to change there size like a panel
 */
export class ResizerTwo {
  private _options: ResizerTwoOptions;
  private _callbacks: Set<() => void> = new Set();
  private _mutationObserver = new MutationObserver(() => this.onMutation());
  private _currentChildrenFlexValues: ResizerTwoChildrenFlex = {
    firstChild: 0,
    secondChild: 0,
  };
  private _handle: HTMLDivElement | undefined = undefined;

  constructor(options: ResizerTwoOptions) {
    this._options = options;

    if (!this._options.container) {
      throw new Error("Container element not passed");
    }

    if (options.initalFlex) {
      this._currentChildrenFlexValues = {
        ...options.initalFlex,
      };
    }

    this.init();
  }

  private init() {
    let container = this._options.container;
    if (!container) throw new Error("Container element not passed");

    if (container.children.length == 2) {
      // add handle beofre lsitenign if we can
      this.addHandle();
    }

    this._mutationObserver.observe(container, {
      childList: true,
      subtree: false,
      attributes: false,
      attributeOldValue: false,
      characterData: false,
      characterDataOldValue: false,
    });
  }

  /**
   * Get the value of a css variable
   * @param varName The css var name for example `--bg-primary`
   * @param element The HTML element default to document
   * @returns Value of it
   */
  private getCssVar(varName: string, element = document.documentElement) {
    return getComputedStyle(element).getPropertyValue(varName).trim();
  }

  /**
   * Adds the handles and applys styles to the container
   */
  private addHandle() {
    let container = this._options.container;
    if (!container) throw new Error("Container element not passed");

    if (container.children.length == 2) {
      this._handle = document.createElement("div");
      this.addHandleStyles();

      let secondChild = container.children[1];
      if (!secondChild) throw new Error("No two children");

      this.addContainerStyles();
      this.addChildrenStyles();

      container.insertBefore(this._handle, secondChild);

      // add listners
    }
  }

  /**
   * Adds styles to the children of the container
   */
  private addChildrenStyles() {
    const container = this._options.container;
    if (!container) throw new Error("Container element not passed");

    if (container.children.length < 2) {
      throw new Error("Container must have at least two children");
    }

    const firstChild = container.children[0] as HTMLElement;
    const secondChild = container.children[1] as HTMLElement;

    firstChild.style.flex = `${this._currentChildrenFlexValues.firstChild}`;
    secondChild.style.flex = `${this._currentChildrenFlexValues.secondChild}`;
  }

  /**
   * Adds the styles to the handle
   */
  private addHandleStyles() {
    let handle = this._handle;
    if (!handle) {
      throw new Error("Cannot add handle styles to empty element");
    }

    for (const [property, value] of Object.entries(
      this._options.handleStyles
    )) {
      let computed = "";

      if (this.isCssVariable(value)) {
        computed = this.getCssVar(value);
      }

      handle.style[property as any] = computed;
    }
  }

  /**
   * Checks if a string is a css var just checks if it has `--`
   * @param str The string to check
   * @returns True or false
   */
  private isCssVariable(str: string): boolean {
    return str.indexOf("--") > 0;
  }

  /**
   * Ads the styles to the container
   */
  private addContainerStyles() {
    let container = this._options.container;
    if (!container) throw new Error("Container element not passed");

    container.style.display = "flex";

    if (this._options.direction === "horizontal") {
      container.style.flexDirection = "row";
    } else if (this._options.direction === "vertical") {
      container.style.flexDirection = "column";
    } else {
      container.style.flexDirection = "row";
    }
  }

  private removeContainerStyles() {
    let container = this._options.container;
    if (!container) throw new Error("Container element not passed");

    container.style.removeProperty("display");
    container.style.removeProperty("direction");
  }

  /**
   * Remove the handle element and any styles to the container
   */
  private removeHandle() {
    let container = this._options.container;
    if (!container) throw new Error("Container element not passed");

    if (this._handle) {
      container.removeChild(this._handle);
      this._handle = undefined;
    }

    this.removeContainerStyles();
  }

  /**
   * Runs every time a element i added or removed
   */
  private onMutation() {
    let container = this._options.container;
    if (!container) throw new Error("Container element not passed");

    if (
      this._handle &&
      container.contains(this._handle) &&
      container.children.length === 3
    ) {
      return; // if it has two children and handle it's fine we dont need to do anything
    }

    if (!this._handle && container.children.length === 2) {
      this.addHandle(); // if there isnt a handle and two elements add it
      return;
    }

    // else it has more or else children needed so we ignore

    this.removeHandle();
  }

  /**
   * Gets the flex value of the two children
   * @returns Object contaning there values
   */
  getFlexValues(): ResizerTwoChildrenFlex {
    return this._currentChildrenFlexValues;
  }

  /**
   * Run logic when the handle rezies the elements
   * @param callback The logic to run when it changes
   */
  on(callback: () => void) {
    this._callbacks.add(callback);
  }

  remove(callback: () => void) {
    this._callbacks.delete(callback);
  }

  /**
   * Runs cleanup logic
   */
  dispose() {}
}
