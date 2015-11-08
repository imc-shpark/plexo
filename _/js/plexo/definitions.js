var plx = plx || {};

plx.PI2         = Math.PI * 2;
plx.COORDINATES = {X: 0, Y: 0};
plx.GUI_TOUCH   = false;
plx.BRUSH       = undefined;
plx.ERASER      = undefined;
plx.LABELS      = undefined;

/*-----------------------------------------------------------------------------------------------
 Operations
 ------------------------------------------------------------------------------------------------*/
plx.OP_ANNOTATE     = 'plx-op-annotate';
plx.OP_DELETE       = 'plx-op-delete';
plx.OP_EROSION      = 'plx-op-erosion';
plx.OP_PAINT_BUCKET = 'plx-op-paint-bucket';
plx.OP_ZOOM         = 'plx-op-zoom';
plx.OP_PANNING      = 'plx-op-panning';
plx.OP_NONE         = 'plx-op-none';

plx.CURRENT_OPERATION = plx.OP_NONE;

plx.setCurrentOperation = function (operation) {

    plx.CURRENT_OPERATION = operation;
    console.debug('set operation: ' + plx.CURRENT_OPERATION);
};

plx.setCurrentCoordinates = function (x, y) {
    plx.COORDINATES.X = x;
    plx.COORDINATES.Y = y;
}
/*-----------------------------------------------------------------------------------------------
 EVENTS
 ------------------------------------------------------------------------------------------------*/
plx.EV_SLICE_CHANGED  = 'plx-ev-slice-changed';
plx.EV_COORDS_UPDATED = 'plx-ev-coords-updated';

/*-----------------------------------------------------------------------------------------------
  Utilities
 ------------------------------------------------------------------------------------------------*/

function message(text) {
    document.getElementById('status-message-id').innerHTML = text;
};

/**
 * Detects if the device is touch-enabled
 */
window.addEventListener('touchstart', function setHasTouch() {
    plx.GUI_TOUCH = true;
    console.debug('touch device detected');
    window.removeEventListener('touchstart', setHasTouch);
});


