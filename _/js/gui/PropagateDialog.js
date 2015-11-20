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
 Propagate DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.PropagateDialog = function (view) {
    this.view            = view;
    this._dialog         = $('#label-propagation-modal-id');
    this.used_labels_div = $('#used-labels-div-id');
    this.label_picker    = $('#propagate-label-selector-id');
    this.slider          = document.getElementById('propagate-slider-id');
    this.btn_ok          = $('#btn-ok-propagate-id');

    this.from_canvas_dom    = document.getElementById('from-canvas-id');
    this.current_canvas_dom = document.getElementById('current-canvas-id');
    this.to_canvas_dom      = document.getElementById('to-canvas-id');

    this.from_txt_dom    = document.getElementById('from-txt-id');
    this.current_txt_dom = document.getElementById('current-txt-id');
    this.to_txt_dom      = document.getElementById('to-txt-id');

    this.labels           = undefined;
    this.width            = 100;
    this.height           = 100;
    this.fromIndex        = undefined;
    this.toIndex          = undefined;
    this.imageData        = undefined;
    this.propagate_canvas = document.createElement('canvas');
    this.propagate_ctx    = this.propagate_canvas.getContext('2d');
    this._setup_events();
    this._setup_controls();

};

gui.PropagateDialog.prototype._setup_events = function () {

    var propagate_dialog = this;

    this._dialog.on('shown.bs.modal', function () {
        propagate_dialog.prepare();
        propagate_dialog._resize_preview();
        propagate_dialog._update_preview();

    });

    this._dialog.on('hidden.bs.modal', function () {
        propagate_dialog._clear_canvas();
    });

};

gui.PropagateDialog.prototype._setup_controls = function () {

    var propagate_dialog = this;

    this.from_ctx    = this.from_canvas_dom.getContext('2d');
    this.current_ctx = this.current_canvas_dom.getContext('2d');
    this.to_ctx      = this.to_canvas_dom.getContext('2d');

    this.btn_ok.click(function () {
        propagate_dialog.propagate();
    });

};

gui.PropagateDialog.prototype._prepare_label_picker = function () {

    var propagate_dialog = this;

    var selector = this.label_picker;
    if (selector.labelpicker)  selector.labelpicker('destroy');

    selector.off();
    selector.html('');

    var labels = this.view.current_annotation.getUsedLabels();

    $.each(labels, function () { selector.append($("<option />", {value: this.color, text: this.name, 'data-label-id': this.id})); });
    this.label_picker.labelpicker({'theme': 'fontawesome', 'list': true, 'multiple': true, 'noselected': true});

    if (labels.length <= 5) {
        this.used_labels_div.css('height', (labels.length * 40) + 20 + 'px');
    }
    else {
        this.used_labels_div.removeAttr('style');
    }

    selector.on('change', function () {

        var selected = $('#propagate-label-selector-id [selected]');
        var list     = [];

        for (var i = 0, N = selected.length; i < N; i += 1) {
            list.push(selected[i].getAttribute('data-label-id'));
        }

        var imData = propagate_dialog.view.current_annotation.getImageDataForLabels(list);
        propagate_dialog._update_canvas(imData);
        propagate_dialog._update_preview();

        return false;
    });
};

gui.PropagateDialog.prototype._prepare_preview_slider = function () {
    var ds            = this.view.dataset;
    var currentSlice  = this.view.current_slice;
    var N             = ds.getNumSlices();
    var list          = ds.getListIndices();
    var nextSlice     = ds.getNextSlice(currentSlice.index);
    var previousSlice = ds.getPreviousSlice(currentSlice.index);
    var initPos       = ds.getArrayPositionForIndex(currentSlice.index);
    var endPos        = initPos;

    this.current_txt_dom.innerHTML = currentSlice.index;
    this.fromIndex                 = currentSlice.index;
    this.toIndex                   = currentSlice.index;

    if (previousSlice) {
        this.fromIndex = previousSlice.index;
        initPos        = ds.getArrayPositionForIndex(previousSlice.index);
    }

    if (nextSlice) {
        this.toIndex = nextSlice.index;
        endPos       = ds.getArrayPositionForIndex(nextSlice.index);
    }

    this.from_txt_dom.innerHTML = this.fromIndex;
    this.to_txt_dom.innerHTML   = this.toIndex;

    if (this.slider.noUiSlider) {
        this.slider.noUiSlider.destroy();
    }

    var propagate_dialog = this;

    propagate_dialog._list = list;

    noUiSlider.create(this.slider, {
        start    : [0, N-1],   //original contiguous range
        behaviour: 'drag',
        connect  : true,
        range    : {
            'min': 0,     //contiguous range in list
            'max': N-1,  //contiguous range in list
        },
        tooltips : true,
        format   : {
            to  : function (value) { //position in list to slice index
                return propagate_dialog._list[Math.floor(parseInt(value))];

            },
            from: function (value) { //slice index to position in list
                return propagate_dialog._list.indexOf(parseInt(value));
            }
        }
    });

    this.slider.noUiSlider.set([this.fromIndex, this.toIndex]);

    this.slider.noUiSlider.on('slide', function (values, handle) {
        var index = values[handle];

        if (handle == 0) { //lower handle
            propagate_dialog.from_txt_dom.innerHTML = index;
            propagate_dialog.fromIndex              = index;
        }
        else { //upper handle
            propagate_dialog.to_txt_dom.innerHTML = index;
            propagate_dialog.toIndex              = index;
        }

        propagate_dialog._update_preview();
    });
};

