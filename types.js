/**
 * Custom CSS styles for the resize handle
 * @typedef {Object} handleStyles
 * @property {string} [width] - Width of the handle (for horizontal resizers)
 * @property {string} [height] - Height of the handle (for vertical resizers)
 * @property {string} [backgroundColor] - Background color of the handle
 * @property {string} [cursor] - Cursor style when hovering over the handle
 * @property {string} [borderRadius] - Border radius of the handle
 * @property {string} [boxShadow] - Box shadow of the handle
 * @property {string} [opacity] - Opacity of the handle
 * @property {string} [border] - Border styling of the handle
 * @property {string} [transition] - Transition effects for the handle
 * @property {string} [margin] - Margin around the handle
 * @property {string} [padding] - Padding inside the handle
 * @property {string} [background] - Background property (for gradients, images, etc.)
 * @property {string} [zIndex] - Z-index of the handle
 */

/**
 * Ways to change the behaviour of the resizer
 * @typedef {Object} resizerTwoOptions
 * @property {resizerTwoDirection} direction - The direction the resize should be either vertical or horizontal
 * @property {number} minFlex - The minimum flex of the children container can have between (0 and 1)
 * @property {handleStyles} [handleStyles] - Custom CSS styles to apply to the resize handle
 */

/**
 * The direction the resize can be
 * @typedef {"vertical" | "horizontal"} resizerTwoDirection
 */

/**
 * A callback to run when the resize logic is ran
 * @callback resizerTwoCallback
 * @returns {void} Nothing
 */
