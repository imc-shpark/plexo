/*-----------------------------------------------------------------------------------------------
 Dataset
 ------------------------------------------------------------------------------------------------*/
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
};
