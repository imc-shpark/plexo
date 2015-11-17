/*-----------------------------------------------------------------------------------------------
 Propagate DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.PropagateDialog = function (view) {
    this.view               = view;
    this._dialog            = $('#label-propagation-modal-id');
    this.used_labels_div    = $('#used-labels-div-id');
    this.label_picker       = $('#propagate-label-selector-id');
    this.slider             = document.getElementById('propagate-slider-id');
    this.btn_ok             = $('#btn-ok-propagate-id');
    this.from_canvas_dom    = document.getElementById('from-canvas-id');
    this.current_canvas_dom = document.getElementById('current-canvas-id');
    this.to_canvas_dom      = document.getElementById('to-canvas-id');
    this.labels             = undefined;
    this.width              = 100;
    this.height             = 100;
    this.fromIndex          = undefined;
    this.toIndex            = undefined;

    this._setup_events();
    this._setup_controls();

};

gui.PropagateDialog.prototype._setup_events = function () {

    var propagate_dialog = this;

    this._dialog.on('shown.bs.modal', function () {
        propagate_dialog.prepare();

        var index                  = propagate_dialog.view.current_slice.index;
        propagate_dialog.fromIndex = index;
        propagate_dialog.toIndex   = index;

        propagate_dialog._resize_preview();
        propagate_dialog._update_preview();

    });

    this._dialog.on('hidden.bs.modal', function () {

    });


};

gui.PropagateDialog.prototype._setup_controls = function () {

    this.from_ctx    = this.from_canvas_dom.getContext('2d');
    this.current_ctx = this.current_canvas_dom.getContext('2d');
    this.to_ctx      = this.to_canvas_dom.getContext('2d');

};

gui.PropagateDialog.prototype.prepare = function () {

    var selector = this.label_picker;
    if (selector.labelpicker)  selector.labelpicker('destroy');
    selector.html('');

    var labels = this.view.current_annotation.getUsedLabels();

    $.each(labels, function () { selector.append($("<option />", {value: this.color, text: this.name})); });
    this.label_picker.labelpicker({'theme': 'fontawesome', 'list': true, 'multiple': true, 'noselected': true});

    if (labels.length <= 5) {
        this.used_labels_div.css('height', (labels.length * 40) + 20 + 'px');
    }
    else {
        this.used_labels_div.removeAttr('style');
    }


    var firstSlice = this.view.dataset.getFirstSlice();
    var lastSlice = this.view.dataset.getLastSlice();
    var currentSlice = this.view.current_slice;


    if (this.slider.noUiSlider){
        this.slider.noUiSlider.destroy();
    }

    noUiSlider.create(this.slider,{
        start:[0, 0],
        connect: true,
        range:{
            'min': 0,
            'max': 0
        },
        tooltips:true

    });

    this.slider.noUiSlider.set([currentSlice.index, currentSlice.index])

};

gui.PropagateDialog.prototype._resize_preview = function () {

    var imageWidth  = this.view.current_slice.image.width;
    var imageHeight = this.view.current_slice.image.height;

    var aspectRatio = Math.round(imageWidth / imageHeight * 100) / 100;

    var height = parseInt($(this.current_canvas_dom).css('height'), 10);
    var width  = aspectRatio * height;

    //this.current_canvas_dom.style.height = height + 'px';
    //this.current_canvas_dom.style.width  = width + 'px';
    this.current_canvas_dom.height = height;
    this.current_canvas_dom.width  = width;

    //this.from_canvas_dom.style.height = height + 'px';
    //this.from_canvas_dom.style.width  = width + 'px';
    this.from_canvas_dom.height       = height;
    this.from_canvas_dom.width        = width;

    //this.to_canvas_dom.style.height = height + 'px';
    //this.to_canvas_dom.style.width  = width + 'px';
    this.to_canvas_dom.height = height;
    this.to_canvas_dom.width  = width;

    this.height = height;
    this.width  = width;

};

gui.PropagateDialog.prototype._update_preview = function () {

    var width  = this.width;
    var height = this.height;
    var ds     = this.view.dataset;
    var as     = this.view.aset;

    this.current_ctx.drawImage(this.view.current_slice.image, 0, 0, width, height);
    this.current_ctx.drawImage(this.view.current_annotation.canvas, 0, 0, width, height);

    var fromSlice = ds.getSliceByIndex(this.fromIndex);
    var toSlice   = ds.getSliceByIndex(this.toIndex);

    if (fromSlice) {
        this.from_ctx.drawImage(fromSlice.image, 0, 0, width, height);
        this.from_ctx.drawImage(as.getAnnotation(fromSlice).canvas, 0, 0, width, height);
    }

    if (toSlice) {
        this.to_ctx.drawImage(toSlice.image, 0, 0, width, height);
        this.to_ctx.drawImage(as.getAnnotation(toSlice).canvas, 0, 0, width, height);
    }
};



