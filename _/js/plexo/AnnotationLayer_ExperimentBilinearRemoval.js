/*-----------------------------------------------------------------------------------------------
 Annotation Layer
 ------------------------------------------------------------------------------------------------*/
/**
 * Represents the annotated slice. There can only be one at a time per slice.
 */
plx.AnnotationLayer = function (slice_id) {

    this.slice_id          = slice_id;

    this.canvas = document.createElement('canvas');
    this.ctx    = this.canvas.getContext('2d');

    this.stroke_canvas     = document.createElement('canvas');
    this.stroke_ctx        = this.stroke_canvas.getContext('2d');

    this.imageData         = undefined;

    this.lastX             = undefined;
    this.lastY             = undefined;

    this.undo_history      = new Array();
    this.redo_history      = new Array();
};

/**
 * Checks if this annotation layer is empty
 * @returns true or false
 */
plx.AnnotationLayer.prototype.isEmpty = function () {
    if (this.imageData == undefined) {
        //we have never annotated here
        return true;
    }
    var data = this.imageData.data;
    var maxR = 0, maxG = 0, maxB = 0, N = data.length;
    for (var i = 0; i < N; i += 4) {
        if (data[i] > maxR) {maxR = data[i];}
        if (data[i + 1] > maxG) {maxG = data[i + 1];}
        if (data[i + 2] > maxB) {maxB = data[i + 2];}
    }
    return (maxR == maxG && maxG == maxB & maxR == 0); //nothing ?
};

/**
 * Clears this annotation layer. The Undo/Redo history is cleared too.
 */
plx.AnnotationLayer.prototype.clearAnnotations = function () {
    if (this.imageData == undefined) {
        return;
    } //nothing here to clear

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.imageData    = undefined;
    this.undo_history = [];
    this.redo_history = [];
};

/**
 * Creates a new undo step with the current content of the annotation context
 */
plx.AnnotationLayer.prototype.saveUndoStep = function () {
    this.undo_history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    //console.debug('step saved. ' + this.undo_history.length + ' steps to undo');
};

/**
 * Sets the contents of the annotation layer to one step before in history
 * @returns {boolean}
 */
plx.AnnotationLayer.prototype.undo = function () {
    if (this.undo_history.length == 0) {
        console.warn(this.slice_id + ' nothing to undo here');
        return false;
    }
    var currentStep = this.undo_history.pop();
    this.redo_history.push(currentStep);

    var previousStep = this.undo_history[this.undo_history.length - 1];
    this.imageData   = previousStep;
    if (this.imageData == undefined) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    return true;
};

/**
 * Sets the contents of the annotation layer to one step further in history
 * @returns {boolean}
 */
plx.AnnotationLayer.prototype.redo = function () {

    if (this.redo_history.length == 0) {
        console.warn(this.slice_id + ' nothing to redo here');
        return false;
    }

    this.imageData = this.redo_history.pop();
    this.undo_history.push(this.imageData);
    this.ctx.putImageData(this.imageData, 0, 0);
    return true;
};

/**
 * Starts annotating
 * @param x coordinate x
 * @param y coordinate y
 * @param view corresponding view
 */
plx.AnnotationLayer.prototype.startAnnotation = function (x, y, view) {

    var brush  = plx.BRUSH;
    var eraser = plx.ERASER;

    /*---------------------------------------------*/
    // Propagate coordinates from background layer (image)
    /*---------------------------------------------*/
    this.canvas.width  = view.canvas.width;
    this.canvas.height = view.canvas.height;

    this.stroke_canvas.width = view.canvas.width;
    this.stroke_canvas.height = view.canvas.height;
    /*---------------------------------------------*/

    //this.ctx =this.canvas.getContext("2d");

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
            this.ctx.strokeStyle = plx.BRUSH.color;
            this.ctx.fillStyle   = plx.BRUSH.color;
            this.ctx.lineJoin    = brush.type;
            this.ctx.lineCap     = brush.type;
            this.ctx.lineWidth   = brush.size;

            this.stroke_ctx.strokeStyle = plx.BRUSH.color;
            this.stroke_ctx.fillStyle   = plx.BRUSH.color;
            this.stroke_ctx.lineJoin    = brush.type;
            this.stroke_ctx.lineCap     = brush.type;
            this.stroke_ctx.lineWidth   = brush.size;

            break;

        case plx.OP_DELETE:
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
            this.ctx.fillStyle   = 'rgba(0,0,0,1)';
            this.ctx.lineJoin    = eraser.type;
            this.ctx.lineCap     = eraser.type;
            this.ctx.lineWidth   = eraser.size;
            break;

        //case plx.OP_EROSION:
        //    break;
    }

    this.lastX = x;
    this.lastY = y;

    plx.smoothingEnabled(this.ctx, false);
    plx.smoothingEnabled(this.stroke_ctx, false);

    if (this.imageData) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(this.imageData, 0, 0); //adds the current annotations to the annotation context
    }

    this.stroke_ctx.clearRect(0,0,this.stroke_canvas.width, this.stroke_canvas.height); //unnecessary since we assigned
                                                                                        //dimensions before in this method but, just to be sure...

    this.redo_history = [];
};

