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
    this.from_txt_dom       = document.getElementById('from-txt-id');
    this.current_txt_dom    = document.getElementById('current-txt-id');
    this.to_txt_dom         = document.getElementById('to-txt-id');
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

gui.PropagateDialog.prototype._prepare_label_picker = function(){

    var propagate_dialog = this;

    var selector = this.label_picker;
    if (selector.labelpicker)  selector.labelpicker('destroy');

    selector.off();
    selector.html('');

    var labels = this.view.current_annotation.getUsedLabels();

    $.each(labels, function () { selector.append($("<option />", {value: this.color, text: this.name, 'data-label-id':this.id})); });
    this.label_picker.labelpicker({'theme': 'fontawesome', 'list': true, 'multiple': true, 'noselected': true});

    if (labels.length <= 5) {
        this.used_labels_div.css('height', (labels.length * 40) + 20 + 'px');
    }
    else {
        this.used_labels_div.removeAttr('style');
    }

    selector.on('change', function(){
        var selected = $('#propagate-label-selector-id [selected]');

        if (selected.length == 0){
            console.debug('none');
        }

        var list = [];

        for (var i= 0, N = selected.length; i<N; i+=1){
            list.push(selected[i].getAttribute('data-label-id'));
        }
        console.debug('selected labels: '+list);

        var imData = propagate_dialog.view.current_annotation.getImageDataForLabels(list);

        var canvas = document.createElement('canvas');
        var ctx   = canvas.getContext('2d');
        var width = propagate_dialog.to_canvas_dom.width;
        var height = propagate_dialog.to_canvas_dom.height;

        canvas.width =  imData.width;
        canvas.height = imData.height;

        ctx.putImageData(imData,0,0);

        propagate_dialog.to_ctx.drawImage(canvas, 0,0, width, height);

        return false;
    });
};

gui.PropagateDialog.prototype._prepare_preview_slider = function(){
    var ds           = this.view.dataset;
    var currentSlice = this.view.current_slice;
    var N            = ds.getNumSlices();
    var i            = ds.getArrayPositionForIndex(currentSlice.index);
    var list         = ds.getListIndices();

    this.from_txt_dom.innerHTML    = currentSlice.index;
    this.current_txt_dom.innerHTML = currentSlice.index;
    this.to_txt_dom.innerHTML      = currentSlice.index;

    if (this.slider.noUiSlider) {
        this.slider.noUiSlider.destroy();
    }

    var propagate_dialog = this;

    propagate_dialog._list = list;

    noUiSlider.create(this.slider, {
        start    : [i, i],
        behaviour: 'drag',
        connect  : true,
        range    : {
            'min': 0,
            'max': N - 1,
        },
        tooltips : true,
        format   : {
            to  : function (value) { //position to slice index
                return propagate_dialog._list[Math.floor(parseInt(value))];

            },
            from: function (value) { //slice index to position
                return propagate_dialog._list.indexOf(parseInt(value));
            }
        }
    });

    this.slider.noUiSlider.set([currentSlice.index, currentSlice.index]);

    this.slider.noUiSlider.on('slide', function (values, handle) {
        var index = values[handle];

        if (handle == 0) { //lower handle
            propagate_dialog.from_txt_dom.innerHTML = index;
            propagate_dialog.fromIndex = index;
        }
        else { //upper handle
            propagate_dialog.to_txt_dom.innerHTML = index;
            propagate_dialog.toIndex = index;
        }

        propagate_dialog._update_preview();
    });
};

gui.PropagateDialog.prototype.prepare = function () {
    this._prepare_label_picker();
    this._prepare_preview_slider();
};

gui.PropagateDialog.prototype._resize_preview = function () {

    var imageWidth  = this.view.current_slice.image.width;
    var imageHeight = this.view.current_slice.image.height;

    var aspectRatio = Math.round(imageWidth / imageHeight * 100) / 100;

    var height = parseInt($(this.current_canvas_dom).css('height'), 10);
    var width  = aspectRatio * height;

    this.current_canvas_dom.height = height;
    this.current_canvas_dom.width  = width;

    this.from_canvas_dom.height = height;
    this.from_canvas_dom.width  = width;

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



