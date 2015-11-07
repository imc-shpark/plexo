/*-----------------------------------------------------------------------------------------------
 Annotation Layer
 ------------------------------------------------------------------------------------------------*/
/**
 * Represents the annotated slice. There can only be one at a time per slice.
 */
plx.AnnotationLayer = function (slice_id) {
    this.slice_id     = slice_id;
    this.offcanvas    = document.createElement("canvas");
    this.ctx          = this.offcanvas.getContext("2d");
    this.data         = undefined;
    this.lastX        = undefined;
    this.lastY        = undefined;
    this.undo_history = new Array();
    this.redo_history = new Array();
};

plx.AnnotationLayer.prototype.isEmpty = function () {
    if (this.data == undefined) {
        //we have never annotated here
        return true;
    }
    var imdata = this.data.data;
    var maxR   = 0, maxG = 0, maxB = 0, N = imdata.length;
    for (var i = 0; i < N; i += 4) {
        if (imdata[i] > maxR) {maxR = imdata[i];}
        if (imdata[i + 1] > maxG) {maxG = imdata[i + 1];}
        if (imdata[i + 2] > maxB) {maxB = imdata[i + 2];}
    }
    return (maxR == maxG && maxG == maxB & maxR == 0); //nothing ?
};

plx.AnnotationLayer.prototype.clearAnnotations = function () {
    if (this.data == undefined) {
        return;
    } //nothing here to clear

    this.ctx.clearRect(0, 0, this.offcanvas.width, this.offcanvas.height);
    this.data         = undefined;
    this.undo_history = [];
    this.redo_history = [];
};

plx.AnnotationLayer.prototype.saveUndoStep = function () {
    this.undo_history.push(this.ctx.getImageData(0, 0, this.offcanvas.width, this.offcanvas.height));
    //console.debug('step saved. ' + this.undo_history.length + ' steps to undo');
};

plx.AnnotationLayer.prototype.undo = function () {
    if (this.undo_history.length == 0) {
        console.warn(this.slice_id + ' nothing to undo here');
        return false;
    }
    var currentStep  = this.undo_history.pop();
    this.redo_history.push(currentStep);
    var previousStep = this.undo_history[this.undo_history.length - 1];
    this.data        = previousStep;
    if (this.data == undefined) {
        this.ctx.clearRect(0, 0, this.offcanvas.width, this.offcanvas.height);
        this.data = this.ctx.getImageData(0, 0, this.offcanvas.width, this.offcanvas.height);
    }
    this.ctx.putImageData(this.data, 0, 0);
    return true;
    //console.debug('undo. ' + this.undo_history.length + ' steps to undo. ' + this.redo_history.length + ' steps to redo.');
};

plx.AnnotationLayer.prototype.redo = function () {
    if (this.redo_history.length == 0) {
        console.warn(this.slice_id + ' nothing to redo here');
        return false;
    }
    this.data = this.redo_history.pop();
    this.undo_history.push(this.data);
    this.ctx.putImageData(this.data, 0, 0);
    //console.debug('redo. ' + this.undo_history.length + ' steps to undo. ' + this.redo_history.length + ' steps to redo.');
    return true;
};

plx.AnnotationLayer.prototype.startAnnotation = function (x, y, view) {
    var brush  = plx.BRUSH;
    var eraser = plx.ERASER;

    /*---------------------------------------------*/
    // Propagate coordinates from background layer (image)
    /*---------------------------------------------*/
    this.offcanvas.width  = view.canvas.width;
    this.offcanvas.height = view.canvas.height;
    /*---------------------------------------------*/

    //this.ctx = this.offcanvas.getContext("2d");

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
            this.ctx.strokeStyle = plx.BRUSH.color;
            this.ctx.fillStyle   = plx.BRUSH.color;
            this.ctx.lineJoin    = brush.type;
            this.ctx.lineCap     = brush.type;
            this.ctx.lineWidth   = brush.size;
            break;
        case plx.OP_DELETE:
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
            this.ctx.fillStyle   = 'rgba(0,0,0,1)';
            this.ctx.lineJoin    = eraser.type;
            this.ctx.lineCap     = eraser.type;
            this.ctx.lineWidth   = eraser.size;
            break;
        case plx.OP_EROSION:
            break;
    }
    this.lastX = x;
    this.lastY = y;

    //if (plx.zoom) {
    //    var coords = plx.zoom.transformPoint(this.lastX, this.lastY);
    //    this.lastX = coords[0]; //x
    //    this.lastY = coords[1]; //y
    //}

    if (this.data) {
        this.ctx.clearRect(0, 0, this.offcanvas.width, this.offcanvas.height);
        this.ctx.putImageData(this.data, 0, 0);
    }

    this.redo_history = [];
    //console.debug('new operation. ' + plx.CURRENT_OPERATION + '. ' + this.undo_history.length + ' steps to undo. ' + this.redo_history.length + ' steps to redo.');
};