plx.AnnotationLayer.prototype.updateAnnotation = function (curr_x, curr_y, view) {

    var ctx = this.ctx;
    var stroke_ctx = this.stroke_ctx;

    var brush  = plx.BRUSH;
    var eraser = plx.ERASER;
    var mouseX = curr_x;
    var mouseY = curr_y;
    var x1     = curr_x;
    var y1     = curr_y;
    var x2     = this.lastX;
    var y2     = this.lastY;
    var steep  = (Math.abs(y2 - y1) > Math.abs(x2 - x1));
    var bsize2 = brush.size * 2;
    var esize2 = eraser.size * 2;

    if (steep) {
        var x = x1;
        x1    = y1;
        y1    = x;
        var y = y2;
        y2    = x2;
        x2    = y;
    }
    if (x1 > x2) {
        var x = x1;
        x1    = x2;
        x2    = x;
        var y = y1;
        y1    = y2;
        y2    = y;
    }
    var dx    = x2 - x1,
        dy    = Math.abs(y2 - y1),
        error = 0,
        de    = dy / dx,
        yStep = -1,
        y     = y1;
    if (y1 < y2) {
        yStep = 1;
    }


    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE) {
        for (var x = x1; x < x2; x += 1) {
            if (brush.type == 'square') {
                if (steep) {
                    ctx.fillRect(y - brush.size, x - brush.size, bsize2, bsize2);
                    stroke_ctx.fillRect(y - brush.size, x - brush.size, bsize2, bsize2);
                }
                else {
                    ctx.fillRect(x - brush.size, y - brush.size, bsize2, bsize2);
                    stroke_ctx.fillRect(x - brush.size, y - brush.size, bsize2, bsize2);
                }
            }
            else {
                if (steep) {
                    stroke_ctx.beginPath();
                    stroke_ctx.arc(y, x, brush.size, 0, plx.PI2);
                    stroke_ctx.fill();
                    ctx.beginPath();
                    ctx.arc(y, x, brush.size, 0, plx.PI2);
                    ctx.fill();
                }
                else {
                    stroke_ctx.beginPath();
                    stroke_ctx.arc(x, y, brush.size, 0, plx.PI2);
                    stroke_ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x, y, brush.size, 0, plx.PI2);
                    ctx.fill();
                }
            }
            error += de;
            if (error >= 0.5) {
                y += yStep;
                error -= 1.0;
            }
        }
    }
    else if (plx.CURRENT_OPERATION == plx.OP_DELETE) {
        for (var x = x1; x < x2; x += 1) {
            if (steep) {
                ctx.clearRect(y - eraser.size, x - eraser.size, esize2, esize2);
            }
            else {
                ctx.clearRect(x - eraser.size, y - eraser.size, esize2, esize2);
            }
            error += de;
            if (error >= 0.5) {
                y += yStep;
                error -= 1.0;
            }
        }
    }

    this.lastX = mouseX;
    this.lastY = mouseY;

    var width  = this.canvas.width;
    var height = this.canvas.height;

    view.ctx.globalAlpha = 1;
    view.ctx.clearRect(0, 0, width, height);
    view.ctx.drawImage(view.current_slice.image, 0, 0, width, height);

    view.ctx.globalAlpha = plx.BRUSH.opacity;
    view.ctx.drawImage(this.canvas, 0, 0, width, height);
};

plx.AnnotationLayer.prototype.stopAnnotation = function () {

    var strokeImageData = this.stroke_ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    //here process data so the bilinear interpolation goes away.
    this.removeBilinearInterpolation(strokeImageData);

    this.stroke_ctx.putImageData(strokeImageData,0,0);

    //combine stroke_canvas image with current annotation canvas image before saving here.
    this.ctx.drawImage(this.stroke_canvas,0,0, this.stroke_canvas.width, this.stroke_canvas.height);

    var annotationImageData = this.ctx.getImageData(0,0, this.canvas.width, this.canvas.height);
    this.imageData = annotationImageData;

    this.saveUndoStep();

};

plx.AnnotationLayer.prototype.removeBilinearInterpolation = function (strokeImageData) {

    var data = strokeImageData.data;

    var N    = data.length;

    for (var i = 0; i < N; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        if (r == g && g == b & b == 0) {
            continue;
        }
        data[i] =  255-plx.BRUSH.r;
        data[i+1] = 255-plx.BRUSH.g;
        data[i+2] = 255-plx.BRUSH.b;
    }
}

plx.AnnotationLayer.prototype.updateLayer = function (view) {
    var view_ctx = view.ctx;
    var off_ctx  = this.ctx;

    off_ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.imageData) {

        plx.smoothingEnabled(off_ctx, false);
        off_ctx.putImageData(this.imageData, 0, 0);

        view_ctx.globalAlpha = plx.BRUSH.opacity;
        plx.smoothingEnabled(view_ctx, false);
        view_ctx.drawImage(this.canvas, 0, 0, view.canvas.width, view.canvas.height);


    }
};
