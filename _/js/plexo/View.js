/*-----------------------------------------------------------------------------------------------
 View
 ------------------------------------------------------------------------------------------------*/
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

plx.View.prototype.showSlice = function (slice) {
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

plx.View.prototype.showMiddleSlice = function () {
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
plx.View.prototype.getAnnotationLayer = function (slice_uri) {
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

