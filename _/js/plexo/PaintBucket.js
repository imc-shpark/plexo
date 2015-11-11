/*-----------------------------------------------------------------------------------------------
 Paint Bucket
 ------------------------------------------------------------------------------------------------*/
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

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    var imdata = this.ctx.getImageData(0, 0, this.sizeX, this.sizeY);
    var width  = this.sizeX, height = this.sizeY;

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

    function getColor(x,y){
        var pos = (y * width) + x;
        return [
            imdata.data[pos * 4],
        imdata.data[pos * 4 + 1],
        imdata.data[pos * 4 + 2]
        ];
    }

    var bucket = this;



    function test(x, y) { //check if the color is not any of the labels or zero
        var pos = (y * width) + x;

        var r = imdata.data[pos * 4];
        var g = imdata.data[pos * 4 + 1];
        var b = imdata.data[pos * 4 + 2];

        if (r == ori.r && g == ori.g && b == ori.b){
            return true;  //Empty, good to fill
        }
        else{
            /*var label = plx.LABELS.getLabelByRGBColor(r,g,b);
            if (label === undefined){
                getColor(x,y);
                //this voxel does not contain a label, it must be an artifact
                bucket.debug(imdata);
                return true;
            }
            else {
                getColor(x,y);
                bucket.debug(imdata);
                return false; //the voxel contains a label. stop.
            }*/
            return false;
        }





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

        if (y < height - 1) {
            addNextLine(y + 1, !up, true);

        }
        if (y > 0) {
            addNextLine(y - 1, !down, false);

        }
    }

    this.ctx.putImageData(imdata, 0, 0);
};

plx.PaintBucket.prototype.debug = function(imdata){
    this.ctx.putImageData(imdata, 0, 0);
    this.updateAnnotationLayer(VIEW);
    var x = 0;
};
