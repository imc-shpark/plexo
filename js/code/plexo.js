/**
 * Created by dcantor on 20/10/15.
 */
var plx    = plx || {};
plx.PI2    = Math.PI * 2;
plx.BRUSH  = undefined;
plx.ERASER = undefined;
plx.LABELS = undefined;

plx.OP_ANNOTATE     = 'plx-op-annotate';
plx.OP_DELETE       = 'plx-op-delete';
plx.OP_EROSION      = 'plx-op-erosion';
plx.OP_PAINT_BUCKET = 'plx-op-paint-bucket';
plx.OP_ZOOM         = 'plx-op-zoom';
plx.OP_NONE         = 'plx-op-none';

plx.CURRENT_OPERATION = plx.OP_NONE;

plx.COORDINATES                     = {X: 0, Y: 0};
/**
 * Helper function to transform hex colors into rgb colors
 * @param hex
 * @returns {{r: Number, g: Number, b: Number}}
 */
plx.hex2rgb                         = function (hex) {
    hex   = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return {'r': r, 'g': g, 'b': b};
}
plx.rgb2hex                         = function (R, G, B) {
    function toHex(n) {
        n = parseInt(n, 10);
        if (isNaN(n)) {
            return "00";
        }
        n = Math.max(0, Math.min(n, 255));
        return "0123456789ABCDEF".charAt((n - n % 16) / 16)
            + "0123456789ABCDEF".charAt(n % 16);
    }

    return '#' + toHex(R) + toHex(G) + toHex(B);
};
plx.LabelSet                        = {}
plx.LabelSet.getLabelByIndex        = function (label_index) {
    if (label_index > 0 && label_index <= plx.LABELS.length) {
        return plx.LABELS[label_index - 1];
    }
    else {
        return undefined;
    }
};
plx.LabelSet.getLabelByID           = function (label_id) {
    var N = plx.LABELS.length;
    for (var i = 0; i < N; i += 1) {
        if (plx.LABELS[i].id == label_id) {
            return plx.LABELS[i];
        }
    }
    return undefined;
};

plx.Brush                           = function (size, opacity, type) {
    this.size     = size;
    this.opacity  = opacity;
    this.type     = type;
    this.comp     = 'lighten';
    this.color    = "rgba(0,0,0," + opacity + ')';
    this.r        = 0;
    this.g        = 0;
    this.b        = 0;
    this.label_id = undefined;
};

plx.Brush.prototype.getHexColor     = function () {
    return plx.rgb2hex(this.r, this.g, this.b);
};

plx.Brush.prototype.setColor        = function (hex) {
    var clr    = plx.hex2rgb(hex);
    this.r     = clr.r;
    this.g     = clr.g;
    this.b     = clr.b;
    this.color = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.opacity + ')';
};

plx.Brush.prototype.setOpacity      = function (opacity) {
    this.opacity = opacity;
    this.color   = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.opacity + ')';
};

plx.Brush.prototype.setLabelID      = function (label_id) {
    this.label_id = label_id;
    var label     = plx.LabelSet.getLabelByID(label_id);
    this.setColor(label.color);
    this.label_id = label.id;
};

plx.Brush.prototype.setLabelByIndex = function (label_index) {
    var label     = plx.LabelSet.getLabelByIndex(label_index);
    this.setColor(label.color);
    this.label_id = label.id;
};

plx.setGlobalBrush                  = function (brush) {
    plx.BRUSH = brush;
    return plx.BRUSH;
};

plx.Eraser                          = function (size) {
    this.size = size;
    this.type = 'square';
};

plx.setGlobalEraser                 = function (eraser) {
    plx.ERASER = eraser;
    return plx.ERASER;
};

plx.setGlobalLabels                 = function (labels) {
    plx.LABELS = labels;
    return plx.LABELS;
};

plx.setCurrentOperation             = function (operation) {

    plx.CURRENT_OPERATION = operation;
    console.debug('set operation: ' + plx.CURRENT_OPERATION);
};

