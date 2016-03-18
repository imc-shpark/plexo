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
 BRUSH MODAL DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.BrushDialog = function (view) {
    this.view = view;

    this._dialog               = $('#brush-options-modal-id');
    this._brush_size_slider    = document.getElementById('brush-size-slider-id');
    this._brush_opacity_slider = document.getElementById('brush-opacity-slider-id');
    this._current_label_text   = $('#current-label-text-id');
    this.btn_load_labels       = $('#btn-load-labels-id');
    this._setup_controls();
    this._setup_load_labels();
    this._setup_events();
};

gui.BrushDialog.prototype._setup_controls = function () {

    var brush_dialog = this;

    $('#brush-shape-circle-id').click(function () {
        BRUSH.type = 'round';
        //$('.simplecolorpicker span.color').css('border-radius','30px')
        brush_dialog.update_brush_preview();
    });

    $('#brush-shape-square-id').click(function () {
        BRUSH.type = 'square';
        //$('.simplecolorpicker span.color').css('border-radius','5px')
        brush_dialog.update_brush_preview();
    });

    noUiSlider.create(this._brush_size_slider, {
        tooltips: true,
        start   : 6,
        step    : 1,
        range   : {
            'min': 1,
            'max': 12
        },
        connect : 'lower',
        format  : wNumb({decimals: 0})
    });

    this._brush_size_slider.noUiSlider.on('slide', function (values, handle) {
        var value  = parseInt(values[handle]);
        BRUSH.size = value;
        brush_dialog.update_brush_preview();
    });

    noUiSlider.create(this._brush_opacity_slider, {
        tooltips: true,
        start   : 0.5,
        step    : 0.05,
        range   : {
            'min': [0.1],
            'max': [1]
        },
        connect : 'lower',
        format  : wNumb({decimals: 2})
    });

    this._brush_opacity_slider.noUiSlider.on('slide', function (values, handle) {
        var value = parseFloat(values[handle]);
        BRUSH.setOpacity(value);
        brush_dialog.update_brush_preview();
    });


};

gui.BrushDialog.prototype._setup_load_labels = function(){

    var self = this;

    var loadLabelsLink = $('#load-labels-link-id');

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        loadLabelsLink.html('File API not supported in this browser');
        loadLabelsLink.off('click');
        return;
    }

    var fileSelector = document.createElement('input');
    fileSelector.id = 'labels-uploader-dialog-id';
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept','.json');
    loadLabelsLink.click(function(){
        fileSelector.click(); return false;
    });


    function handleFiles(ev){
        var files = ev.target.files;
        self.file = files[0];
        self.loadLabels();
    }

    fileSelector.addEventListener('change', handleFiles, false);
};

gui.BrushDialog.prototype._setup_events = function () {
    var brush_dialog = this;

    this._dialog.on('show.bs.modal', function () {
        brush_dialog.update_color_picker();
        brush_dialog.update_sliders();
        brush_dialog.update_brush_preview();
    });

    this._dialog.on('shown.bs.modal', function () {
        brush_dialog.select();
    });

    this._dialog.on('hidden.bs.modal', function () {
        brush_dialog.select();
    });

};

gui.BrushDialog.prototype.after_long_press = function (delay) {
    function deferred_execution() {
        $('#brush-options-modal-id').modal('show');
    }

    this._long_press_timer = window.setTimeout(deferred_execution, delay);
};

gui.BrushDialog.prototype.update_sliders = function () {
    this._brush_size_slider.noUiSlider.set(BRUSH.size);
    this._brush_opacity_slider.noUiSlider.set(BRUSH.opacity);
};

gui.BrushDialog.prototype.update_brush_preview = function () {
    var canvas = document.getElementById('brush-canvas-id');
    var ctx    = canvas.getContext("2d");

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius  = BRUSH.size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_checkboard_canvas(canvas, 6, 6);

    ctx.fillStyle = BRUSH.color;

    if (BRUSH.type == 'round') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
    }
    else {
        var x1, y1, p;
        p  = radius;
        x1 = centerX - p;
        y1 = centerY - p;
        ctx.fillRect(x1, y1, p * 2, p * 2);
    }
};

gui.BrushDialog.prototype.update_color_picker = function () {

    var brush_dialog = this;
    var labels       = LABELS;
    var widget       = $('#brush-color-id');

    //Custom code to setup the color picker
    widget.simplecolorpicker('destroy');
    widget.html('');
    $.each(labels, function () { widget.append($("<option />", {value: this.color, text: this.id})); });
    $("#brush-color-id option").filter(function () { return this.text == BRUSH.label_id; }).attr('selected', 'selected');

    widget.simplecolorpicker().on('change', function () {
        var current_label_id = $(this).find(':selected').text();
        BRUSH.setLabelID(current_label_id);
        brush_dialog._current_label_text.html(BRUSH.getLabelName());
        brush_dialog.update_brush_preview();
    });

    //Setting the current label id

    if (BRUSH.label_id == undefined) {
        BRUSH.setLabelID(LABELS[0].id);
        this._current_label_text.html(BRUSH.getLabelName());
    }
    else {
        this._current_label_text.html(BRUSH.getLabelName());
    }

    if (gui.toolbar) {
        gui.toolbar.update_brush();
    }
};

gui.BrushDialog.prototype.select = function () {
    plx.setCurrentOperation(plx.OP_ANNOTATE);
    if (gui.toolbar) {
        gui.toolbar.update_brush();
        gui.toolbar.update_selected_tool(plx.OP_ANNOTATE);
    }
};

gui.BrushDialog.prototype.loadLabels = function(){
    var reader = new FileReader();
    var self = this;

    reader.onload = function(e){
        try{
            var json_object = JSON.parse(e.target.result);

            plx.LABELS = new plx.LabelSet(undefined, json_object);
            LABELS = plx.LABELS.getLabels();
            self.update_color_picker();
        }
        catch(ex){
            alert('Error reading file ' + self.file.name+ ' : '+ ex.message);
        }

    };

    reader.readAsText(self.file);
};