plx.AnnotationLayer.prototype.updateAnnotation = function (curr_x, curr_y, view) {

    var ctx = this.ctx;

    //if (plx.zoom) {
    //    var coords = plx.zoom.transformPoint(curr_x,curr_y);
    //    curr_x = coords[0]; //x
    //    curr_y = coords[1]; //y
    //}

    var brush  = plx.BRUSH;
    var eraser = plx.ERASER;
    var mouseX = curr_x;
    var mouseY = curr_y;
    var x1     = curr_x;
    var y1     = curr_y;
    var x2     = this.lastX;
    var y2     = this.lastY;
    var steep  = (Math.abs(y2 - y1) > Math.abs(x2 - x1));
    //var imdata = ctx.getImageData(0, 0, this.offcanvas.width, this.offcanvas.height);

    function cneighbours(x, y, radio) {
        var pos = [];
        for (var i = -radio; i < radio; i++) {
            for (var j = -radio; j < radio; j++) {
                pos.push(4 * (y * width + x));
            }
        }
        return pos;
    };
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
    var bsize2 = brush.size * 2;
    var esize2 = eraser.size * 2;
    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE) {
        for (var x = x1; x < x2; x += 1) {
            if (brush.type == 'square') {
                if (steep) {
                    ctx.fillRect(y - brush.size, x - brush.size, bsize2, bsize2);
                }
                else {
                    ctx.fillRect(x - brush.size, y - brush.size, bsize2, bsize2);
                }
            }
            else {
                if (steep) {
                    ctx.beginPath();
                    ctx.arc(y, x, brush.size, 0, plx.PI2);
                    ctx.fill();
                }
                else {
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
    /*else if (plx.CURRENT_OPERATION == plx.OP_EROSION) {
     for (var x = x1; x < x2; x += 1) {
     var vecindad = [];
     if (steep) {
     vecindad = cneighbours(x, y, 5);
     //pos = (x * width + y) * 4;
     }
     else {
     //pos = (y * width + x) * 4;
     vecindad = cneighbours(y, x, 5);
     }
     for (var i = 0; i < vecindad.length; i++) {
     var pos = vecindad[i];
     var r   = imdata.data[pos];
     var g   = imdata.data[pos + 1];
     var b   = imdata.data[pos + 2];
     if (r > 0 || g > 0 || b > 0) {
     imdata.data[pos] = 255;
     }
     }
     error += de;
     if (error >= 0.5) {
     y += yStep;
     error -= 1.0;
     }
     }
     this.ctx.putImageData(imdata, 0, 0);
     }*/
    this.lastX = mouseX;
    this.lastY = mouseY;

    var width  = this.offcanvas.width;
    var height = this.offcanvas.height;

    view.ctx.globalAlpha = 1;
    view.ctx.clearRect(0, 0, width, height);
    view.ctx.drawImage(view.current_slice.image, 0, 0, width, height);
    view.ctx.globalAlpha = plx.BRUSH.opacity;
    view.ctx.drawImage(this.offcanvas, 0, 0, width, height);
};

plx.AnnotationLayer.prototype.stopAnnotation = function () {
    this.data = this.ctx.getImageData(0, 0, this.offcanvas.width, this.offcanvas.height);
    this.saveUndoStep();
};

plx.AnnotationLayer.prototype.updateLayer = function (view) {
    var view_ctx = view.ctx;
    var off_ctx  = this.ctx;

    off_ctx.clearRect(0, 0, this.offcanvas.width, this.offcanvas.height);

    if (this.data) {
        off_ctx.putImageData(this.data, 0, 0);
        view_ctx.globalAlpha = plx.BRUSH.opacity;
        view_ctx.drawImage(this.offcanvas, 0, 0, view.canvas.width, view.canvas.height);
    }
};