/**
 * Displays an image on a canvas
 */
plx.Slice                           = function (uri, dataset) {
    this.dataset = dataset;
    this.uri     = uri;
    this.image   = new Image();
    this.index   = undefined; //given by the dataset
};
/**
 * Loads he image to display and tries to display it
 * @param filename
 */
plx.Slice.prototype.load            = function () {
    var slice              = this;
    var xhr                = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var url         = window.URL || window.webkitURL;
            slice.image.src = url.createObjectURL(this.response);
            if (slice.dataset != undefined) {
                slice.dataset.onLoadSlice(slice);
            }
        }
    }
    xhr.open('GET', slice.uri + '?1=' + Math.random());
    xhr.responseType       = 'blob';
    xhr.send();
};
/**
 * Checks if this is the current slice
 * @returns {boolean}
 */
plx.Slice.prototype.isCurrent       = function (view) {
    return view.currentSlice == this;
};

plx.Slice.prototype.updateLayer = function (view) {

    var ctx = view.ctx;

    /*----------------------------------------------------------*/
    // ALL CANVAS OPERATIONS MUST OCCUR IN ORIGINAL COORDINATES.
    // Regardless of the current scaling of the canvas through CSS
    // Canvas style      width and height -> determine appearance on screen
    // Canvas properties width and height -> determine buffer operations
    /*----------------------------------------------------------*/
    var width  = this.image.width;
    var height = this.image.height;

    view.canvas.width  = width;
    view.canvas.height = height;
    /*---------------------------------------------*/


    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);

    if (plx.zoom){
        plx.zoom.apply(ctx);
    }

    ctx.drawImage(this.image, 0, 0, width, height);
};

plx.Dataset = function (folder, start_item, end_item, step) {
    this.folder = folder;
    this.slices = []; //to do set operations
    this.slicemap = {}; //to quickly access a slice by index
    this.keys = []; //easy access to keys in the slicemap
    if (step == undefined || step <= 0) {
        step = 1;
    }
    for (var i = start_item; i <= end_item; i = i + step) {
        var filename     = folder + '/' + folder.substr(folder.lastIndexOf('/') + 1) + '_' + i + '.png';
        var slice        = new plx.Slice(filename, this);
        slice.index      = i;
        this.slices.push(slice);
        this.slicemap[i] = slice;
        this.keys.push(i);
    }
    this.num_items  = this.slices.length;
    this.num_loaded = 0;
    console.debug('dataset: ' + folder + ', number items: ' + this.num_items)
};

plx.Dataset.prototype.load = function (progress_callback) {
    this.progress_callback = progress_callback;
    this.num_loaded        = 0;
    for (var i = 0; i < this.num_items; i++) {
        this.slices[i].load();
    }
};

plx.Dataset.prototype.onLoadSlice = function (slice) {
    this.num_loaded++;
    if (this.num_loaded == this.num_items) {
        console.debug('all items loaded');
    }
    this.progress_callback(this);
};

plx.Dataset.prototype.hasLoaded = function () {
    return (this.num_loaded == this.num_items);
}
/**
 * Represents the annotated slice. There can only be one at a time per slice.
 */
plx.AnnotationLayer             = function (slice_id) {
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

    if (plx.zoom){
        this.lastX = ((this.lastX-plx.zoom.x)/ plx.zoom.factor) + plx.zoom.x;
        this.lastY = ((this.lastY-plx.zoom.y)/ plx.zoom.factor) + plx.zoom.y;
    }

    if (this.data) {
        this.ctx.clearRect(0, 0, this.offcanvas.width, this.offcanvas.height);
        this.ctx.putImageData(this.data, 0, 0);
    }

    this.redo_history = [];
    //console.debug('new operation. ' + plx.CURRENT_OPERATION + '. ' + this.undo_history.length + ' steps to undo. ' + this.redo_history.length + ' steps to redo.');
};

