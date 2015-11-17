/*-----------------------------------------------------------------------------------------------
 Dataset
 ------------------------------------------------------------------------------------------------*/

plx.Dataset = function (url, select, options) {

    this.url = url;

    this.select  = select;
    this.options = options;
    this.slices  = []; //to do set operations
    
    this._slicemap = {}; // for private operations, to quickly access a slice by index
    this._keys = [];     // for private operations easy access to keys in the slicemap


    this._parseURL();
    this._populate();
};

plx.Dataset.SELECT_ALL     = 'all';
plx.Dataset.SELECT_SINGLE  = 'single';
plx.Dataset.SELECT_INDEXED = 'indexed';

plx.Dataset.prototype._parseURL = function () {
    var link      = document.createElement('a');
    link.href     = this.url;  //initalize with the url passed initially (might be a relative one_

    this.hostname = link.hostname;
    this.port     = link.port;
    this.pathname = link.pathname;
    this.protocol = link.protocol;

    this.url = link.href; //now the url is completed

    this.name =  this.url.substr(this.url.lastIndexOf('/') + 1);
};

plx.Dataset.prototype._populate = function () {

    switch (this.select) {
        case plx.Dataset.SELECT_INDEXED:
            this._populateIndexed();
            break;
        default:
            throw ('plx.Dataset ERROR: kind of selection (' + this.source + ') unknown');
    }
};

/**
 * Look for files in the given dataset folder (url) whose name is equal to the dataset with the suffix '_i.png</i>
 * where 'i' is a number.
 *
 * An indexed dataset requires a start, step and end parameters to be passed in the options (see constructor).
 *
 */
plx.Dataset.prototype._populateIndexed = function () {

    var step  = 1 || this.options.step;
    var start = this.options.start;
    var end   = this.options.end;

    if (step <= 0) {
        step = 1;
        console.warn('changing step to 1 (negative steps are not allowed)');
    }

    if (start > end) {
        throw 'plx.Dataset ERROR: start index must be lower than end index';
    }

    var baseurl = this.url;

    for (var index = start; index <= end; index = index + step) {

        var filename = baseurl.substr(baseurl.lastIndexOf('/') + 1) + '_' + index + '.png';
        this.addSlice(filename, index);
    }

    this.num_items  = this.slices.length;
    this.num_loaded = 0;

    console.debug('dataset url: ' + this.url + ', number items: ' + this.num_items);
};


plx.Dataset.prototype.addSlice = function(filename, index){

    var slice    = new plx.Slice(this, filename, index);

    //Update Internal Collections
    this.slices.push(slice);
    this._slicemap[index] = slice;
    this._keys.push(index);
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

plx.Dataset.prototype.getSliceByIndex = function(index){
   return this._slicemap[index]; 
};


plx.Dataset.prototype.getMiddleSlice = function(){
    var index = Math.floor(this._keys.length / 2);
    return this._slicemap[this._keys[index]];
};


plx.Dataset.prototype.getNextSlice = function(index){
    var keys      = this._keys;
    var i       = keys.indexOf(index);
    var next_index     = undefined;

    if (i < keys.length - 1) {
        next_index = keys[i + 1];
        return this._slicemap[next_index];
    }

    return undefined;
};

plx.Dataset.prototype.getPreviousSlice = function(index){
    var keys      = this._keys;
    var i       = keys.indexOf(index);
    var previous_index     = undefined;

    if (i > 0) {
        previous_index = keys[i - 1];
        return this._slicemap[previous_index];
    }

    return undefined;

};

plx.Dataset.prototype.getFirstSlice = function(){
    return this.slices[0];
};

plx.Dataset.prototype.getLastSlice = function(){
    return this.slices[this.slices.length-1];

};