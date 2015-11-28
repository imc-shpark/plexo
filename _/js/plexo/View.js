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
    this.annotation_set     = undefined;
    this.interactor         = new plx.ViewInteractor(this);
    this.renderer           = new plx.Renderer(this);
    this.current_slice      = undefined;
    this.current_annotation = undefined;
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
    if (slice.stack === undefined) {
        this.renderer.addLayer(slice.url, plx.Renderer.BACKGROUND_LAYER, this.current_slice);
        this.renderer.addLayer(slice.url, plx.Renderer.ANNOTATION_LAYER, this.current_annotation);
        slice.stack = 'built';
    }

    this.resizeTo(slice.image.width, slice.image.height);
    this.renderer.setCurrentStack(slice.url);
    this.renderer.update();
};

/**
 * Index in the dictionary (there could be missing indices if the
 * dataset is loaded with step != 1).
 * @param index
 */
plx.View.prototype.showSliceByIndex = function (index) {

    var slice = this.dataset.getSliceByIndex(index);

    if (slice == undefined) {
        console.error('slice does not exist');
        return;
    }
    this.showSlice(slice);
};

plx.View.prototype.showMiddleSlice = function () {
    var slice = this.dataset.getMiddleSlice();
    this.showSlice(slice);
    return slice.index;
};

plx.View.prototype.showCurrentSlice = function () {
    this.showSlice(this.current_slice);
};

plx.View.prototype.showNextSlice = function () {

    var index       = this.current_slice.index;
    var nextSlice = this.dataset.getNextSlice(index);

    if (nextSlice != undefined) {
        this.showSlice(nextSlice);
        return nextSlice.index;
    }
    return index; //can't move next, return current index
};

plx.View.prototype.showPreviousSlice = function () {

    var index       = this.current_slice.index;
    var previousSlice = this.dataset.getPreviousSlice(index);

    if (previousSlice != undefined) {
        this.showSlice(previousSlice);
        return previousSlice.index;
    }
    return index; //can't move to previous, return current index
};


plx.View.prototype.getCurrentAnnotationLayer = function () {

    /*--------------------------------------------------------------------------------------*/
    if (this.annotation_set == undefined) {
        this.annotation_set = new plx.AnnotationSet(this);
    }
    /*--------------------------------------------------------------------------------------*/
    this.current_annotation = this.annotation_set.getAnnotation(this.current_slice); //for now the filename is the id.
    this.current_annotation.setView(this);
    return this.current_annotation;
};

plx.View.prototype.undo = function () {
    var annotation_layer      = this.current_annotation;
    var successFlag = annotation_layer.undo();
    if (successFlag) {
        this.render();
    }
    return successFlag; //false if nothing to undo
};

plx.View.prototype.redo = function () {
    var annotation_layer      = this.current_annotation;
    var successFlag = annotation_layer.redo();
    if (successFlag){
        this.render();
    }
    return successFlag;  //false if nothing to redo
};