plx.AnnotationLayer.prototype.updateAnnotation = function (curr_x, curr_y, view) {

    var ctx    = this.ctx;

    if (plx.zoom){
        curr_x = ((curr_x-plx.zoom.x)/ plx.zoom.factor) + plx.zoom.x;
        curr_y = ((curr_y-plx.zoom.y)/ plx.zoom.factor) + plx.zoom.y;
    }


    var brush  = plx.BRUSH;
    var eraser = plx.ERASER;
    var mouseX = curr_x, mouseY = curr_y;
    var x1     = curr_x, x2 = this.lastX, y1 = curr_y, y2 = this.lastY;
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

plx.PaintBucket = function (annotation_layer) {

    //Info of the annotation layer
    this.annotation = annotation_layer;
    this.sizeX      = annotation_layer.offcanvas.width;
    this.sizeY      = annotation_layer.offcanvas.height;

    // create a local canvas and context
    this.buffer        = document.createElement("canvas");
    this.buffer.width  = this.sizeX;
    this.buffer.height = this.sizeY;

    this.ctx = this.buffer.getContext("2d");
    this.ctx.clearRect(0, 0, this.sizeX, this.sizeY);

    if (annotation_layer.data) {
        this.ctx.putImageData(annotation_layer.data, 0, 0); //copy the annotation data to the local context
    }
};

plx.PaintBucket.prototype.updateAnnotationLayer = function (view) {

    //clear layer
    var annotation_ctx = this.annotation.ctx;
    annotation_ctx.clearRect(0, 0, this.annotation.offcanvas.width, this.annotation.offcanvas.height);

    //initalize with previous data
    //if (this.annotation.data) {
    //    annotation_ctx.putImageData(this.annotation.data, 0, 0);
    //}

    //add current buffer
    //annotation_ctx.drawImage(this.buffer, 0, 0, this.sizeX, this.sizeY);
    var data = this.ctx.getImageData(0, 0, this.sizeX, this.sizeY);
    annotation_ctx.putImageData(data, 0, 0);

    //update data object
    this.annotation.data = annotation_ctx.getImageData(0, 0, this.annotation.offcanvas.width, this.annotation.offcanvas.height);
    //saveStep
    this.annotation.saveUndoStep();

    view.render();
};

plx.PaintBucket.prototype.fill = function (x, y, replacement_color) {

    var imdata = this.ctx.getImageData(0, 0, this.sizeX, this.sizeY);
    var width  = this.sizeX, height = this.sizeY;

    console.debug('paint bucket. coords: [',x,',',y,']');
    if (plx.zoom){
         x = Math.floor(((x-plx.zoom.x)/ plx.zoom.factor) + plx.zoom.x);
         y = Math.floor(((y-plx.zoom.y)/ plx.zoom.factor) + plx.zoom.y);
        console.debug('paint bucket. zoom-coords: [',x,',',y,']');
    }




    var posOri = (y * width) + x;
    var ori    = {
        'r': imdata.data[posOri * 4],
        'g': imdata.data[posOri * 4 + 1],
        'b': imdata.data[posOri * 4 + 2]
    };

    var origin_color = plx.rgb2hex(ori.r, ori.g, ori.b);

    /*if (origin_color == replacement_color && plx.CURRENT_OPERATION != plx.OP_DELETE){
     console.debug('same color, nothing to fill here');
     return;
     }*/

    var rep = plx.hex2rgb(replacement_color);

    console.debug('paint bucket. origin color:', origin_color, ' replacement color:', replacement_color);

    var queue = [[x, x, y, null, true, true]];

    var maxProcessed = 50000; //hard stop
    var countProcessed = 0;

    function paint(x, y) {
        var pos = (y * width) + x;
        if (plx.CURRENT_OPERATION != plx.OP_DELETE) {
            imdata.data[pos * 4]     = rep.r;
            imdata.data[pos * 4 + 1] = rep.g;
            imdata.data[pos * 4 + 2] = rep.b;
            imdata.data[pos * 4 + 3] = 255;
        }
        else {
            imdata.data[pos * 4]     = 0;
            imdata.data[pos * 4 + 1] = 0;
            imdata.data[pos * 4 + 2] = 0;
            imdata.data[pos * 4 + 3] = 0;
        }
    };

    function test(x, y) {
        var pos = (y * width) + x;
        return (imdata.data[pos * 4] == ori.r &&
        imdata.data[pos * 4 + 1] == ori.g &&
        imdata.data[pos * 4 + 2] == ori.b);

    };

    var queue = [{'xMin': x, 'xMax': x, 'y': y, 'direction': null, 'extendLeft': true, 'extendRight': true}];

    paint(x, y);

    var diagonal = true;

    while (queue.length) {

        var item = queue.pop();

        countProcessed++;

        if (countProcessed == maxProcessed) {
            console.info('processed ' + maxProcessed);
            console.info('stopping now');
            break;
        }

        var down = item.direction === true;
        var up   = item.direction === false;

        // extendLeft
        var minX = item.xMin;
        var y    = item.y;

        if (item.extendLeft) {
            while (minX >= 0 && test(minX - 1, y)) {
                minX--;
                paint(minX, y);
            }
        }

        var maxX = item.xMax;
        // extendRight
        if (item.extendRight) {
            while (maxX <= width - 1 && test(maxX + 1, y)) {
                maxX++;
                paint(maxX, y);
            }
        }

        if (diagonal) {
            // extend range looked at for next lines
            if (minX >= 0) {
                minX--;
            }
            if (maxX <= width) {
                maxX++;
            }
        }
        else {
            // extend range ignored from previous line
            item.xMin--;
            item.xMax++;
        }

        function addNextLine(newY, isNext, downwards) {
            var rMinX   = minX;
            var inRange = false;
            for (var x = minX; x <= maxX; x++) {
                // skip testing, if testing previous line within previous range
                var empty = (isNext || (x <= item.xMin || x >= item.xMax)) && test(x, newY);
                var empty = (isNext || (x <= item.xMin || x >= item.xMax)) && test(x, newY);
                if (!inRange && empty) {
                    rMinX   = x;
                    inRange = true;
                }
                else if (inRange && !empty) {

                    queue.push({'xMin': rMinX, 'xMax': x - 1, 'y': newY, 'direction': downwards, 'extendLeft': rMinX == minX, 'extendRight': false});
                    inRange = false;
                }
                if (inRange) {
                    paint(x, newY);
                }
                // skip
                if (!isNext && x == item.xMin) {
                    x = item.xMax;
                }
            }
            if (inRange) {

                queue.push({'xMin': rMinX, 'xMax': x - 1, 'y': newY, 'direction': downwards, 'extendLeft': rMinX == minX, 'extendRight': true});
            }
        }

        if (y < height-1) {
            addNextLine(y + 1, !up, true);
        }
        if (y > 0) {
            addNextLine(y - 1, !down, false);
        }
    }

    this.ctx.putImageData(imdata, 0, 0);
};


plx.Zoom = function(view){
    this.view = view;
    this.scaleFactor = 1.1;
    this.x = undefined;
    this.y = undefined;
    this.factor = 1;
    this.delta = 0;
};

plx.Zoom.prototype.setFocus = function(x,y){
    this.x = x;
    this.y = y;
}


plx.Zoom.prototype.zoom = function(delta){

    if (this.delta + delta < 0 || this.delta + delta > 30){
        return;
    }
    var ctx = this.view.ctx;

    this.delta += delta;
    this.factor = Math.pow(this.scaleFactor, this.delta);

};

plx.Zoom.prototype.apply = function(ctx){
    ctx.clearRect(0,0, this.view.canvas.width, this.view.canvas.height);
    ctx.translate(this.x,this.y);
    ctx.scale(this.factor,this.factor);
    ctx.translate(-this.x,-this.y);
}


plx.AnnotationSet = function (dataset_id, user_id, annotation_set_id, labelset_id) {
    this.annotations = {}; //dictionary containing the slice-uri, annotation slice object pairing.
};

plx.AnnotationSet.load = function (anset_url) {
    //loads an annotationset given the corresponding JSON file URL
    // the JSON file contains:
    //    the location of the dataset
    //    the user identifier
    //    the location of the annotated set
    //    the location of the label set
};

plx.AnnotationSet.prototype.save = function () {
    // Does two things:
    //  1. Saves a set of annotated images png to a writable location
    //  2. Writes the corresponding anset_url (so we can load this later on).
};

plx.AnnotationSet.prototype.getAnnotation = function (slice_uri) {
    var aslice = undefined;
    if (!(slice_uri in this.annotations)) {
        aslice                      = new plx.AnnotationLayer(slice_uri);
        this.annotations[slice_uri] = aslice;
    }
    else {
        aslice = this.annotations[slice_uri];
    }
    return aslice;
};

plx.AnnotationSet.prototype.hasAnnotation = function (slice_uri) {
    return (slice_uri in this.annotations);
};

/**
 * Responsible for rendering the layers in the appropriate order, and reflecting changes
 * when requested by the different layers.
 * @constructor
 */
plx.Renderer                  = function (view) {
    this.current = undefined;
    this.stacks  = {};
    this.view    = view;
};

plx.Renderer.BACKGROUND_LAYER = 0;
plx.Renderer.ANNOTATION_LAYER = 1;
plx.Renderer.TOOLS_LAYER      = 2;

plx.Renderer.prototype.addLayer = function (key, index, layer) {
    var stack = this.stacks[key];
    if (stack == undefined) {
        stack            = [];
        this.stacks[key] = stack;
    }

    stack.splice(index, 0, layer);
};

plx.Renderer.prototype.removeLayer = function (key, index) {
    var stack = this.stacks[key];
    if (stack == undefined) {
        console.warn('layer was not removed because the stack ' + key + ' does not exist');
        return;
    }
    stack.splice(index, 0);
};

plx.Renderer.prototype.setCurrentStack = function (key) {
    if (!(key in this.stacks)) {
        this.stacks[key] = [];
    }
    this.current = this.stacks[key];

};

plx.Renderer.prototype.update = function () {
    var stack = this.current;
    for (var i = 0; i < stack.length; i += 1) {
        stack[i].updateLayer(this.view);
    }
};

plx.View = function (canvas_id) {
    var canvas              = document.getElementById(canvas_id);
    canvas.style.width      = '100%';
    canvas.style.height     = '100%';
    canvas.style.cursor     = 'crosshair';
    canvas.width            = canvas.offsetWidth;
    canvas.height           = canvas.offsetHeight;
    this.canvas             = canvas;
    this.ctx                = canvas.getContext("2d");
    this.dataset            = undefined;
    this.aset               = undefined;
    this.interactor         = new plx.ViewInteractor(this);
    this.renderer           = new plx.Renderer(this);
    this.current_slice      = undefined;
    this.current_annotation = undefined;
    //this.fullscreen             = false;
};
//plx.View.prototype.clear = function () {
//    this.ctx.fillStyle = "#3e495f";
//    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
//};
plx.View.prototype.resizeTo = function (width, height) {
    this.canvas.width  = width;
    this.canvas.height = height;
};

plx.View.prototype.load = function (dataset, callback) {
    this.dataset = dataset;
    dataset.load(callback);
};

plx.View.prototype.render = function () {
    this.renderer.update();
};

/**
 *
 * @param slice
 */
plx.View.prototype.showSlice        = function (slice) {
    this.current_slice = slice;
    this.getCurrentAnnotationLayer();
    if (slice.stack == undefined) {
        this.renderer.addLayer(slice.uri, plx.Renderer.BACKGROUND_LAYER, this.current_slice);
        this.renderer.addLayer(slice.uri, plx.Renderer.ANNOTATION_LAYER, this.current_annotation);
        slice.stack = 'built';
    }

    this.resizeTo(slice.image.width, slice.image.height);
    this.renderer.setCurrentStack(slice.uri);
    this.renderer.update();
};
/**
 * Index in the dictionary (there could be missing indices if the
 * dataset is loaded with step != 1).
 * @param slice
 */
plx.View.prototype.showSliceByIndex = function (slice_index) {
    var slice = this.dataset.slicemap[slice_index];
    if (slice == undefined) {
        console.error('slice does not exist');
        return;
    }
    this.showSlice(slice);
};
plx.View.prototype.showMiddleSlice  = function () {
    var keys  = this.dataset.keys;
    var index = Math.floor(keys.length / 2);
    var slice = this.dataset.slicemap[keys[index]];
    this.showSlice(slice);
    return keys[index];
};
plx.View.prototype.showCurrentSlice = function () {
    this.showSlice(this.current_slice);
};

plx.View.prototype.showNextSlice = function () {
    var keys      = this.dataset.keys;
    var key       = this.current_slice.index;
    var index_key = keys.indexOf(key);
    var index     = undefined;
    if (index_key < keys.length - 1) {
        index = keys[index_key + 1];
        this.showSlice(this.dataset.slicemap[index]);
    }
    return index;
};

plx.View.prototype.showPreviousSlice = function () {
    var keys      = this.dataset.keys;
    var key       = this.current_slice.index;
    var index_key = keys.indexOf(key);
    var index     = undefined;
    if (index_key > 0) {
        index = keys[index_key - 1];
        this.showSlice(this.dataset.slicemap[index]);
    }
    return index;
};
//plx.View.prototype.showCurrentAnnotationSlice = function () {
//    this.currentAnnotationLayer.draw(this);
//}
plx.View.prototype.getAnnotationLayer        = function (slice_uri) {
    if (this.aset == undefined) { //@TODO: review hard code
        this.aset = new plx.AnnotationSet('spine_phantom_1', 'dcantor', '1', 'labels_spine');
    }
    var aset = this.aset;
    return aset.getAnnotationLayer(slice_uri);
};
plx.View.prototype.getCurrentAnnotationLayer = function () {

    /*--------------------------------------------------------------------------------------*/
    if (this.aset == undefined) { //@TODO: review hard code
        this.aset = new plx.AnnotationSet('spine_phantom_1', 'dcantor', '1', 'labels_spine');
    }
    /*--------------------------------------------------------------------------------------*/
    this.current_annotation = this.aset.getAnnotation(this.current_slice.uri);
    return this.current_annotation;
};

plx.View.prototype.undo = function () {
    var alayer      = this.current_annotation;
    var successFlag = alayer.undo();
    this.render();
    return successFlag; //false if nothing to undo
};

plx.View.prototype.redo = function () {
    var alayer      = this.current_annotation;
    var successFlag = alayer.redo();
    this.render();
    return successFlag;  //false if nothing to redo
};

plx.ViewInteractor = function (view) {
    this.dragging = false;
    this.view     = view;
    this.aslice   = undefined; //annotation slice
    this.observers = {};
};

plx.ViewInteractor.prototype.connectView = function () {
    var view            = this.view;
    var canvas          = this.view.canvas;
    var interactor      = this;
    canvas.onmousedown  = function (ev) { interactor.onMouseDown(ev); };
    canvas.onmouseup    = function (ev) { interactor.onMouseUp(ev); };
    canvas.onmousemove  = function (ev) { interactor.onMouseMove(ev); };
    canvas.onmouseleave = function (ev) { interactor.onMouseLeave(ev); };
    canvas.onwheel      = function (ev) { interactor.onWheel(ev);};
    canvas.addEventListener('dblclick', function (ev) { interactor.onDoubleClick(ev); });
    // canvas.addEventListener('touchstart', function (ev) { interactor.onTouchStart(ev); }, false);
    // canvas.addEventListener('touchmove', function (ev) { interactor.onTouchMove(ev); }, false);
    // canvas.addEventListener('touchend', function (ev) { interactor.onTouchEnd(ev); }, false);
    if (Hammer) {
        this._setHammerGestures;
    }
};

plx.ViewInteractor.prototype.addObserver = function (observer, kind) {
    var list = this.observers[kind];
    if (list == undefined) {
        list                 = [];
        this.observers[kind] = list;
    }

    if (list.indexOf(observer) < 0) {
        list.push(observer);
    }
};

plx.ViewInteractor.prototype.notify = function (kind, data) {
    var list = this.observers[kind];

    if (list == undefined) {
        return;
    } //no listeners for this

    for (var i = 0; i < list.length; i += 1) {
        list[i].processNotification(data);
    }
};

plx.ViewInteractor.prototype.onMouseDown = function (ev) {
    var view   = this.view,
        canvas = view.canvas,
        rect   = canvas.getBoundingClientRect(),
        x      = Math.round((ev.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
        y      = Math.round((ev.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);


    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE ||
        plx.CURRENT_OPERATION == plx.OP_DELETE) {
        this.dragging     = true;
        this.aslice       = view.current_annotation;
        this.aslice.startAnnotation(x, y, view);
        plx.COORDINATES.X = x;
        plx.COORDINATES.Y = y;
        this.notify('coordinates-event');
    }
    else if (plx.CURRENT_OPERATION == plx.OP_PAINT_BUCKET) {
        var aslice = this.view.getCurrentAnnotationLayer();
        plx.bucket = new plx.PaintBucket(aslice);
        plx.bucket.fill(x, y, plx.BRUSH.getHexColor());
        plx.bucket.updateAnnotationLayer(this.view);
    }
};

plx.ViewInteractor.prototype.onMouseMove = function (ev) {
    var view   = this.view,
        canvas = view.canvas,
        rect   = canvas.getBoundingClientRect(),
        x      = Math.round((ev.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
        y      = Math.round((ev.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);

    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE ||
        plx.CURRENT_OPERATION == plx.OP_DELETE) {
        if (this.dragging) {

            this.aslice.updateAnnotation(x, y, view);
        }
    }

    plx.COORDINATES.X = x;
    plx.COORDINATES.Y = y;
    this.notify('coordinates-event');
};

plx.ViewInteractor.prototype.onMouseUp     = function (ev) {
    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE ||
        plx.CURRENT_OPERATION == plx.OP_DELETE ) {
        if (this.dragging) {
            this.dragging = false;
            this.aslice.stopAnnotation();

        }
    }

};
plx.ViewInteractor.prototype.onMouseLeave  = function (ev) {
    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE ||
        plx.CURRENT_OPERATION == plx.OP_DELETE ||
        plx.CURRENT_OPERATION == plx.OP_EROSION) {
        if (this.dragging) {
            this.dragging = false;
        }
    }

};
/**
 *
 * @param ev
 */
plx.ViewInteractor.prototype.onDoubleClick = function (ev) {
    ev.preventDefault();

    //Quick paint bucket operation.

    var aslice = this.view.getCurrentAnnotationLayer();
    plx.bucket = new plx.PaintBucket(aslice);

    var view   = this.view,
        canvas = view.canvas,
        rect   = canvas.getBoundingClientRect(),
        x      = Math.round((ev.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
        y      = Math.round((ev.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);

    console.debug('double-click op:', plx.CURRENT_OPERATION);


    if (plx.CURRENT_OPERATION == plx.OP_PAINT_BUCKET ||
        plx.CURRENT_OPERATION == plx.OP_ANNOTATE     ||
        plx.CURRENT_OPERATION == plx.OP_ZOOM) {

        plx.bucket.fill(x, y, plx.BRUSH.getHexColor());
        plx.bucket.updateAnnotationLayer(this.view);
    }
    else if (plx.CURRENT_OPERATION == plx.OP_DELETE) {

        if (aslice.isEmpty()) {
            this.notify('alert-event', {'type': 'alert-info', 'title': 'Eraser', 'message': 'Nothing to erase'});
            return;
        }

        plx.bucket.fill(x, y, '#000000');
        plx.bucket.updateAnnotationLayer(this.view);
    }

    plx.COORDINATES.X = x;
    plx.COORDINATES.Y = y;

};

plx.ViewInteractor.prototype.onWheel       = function (ev) {

    ev.preventDefault();

    var direction = (ev.deltaY<0 || ev.wheelDeltaY>0) ? 1 : -1;


    if (!ev.ctrlKey && plx.CURRENT_OPERATION != plx.OP_ZOOM) {

        var slice = undefined;

        if (direction > 0) {
            slice = this.view.showPreviousSlice();
        }
        else if (direction < 0) {
            slice = this.view.showNextSlice();
        }
        this.view.render();
        this.notify('slice-change-event',{'slice':slice});
        return;
    }
    else{


        if (plx.zoom == undefined) {
            plx.zoom = new plx.Zoom(VIEW);
        }

        if (plx.zoom.factor == 1){
            plx.zoom.setFocus(plx.COORDINATES.X, plx.COORDINATES.Y);
        }

        var delta = direction;
        plx.zoom.zoom(delta);
        this.view.render();

    }

};
/*-----------------------------------------------------------------------------------------------
 Touch Events
 ------------------------------------------------------------------------------------------------*/
plx.ViewInteractor.prototype.onTouchStart = function (ev) {

    ev.preventDefault();
    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE ||
        plx.CURRENT_OPERATION == plx.OP_DELETE) {
        if (ev.targetTouches.length != 1) {
            return;
        }
        ev.stopPropagation();
        var view          = this.view;
        var canvas        = view.canvas;
        var rect          = canvas.getBoundingClientRect();
        var touch         = ev.targetTouches[0];
        plx.COORDINATES.X = Math.round((touch.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
        plx.COORDINATES.Y = Math.round((touch.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);

        this.aslice = view.getCurrentAnnotationLayer();
        this.aslice.startAnnotation(plx.COORDINATES.X, plx.COORDINATES.Y, view);

        //this.notify();
    }
};

plx.ViewInteractor.prototype.onTouchMove = function (ev) {

    var view          = this.view;
    var canvas        = view.canvas;
    var rect          = canvas.getBoundingClientRect();
    var touch         = ev.targetTouches[0];
    plx.COORDINATES.X = Math.round((touch.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    plx.COORDINATES.Y = Math.round((touch.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);

    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE ||
        plx.CURRENT_OPERATION == plx.OP_DELETE) {
        if (ev.targetTouches.length != 1) {
            return;
        }

        this.aslice.updateAnnotation(plx.COORDINATES.X, plx.COORDINATES.Y, view);

    }
    //this.notify();
};

plx.ViewInteractor.prototype.onTouchEnd = function (ev) {
    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE ||
        plx.CURRENT_OPERATION == plx.OP_DELETE) {
        this.aslice.stopAnnotation();
        this.view.render();
    }
};

plx.ViewInteractor.prototype._setHammerGestures = function () {

    console.debug('setting hammer gestures');

    this.mc = new Hammer.Manager(canvas);
    this.mc.add(new Hammer.Press({event: 'press', pointers: 1}));
    this.mc.add(new Hammer.Swipe({event: 'swipe', pointers: 1}));
    this.mc.add(new Hammer.Tap({event: 'doubletap', taps: 2}));

    this.mc.on('press', function (ev) {
        alert('OK');
        plx.setCurrentOperation(plx.OP_NONE);
    });
    this.mc.on('swiperight', function (ev) {
        if (plx.CURRENT_OPERATION == plx.OP_NONE) {
            view.showNextSlice();
        }
    });
    this.mc.on('swipeleft', function (ev) {
        if (plx.CURRENT_OPERATION == plx.OP_NONE) {
            view.showPreviousSlice();
        }
    });

    this.mc.on('doubletap tap', function (ev) {
        if (ev.taps == 2) {
            ev.preventDefault();
        }
    });
};

