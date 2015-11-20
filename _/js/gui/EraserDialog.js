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
 ERASER MODAL DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.EraserDialog = function(view){
    this.view = view;
    this._dialog = $('#eraser-options-modal-id');
    this._eraser_size_slider = document.getElementById('eraser-size-slider-id');
    this._btn_clear_slice = $('#btn-clear-slice-id');
    this._setup_controls();
    this._setup_events();
};


gui.EraserDialog.prototype._setup_controls = function(){

    var eraser_dialog = this;

    noUiSlider.create(this._eraser_size_slider, {
        tooltips: true,
        start:5,
        step: 1,
        range:{
            'min':1,
            'max':20
        },
        connect:'lower',
        format: wNumb({decimals:0})
        /* pips:{
         mode:'positions',
         values: [0,50,100]
         },*/
    });

    this._eraser_size_slider.noUiSlider.on('slide', function(values,handle){
        ERASER.size = parseInt(values[handle]);
        eraser_dialog.update_eraser_preview();
    });


   this._btn_clear_slice.click(function () {
        var layer = VIEW.getCurrentAnnotationLayer();
        if (layer.isEmpty() && gui.alert) {
            gui.alert.showAlert('Delete', 'The layer is empty, nothing to delete', 'alarm-info');
        }
        else {
            layer.clearAnnotations();
            eraser_dialog.view.render();
        }
    });
};

gui.EraserDialog.prototype._setup_events = function(){

    var eraser_dialog = this;

    this._dialog.on('show.bs.modal', function (event) {
        eraser_dialog._eraser_size_slider.noUiSlider.set(ERASER.size);
        eraser_dialog.update_clear_slice_button();
        eraser_dialog.update_eraser_preview();
    });

    this._dialog.on('shown.bs.modal', function () {
       eraser_dialog.select();
    });

    this._dialog.on('hidden.bs.modal', function () {
        eraser_dialog.select();
    });

};

gui.EraserDialog.prototype.after_long_press = function (delay) {
    function deferred_execution() {
        $('#eraser-options-modal-id').modal('show');
    }

    this._long_press_timer = window.setTimeout(deferred_execution, delay);
};

gui.EraserDialog.prototype.update_eraser_preview = function(){
    var canvas = document.getElementById('eraser-canvas-id');
    var ctx    = canvas.getContext("2d");

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius  = ERASER.size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_checkboard_canvas(canvas, 6, 6);

    ctx.fillStyle = "#000";

    var x1, y1, p;
    p  = radius;
    x1 = centerX - p;
    y1 = centerY - p;
    ctx.fillRect(x1, y1, p * 2, p * 2);
};

gui.EraserDialog.prototype.update_clear_slice_button = function() {
    var alayer = this.view.getCurrentAnnotationLayer();
    if (alayer.isEmpty()) {
        this._btn_clear_slice.hide();
    }
    else {
        this._btn_clear_slice.show();
    }
};

gui.EraserDialog.prototype.select = function(){
    plx.setCurrentOperation(plx.OP_DELETE);
    if (gui.toolbar) {
        gui.toolbar.update_eraser();
        gui.toolbar.update_selected_tool(plx.OP_DELETE);
    }
}