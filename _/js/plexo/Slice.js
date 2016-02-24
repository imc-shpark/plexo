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
plx.Slice = function (dataset, filename, index, file_object) {

    this.dataset  = dataset;
    this.filename = filename;
    this.name     = filename.replace(/\.[^/.]+$/,"");

    this.index    = index;
    this.file_object = file_object;
    this.url   = this.dataset.url + '/' + this.filename;
    this.image = new Image();

    this.hasVideo = plx.VideoDelegate.canPlay(filename);

    if (this.hasVideo){
        this.video_delegate = new plx.VideoDelegate(this, this.file_object);
    }


};

plx.Slice.prototype.load_local = function () {

    var slice = this;

    if (this.hasVideo){
        this.video_delegate.load();
        slice.dataset.onLoadSlice(slice);
    }
    else {

        var reader    = new FileReader();
        reader.onload = function (e) {
            slice.image.src = reader.result;
            if (slice.dataset != undefined) {
                slice.dataset.onLoadSlice(slice);
            }
        };
        reader.readAsDataURL(this.file_object);
    }


};

plx.Slice.prototype.load_remote = function () {
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
    };

    xhr.open('GET', slice.url + '?v=' + Math.random()); //no cache
    xhr.responseType = 'blob';
    xhr.send();
};

/**
 * Loads he image to display and tries to display it
 * @param filename
 */
plx.Slice.prototype.load = function () {

    switch(this.dataset.select){
        case plx.Dataset.SELECT_LOCAL: this.load_local();break;
        default: this.load_remote(); break;
    }
};

/**
 * Checks if this is the current slice
 * @returns {boolean}
 */
plx.Slice.prototype.isCurrent = function (view) {
    return view.current_slice == this;
};



plx.Slice.prototype.updateLayer = function (view) {

    var ctx = view.ctx, width, height;

    //----------------------------------------------------------
    // ALL CANVAS OPERATIONS OCCUR IN ORIGINAL IMAGE COORDINATES
    // Regardless of the current scaling of the canvas through CSS
    //
    // Canvas style      width and height -> determine appearance on screen
    //
    // WHEREAS:
    // Canvas properties width and height -> determine buffer operations
    //----------------------------------------------------------
    if (this.image.width >0)  {
        width  = this.image.width;
    }
    else{
       // width = 500; //view.canvas.width;
    }
    if (this.image.height>0)  {
        height = this.image.height;
    }
    else{
       // height = 500; //view.canvas.height;
    }

    view.canvas.width = width;  //this resets the canvas state (content, transform, styles, etc).
    view.canvas.height = height;

    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);

    if (plx.zoom) {
        plx.zoom.apply(ctx);
    }



    plx.smoothingEnabled(ctx, false);

    if (!view.hasVideo()) {
        ctx.drawImage(this.image, 0, 0, width, height);
    }

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
