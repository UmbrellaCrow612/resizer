/**
 * Custom CSS styles for the resize handle
 */
type handleStyles = {
    /**
     * - Width of the handle (for horizontal resizers)
     */
    width?: string | undefined;
    /**
     * - Height of the handle (for vertical resizers)
     */
    height?: string | undefined;
    /**
     * - Background color of the handle
     */
    backgroundColor?: string | undefined;
    /**
     * - Cursor style when hovering over the handle
     */
    cursor?: string | undefined;
    /**
     * - Border radius of the handle
     */
    borderRadius?: string | undefined;
    /**
     * - Box shadow of the handle
     */
    boxShadow?: string | undefined;
    /**
     * - Opacity of the handle
     */
    opacity?: string | undefined;
    /**
     * - Border styling of the handle
     */
    border?: string | undefined;
    /**
     * - Transition effects for the handle
     */
    transition?: string | undefined;
    /**
     * - Margin around the handle
     */
    margin?: string | undefined;
    /**
     * - Padding inside the handle
     */
    padding?: string | undefined;
    /**
     * - Background property (for gradients, images, etc.)
     */
    background?: string | undefined;
    /**
     * - Z-index of the handle
     */
    zIndex?: string | undefined;
};
/**
 * Ways to change the behaviour of the resizer
 */
type resizerTwoOptions = {
    /**
     * - The direction the resize should be either vertical or horizontal
     */
    direction: resizerTwoDirection;
    /**
     * - The minimum flex of the children container can have between (0 and 1)
     */
    minFlex: number;
    /**
     * - Custom CSS styles to apply to the resize handle
     */
    handleStyles?: handleStyles | undefined;
};
/**
 * The direction the resize can be
 */
type resizerTwoDirection = "vertical" | "horizontal";
/**
 * A callback to run when the resize logic is ran
 */
type resizerTwoCallback = () => void;
//# sourceMappingURL=types.d.ts.map