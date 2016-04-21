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
 Dataset
 ------------------------------------------------------------------------------------------------*/

plx.Dataset = function (url, storage, options) {

    this.url = url;

    this.storage = storage;
    this.options = options;
    this.slices  = []; //to do set operations
    
    this._slicemap = {}; // for private operations, to quickly access a slice by index
    this._keys = [];     // for private operations easy access to keys in the slicemap


    this._parseURL();
    this._populate();
};



plx.Dataset.STORAGE_LOCAL  = 'LOCAL';
plx.Dataset.STORAGE_REMOTE = 'REMOTE';

plx.Dataset.prototype.setView = function(view){
    this.view = view;
};

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

/**
 * Internal method that populates a dataset. Called in the constructor. The type of storage (LOCAL or REMOTE)
 * determines how the dataset is created. In any case, the task is delegated to each slice.
 * @private
 */
plx.Dataset.prototype._populate = function () {

    switch (this.storage) {
        case plx.Dataset.STORAGE_REMOTE:
            this._populateRemote();
            break;
        case plx.Dataset.STORAGE_LOCAL:
            this._populateLocal();
            break;
        default:
            throw ('plx.Dataset ERROR: kind of selection (' + this.source + ') unknown');
    }
};

/**
 * Uses the options passed as a parameter to the constructor of the dataset
 * to construct one url (filename) per slice. Then calls addSlice which will use ajax to
 * populate itself with the provided url (image).
 */
plx.Dataset.prototype._populateRemote = function () {

    var step  = this.options.step;
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
        this.addSlice(filename, index); //loads a slice from the filename
    }

    this.num_items  = this.slices.length;
    this.num_loaded = 0;

    console.debug('dataset url: ' + this.url + ', number items: ' + this.num_items);
};

/**
 * Assumes that a list of HTML5 File objects have been passed as part of the parameters
 * (options.files) in the constructor of the dataset.
 * Uses such list to populate slices. In turn, each slice useas a FileReader to load the
 * image from the given file.
 * @private
 */
plx.Dataset.prototype._populateLocal = function(){
    var dataset = this;
    var files = this.options.files;

    this.options.start = 1;
    this.options.end = files.length;
    this.step = 1;
    this.num_items = files.length;
    this.num_loaded = 0;

    for (var i= 0, f; file = files[i]; i++){
        this.addSlice(file.name, i+1, file); // Loads a slice with the HTML5 File object, one-based indexes rememeber
                                             // file can also be a HTML5 Image
    }
};


plx.Dataset.prototype.addSlice = function(filename, index, file_object){

    var slice    = new plx.Slice(this, filename, index, file_object);

    //Update Internal Collections
    this.slices.push(slice);
    this._slicemap[index] = slice;
    this._keys.push(index);
};


plx.Dataset.prototype.load = function (callback) {
    this.progress_callback = callback;
    this.num_loaded        = 0;
    for (var i = 0; i < this.num_items; i++) {
        this.slices[i].load();
    }
};

plx.Dataset.prototype.onLoadSlice = function (slice) {
    this.num_loaded++;
    if (this.num_loaded == this.num_items) {
        console.debug('all items loaded');
        this.view.interactor.notify(plx.EV_DATASET_LOADED, this);
    }
    this.progress_callback(this);
};

plx.Dataset.prototype.hasLoaded = function () {
    return (this.num_loaded == this.num_items);
};

/**
 * Quick random access thanks to the _slicemap dictionary.
 * @param index
 * @returns a slice
 */
plx.Dataset.prototype.getSliceByIndex = function(index){
   return this._slicemap[index]; 
};

plx.Dataset.prototype.getSliceByFilename = function(fname){
    var N = this.slices.length;
    for(var i=0;i<N;i++){
        if (this.slices[i].filename == fname){
            return this.slices[i];
        }
    }
    return null;
};


plx.Dataset.prototype.getSliceByName = function(name){
    var N = this.slices.length;
    for(var i=0;i<N;i++){
        if (this.slices[i].name == name){
            return this.slices[i];
        }
    }
    return null;
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

plx.Dataset.prototype.getNumSlices = function(){
    return this.slices.length;
};

plx.Dataset.prototype.getArrayPositionForIndex = function(index){

    for (var i= 0, N = this.slices.length; i<N; i+=1){
        if (this.slices[i].index == index){
            return i;
        }
    }
    return undefined;
};

plx.Dataset.prototype.getListIndices = function(){
    var list = [];
    for (var i= 0, N = this.slices.length; i<N; i+=1){
        list.push(this.slices[i].index);
    }
    return list;
};

plx.Dataset.prototype.getIndexSublist = function (from, to){

    var list = this.getListIndices();

    var posFrom = list.indexOf(from);
    var posTo   = list.indexOf(to);

    if (posFrom == -1 || posTo == -1){
        throw 'ERROR plx.Dataset.getIndices: indices do not exist';
    }
    return list.slice(posFrom, posTo+1);

};