gui.PropagateDialog.prototype._prepare_canvas = function(){
    this._clear_canvas();
};

gui.PropagateDialog.prototype.prepare = function () {
    this._prepare_label_picker();
    this._prepare_preview_slider();
    this._prepare_canvas();
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
    var as     = this.view.annotation_set;

    this.current_ctx.clearRect(0, 0, width, height);
    this.current_ctx.globalAlpha = 1;
    this.current_ctx.drawImage(this.view.current_slice.image, 0, 0, width, height);
    this.current_ctx.globalAlpha = plx.BRUSH.opacity;
    this.current_ctx.drawImage(this.view.current_annotation.canvas, 0, 0, width, height);

    var fromSlice = ds.getSliceByIndex(this.fromIndex);
    var toSlice   = ds.getSliceByIndex(this.toIndex);

    if (fromSlice) {
        this.from_ctx.globalAlpha = 1;
        this.from_ctx.clearRect(0, 0, width, height);
        this.from_ctx.drawImage(fromSlice.image, 0, 0, width, height);
        this.from_ctx.globalAlpha = plx.BRUSH.opacity;
        this.from_ctx.drawImage(as.getAnnotation(fromSlice).canvas, 0, 0, width, height);
        this.from_ctx.drawImage(this.propagate_canvas, 0, 0, width, height);
    }

    if (toSlice) {
        this.to_ctx.globalAlpha = 1;
        this.to_ctx.clearRect(0, 0, width, height);
        this.to_ctx.drawImage(toSlice.image, 0, 0, width, height);
        this.to_ctx.globalAlpha = plx.BRUSH.opacity;
        this.to_ctx.drawImage(as.getAnnotation(toSlice).canvas, 0, 0, width, height);
        this.to_ctx.drawImage(this.propagate_canvas, 0, 0, width, height);
    }
};

/**
 * propagate_canvas is the only canvas whose coordinates correspond to the data (slice).
 *
 * All the other canvases in this dialog have dimensions that correspond to the preview on screen.
 *
 * @param imdata
 * @private
 */
gui.PropagateDialog.prototype._update_canvas = function (imdata) {

    this.imageData               = imdata;
    this.propagate_canvas.width  = imdata.width;
    this.propagate_canvas.height = imdata.height;
    this.propagate_ctx.putImageData(imdata, 0, 0);

};

gui.PropagateDialog.prototype._clear_canvas = function () {
    if (this.imageData != undefined) {
        this.propagate_ctx.clearRect(0, 0, this.imageData.width, this.imageData.height);
    }
    this.imageData = undefined;
}

gui.PropagateDialog.prototype.propagate = function () {

    var fromIndex        = this.fromIndex;
    var toIndex          = this.toIndex;
    var indices          = this.view.dataset.getIndexSublist(fromIndex, toIndex);
    var aset             = this.view.annotation_set;
    var ds               = this.view.dataset;
    var propagate_canvas = this.propagate_canvas;

    function empty(element, index, array) {
        return element == 0;
    }

    if (this.imageData == undefined || this.imageData.data.every(empty)) {
        console.debug('Nothing to propagate here. Moving on.');
        return;
    }

    for (var i = 0, N = indices.length; i < N; i += 1) {
        var slice      = ds.getSliceByIndex(indices[i]);
        var annotation = aset.getAnnotation(slice);
        annotation.addAnnotationsFromCanvas(propagate_canvas);
    }
};

