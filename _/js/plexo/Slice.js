/**
 * This file is part of PLEXO
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
 Slice
 ------------------------------------------------------------------------------------------------*/
/**
 * Displays an image on a canvas
 */
plx.Slice = function (dataset, filename, index) {

    this.dataset  = dataset;
    this.filename = filename;
    this.index     = index;

    this.url = this.dataset.url + '/' + this.filename;
    this.image   = new Image();
};



/**
 * Loads he image to display and tries to display it
 * @param filename
 */
plx.Slice.prototype.load = function () {
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

    xhr.open('GET', slice.url + '?v=' + Math.random()); //no cache
    xhr.responseType = 'blob';
    xhr.send();
};

/**
 * Checks if this is the current slice
 * @returns {boolean}
 */
plx.Slice.prototype.isCurrent = function (view) {
    return view.current_slice == this;
};

plx.Slice.prototype.updateLayer = function (view) {

    var ctx = view.ctx;

    /*----------------------------------------------------------*/
    // ALL CANVAS OPERATIONS OCCUR IN ORIGINAL IMAGE COORDINATES
    // Regardless of the current scaling of the canvas through CSS
    //
    // Canvas style      width and height -> determine appearance on screen
    //
    // WHEREAS:
    // Canvas properties width and height -> determine buffer operations
    /*----------------------------------------------------------*/
    var width  = this.image.width;
    var height = this.image.height;

    view.canvas.width = width;  //this resets the canvas state (content, transform, styles, etc).
    view.canvas.height = height;

    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);

    if (plx.zoom) {
        plx.zoom.apply(ctx);
    }

    plx.smoothingEnabled(ctx, false);
    ctx.drawImage(this.image, 0, 0, width, height);
    //this._debugZooom(ctx);

};

//plx.Slice.prototype._debugZoom = function(ctx){
//    var p1 = [150,150];
//    var p2 = [300,300];
//    ctx.fillStyle = '#FF0000';
//    ctx.beginPath();
//    ctx.arc(p1[0], p1[1], 5, 0, plx.PI2);
//    ctx.fill();
//    ctx.beginPath();
//    ctx.arc(p2[0], p2[1], 5, 0, plx.PI2);
//    ctx.fill();
//};
