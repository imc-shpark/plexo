/**
 * This file is part of PLEXO
 *
 * Author: Diego Cantor
 *
 * PLEXO is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation
 *
 * PLEXO is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PLEXO.  If not, see <http://www.gnu.org/licenses/>.
 */
/*-----------------------------------------------------------------------------------------------
 Paint Bucket
 ------------------------------------------------------------------------------------------------*/
plx.PaintBucket = function (annotation_layer) {

    //Info of the annotation layer
    this.annotation = annotation_layer;
    this.sizeX      = annotation_layer.canvas.width;
    this.sizeY      = annotation_layer.canvas.height;

    // create a local canvas and context
    this.buffer        = document.createElement("canvas");
    this.buffer.width  = this.sizeX;
    this.buffer.height = this.sizeY;

    this.ctx = this.buffer.getContext("2d");


    this.ctx.clearRect(0, 0, this.sizeX, this.sizeY);

    if (annotation_layer.imageData) {
        plx.smoothingEnabled(this.ctx, false);
        this.ctx.putImageData(annotation_layer.imageData, 0, 0); //copy the annotation data to the local context
    }
};

plx.PaintBucket.prototype.fill = function (x, y, replacement_color) {

    var imdata       = this.ctx.getImageData(0, 0, this.sizeX, this.sizeY),
        bucket       = this,

        width        = this.sizeX,
        height       = this.sizeY,
        startX       = x,
        startY       = y,

        posOri       = (y * width) + x,

        ori          = {
            'r': imdata.data[posOri * 4],
            'g': imdata.data[posOri * 4 + 1],
            'b': imdata.data[posOri * 4 + 2]
        },

        origin_color = plx.rgb2hex(ori.r, ori.g, ori.b),
        rep = plx.hex2rgb(replacement_color),


        maxProcessed = 50000, //hard stop
        countProcessed = 0;

    console.debug('paint bucket. origin color:', origin_color, ' replacement color:', replacement_color);

    /*if (origin_color == replacement_color && plx.CURRENT_OPERATION != plx.OP_DELETE){
     console.debug('same color, nothing to fill here');
     return;
     }*/


    function getColor(x, y) {
        var pos = (y * width) + x;
        return [
            imdata.data[pos * 4],
            imdata.data[pos * 4 + 1],
            imdata.data[pos * 4 + 2]
        ];
    }

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

    function test(x, y) { //check if the color is not any of the labels or zero
        var pos = (y * width) + x;

        var r = imdata.data[pos * 4];
        var g = imdata.data[pos * 4 + 1];
        var b = imdata.data[pos * 4 + 2];

        if ((Math.abs(r-ori.r) +  Math.abs(g-ori.g) +  Math.abs(b -ori.b) ) <= 10) { //tolerance :10
            return true;  //Empty, good to fill
        }
        else {
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
        var minX = item.xMin;
        var y    = item.y;

        if (item.extendLeft) { // extendLeft
            while (minX >= 0 && test(minX - 1, y)) {
                minX--;
                paint(minX, y);
            }

        }

        var maxX = item.xMax;

        if (item.extendRight) { // extendRight
            while (maxX <= width - 1 && test(maxX + 1, y)) {
                maxX++;
                paint(maxX, y);
            }

        }

        if (diagonal) {             // extend range looked at for next lines
            if (minX >= 0) {
                minX--;
            }
            if (maxX <= width) {
                maxX++;
            }
        }
        else { // extend range ignored from previous line
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



    this._updateAnnotation(imdata);
};


plx.PaintBucket.prototype._updateAnnotation = function (imdata) {

    this.ctx.putImageData(imdata, 0, 0);

    //clear layer
    var annotation_ctx = this.annotation.ctx;
    annotation_ctx.clearRect(0, 0, this.annotation.canvas.width, this.annotation.canvas.height);

    var data = this.ctx.getImageData(0, 0, this.sizeX, this.sizeY);
    annotation_ctx.putImageData(data, 0, 0);

    //update annotation
    this.annotation.saveAnnotation();
};

//plx.PaintBucket.prototype._debug = function(imdata){
//    this.ctx.putImageData(imdata, 0, 0);
//    this.updateAnnotationLayer(VIEW);
//    VIEW.render();
//    var x = 0;
//};
