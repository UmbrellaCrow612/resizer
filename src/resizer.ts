
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
 */
class Resizer {

    /**
     * API 
     * 
     * dispose
     * 
     * onResize 
     * 
     * onBeginDrag
     * 
     * onDrag -> accept callback
     * 
     * onDragFinished -> accept callback
     * 
     * onDragPast(how many pixels user drags past the min flex) -> call a callback
     * 
     * 
     */
}