export type ResizerTwoChildrenFlex = {
  firstChild: number;
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
};

/**
 * Get the value of a css variable
 * @param varName The css var name for example `--bg-primary`
 * @param element The HTML element default to document
 * @returns Value of it
 */
function getCssVar(varName: string, element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(varName).trim();
}

/**
 * Simple resizer that listens to a specific container and if elemnents or removed or added when the count is equal to two then
 * a handle is added between the two elements to change there size like a panel
 */
export class ResizerTwo {
  private _options: ResizerTwoOptions;
  private _callbacks: Set<() => void> = new Set();
  private _mutationObserver = new MutationObserver(() => this.onMutation());

  constructor(options: ResizerTwoOptions) {
    this._options = options;

    if (!this._options.container) {
      throw new Error("Container element not passed");
    }

    this.init();
  }

  private init() {}

  private onMutation() {}

  /**
   * Gets the flex value of the two children
   * @returns Object contaning there values
   */
  getFlexValues(): ResizerTwoChildrenFlex {
    return { firstChild: 0, secondChild: 0 };
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
