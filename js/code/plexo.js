/**
 * Created by dcantor on 20/10/15.
 */

/**
 * Displays an image on a canvas
 */
function plxSlice(filename, dataset){
    this.filename= filename;
    this.image = new Image();
    this.loaded = false;
    this.dataset = dataset;
};


/**
 * Loads he image to display and tries to display it
 * @param filename
 */
plxSlice.prototype.load = function(){

    //this.image.src = this.filename; //@TODO we are not really checking that the file exists...
    var slice = this;
    /*this.image.onload = function(){
        slice.loaded = true;
        if (slice.dataset != undefined) {
            slice.dataset.onLoadSlice(slice);
        }
    };*/

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){

            var url = window.URL || window.webkitURL;
            slice.image.src = url.createObjectURL(this.response);

            if (slice.dataset != undefined) {
                slice.dataset.onLoadSlice(slice);
            }
        }
    }

    xhr.open('GET', slice.filename+'?1='+Math.random());
    xhr.responseType = 'blob';
    xhr.send();
};


/**
 * Checks if this is the current slice
 * @returns {boolean}
 */
plxSlice.prototype.isCurrent = function(view){
    return view.currentSlice == this;
};


function plxDataset(folder,start_item, end_item, step) {
    this.folder = folder;
    this.slices = [];   //to do set operations
    this.slicemap = {}; //to quickly access a slice by index

    if (step == undefined || step <=0) step = 1;

    for (var i=start_item; i<=end_item; i=i+step) {
        var filename = folder + '/' + folder.substr(folder.lastIndexOf('/') + 1) + '_' + i + '.png';
        var slice = new plxSlice(filename, this);
        this.slices.push(slice);
        this.slicemap[i] = slice;
    }
    this.num_items = this.slices.length;
    this.num_loaded = 0;
    console.debug('number items: '+this.num_items)
};


plxDataset.prototype.load = function(progress_callback) {
    this.progress_callback = progress_callback;

    for (var i=0; i<this.num_items; i++){
        this.slices[i].load();
    }


};

plxDataset.prototype.onLoadSlice = function(slice){
    this.num_loaded++;

    if (this.num_loaded == this.num_items){
        console.debug('all items loaded');
    }

    this.progress_callback(this);
};


function plxView(canvas_id){

    var canvas= document.getElementById(canvas_id);

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    this.canvas = canvas;
    this.ctx=canvas.getContext("2d");
    this.currentSlice = undefined;
};



plxView.prototype.clear = function(){
    this.ctx.fillStyle = "#3e495f";
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
};

plxView.prototype.resizeTo = function(width, height){
    this.canvas.width = width;
    this.canvas.height = height;
};

plxView.prototype.load = function(dataset, callback){
    this.dataset = dataset;
    dataset.load(callback);
}

plxView.prototype.showSliceByObject = function(slice){
    this.currentSlice = slice;
    this.resizeTo(slice.image.width, slice.image.height);
    this.ctx.drawImage(slice.image, 0, 0, this.canvas.width, this.canvas.height);

};

plxView.prototype.showSliceByIndex = function(slice_index, redraw){

    _redraw = redraw==undefined?false:redraw;

    var slice = this.dataset.slicemap[slice_index];

    if (slice == undefined){
        //console.error('slice does not exist');
        return;
    }

    if (this.currentSlice != slice){
        this.showSliceByObject(slice);
    }
    else if (this.currentSlice == slice && _redraw){
        this.showSliceByObject(slice);
    }
};


plxView.prototype.showMiddleSlice = function(){
    var index = Math.floor(this.dataset.slices.length/2);
    var slice = this.dataset.slices[index];
    this.showSliceByObject(slice);
    return index;
};

plxView.prototype.checkBounds = function(slice){
    //checks that a slice is visible without having to scroll (slice.height < window dimensions + penalty)
    //otherwise, resizes to window dimension + penalty
};

//after done resizing, draw update width and height with offsets




