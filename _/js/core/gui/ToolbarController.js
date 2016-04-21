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
 Toolbar Controller
 ------------------------------------------------------------------------------------------------*/
gui.ToolbarController = function (view) {
    this.view = view;
    view.interactor.addObserver(this, plx.EV_OPERATION_CHANGED);
    this._setup();
};

gui.ToolbarController.prototype._setup = function () {
    var controller = this;

    this.btn_labels       = $('#btn-labels-id');
    this.btn_brush        = $('#btn-brush-id');
    this.btn_eraser       = $('#btn-eraser-id');
    this.btn_undo         = $('#btn-undo-id');
    this.btn_redo         = $('#btn-redo-id');
    this.btn_paint_bucket = $('#btn-paint-bucket-id');
    this.btn_zoom         = $('#btn-zoom-id');
    this.btn_propagate    = $('#btn-propagate-id');


    this._setup_brush_button();
    this._setup_paint_bucket_button();
    this._setup_eraser_button();
    this._setup_zoom_button();
    this._setup_undo_button();
    this._setup_redo_button();
    this._setup_propagate_button();
};

/**
 * If the deviced is touch-enabled, this method will make sure that the buttons
 * are activated with touch and not with clicks. This improves the user interaction
 * since clicks are slow.
 *
 * There is one caveat: once the touch interface is enabled, the mouse clicks are disabled. Forever!
 * at least in this version.
 *
 * @param button
 * @param delegate
 * @private
 */
gui.ToolbarController.prototype._touchOrClick = function(button, delegate){

    if (button instanceof jQuery){
        button = button[0];
    }

    button.addEventListener('click', function(event){
        if (button.touched === true) return;
        delegate();
    });
    button.addEventListener('touchend', function(event){
        event.preventDefault();
        event.stopPropagation();
        delegate();
        button.touched = true;

    });
};


gui.ToolbarController.prototype._setup_brush_button = function () {

    this.btn_brush.click(function (event) {
        event.stopPropagation();
        gui.brush_dialog.select();
    });

    this.btn_brush.on('dblclick', function () {
        $('#brush-options-modal-id').modal('show');
    });

    var element = document.getElementById('btn-brush-id');

    element.addEventListener('touchstart', function (event) {
        event.preventDefault();
        event.stopPropagation();
        gui.brush_dialog.after_long_press(1000);
    }, false);

    element.addEventListener('touchend', function (event) {
        window.clearTimeout(gui.brush_dialog._long_press_timer);
        gui.brush_dialog.select();
    });

};

gui.ToolbarController.prototype._setup_paint_bucket_button = function () {
    var controller = this;

    function paint_bucket_function() {
        plx.setCurrentOperation(plx.OP_PAINT_BUCKET);
        controller.update_selected_tool(plx.OP_PAINT_BUCKET);
    }

    this._touchOrClick(this.btn_paint_bucket, paint_bucket_function);
};


gui.ToolbarController.prototype._setup_eraser_button = function () {

    this.btn_eraser.click(function (event) {
        event.stopPropagation();
        gui.eraser_dialog.select();
    });

    this.btn_eraser.on('dblclick', function () {
        $('#eraser-options-modal-id').modal('show');
    });

    var element = this.btn_eraser[0]; //pulling the dom object out of the jquery object;

    element.addEventListener('touchstart', function (event) {
        event.preventDefault();
        event.stopPropagation();
        gui.eraser_dialog.after_long_press(1000);
    }, false);

    element.addEventListener('touchend', function (event) {
        window.clearTimeout(gui.eraser_dialog._long_press_timer);
        gui.eraser_dialog.select();
    });

};

gui.ToolbarController.prototype._setup_zoom_button = function () {
    var controller = this;

    function activate_zoom(){
        if (plx.CURRENT_OPERATION != plx.OP_ZOOM) {
            plx.setCurrentOperation(plx.OP_ZOOM);
            controller.update_selected_tool(plx.OP_ZOOM);
        }
        else {
            plx.setCurrentOperation(plx.OP_PANNING);
            controller.update_selected_tool(plx.OP_PANNING);
        }
    }

    this._touchOrClick(this.btn_zoom, activate_zoom);
};

gui.ToolbarController.prototype._setup_undo_button = function () {
    var controller = this;

    function undo(){
        if (!controller.view.undo() && gui.alert) {
            gui.alert.showAlert('Undo', 'Nothing to undo', 'alert-info');
        }
        else {
            controller.update_selected_tool('undo');
        }
    }

    this._touchOrClick(this.btn_undo, undo);
};

gui.ToolbarController.prototype._setup_redo_button = function () {
    var controller = this;

    function redo(){
        if (!controller.view.redo() && gui.alert) {
            gui.alert.showAlert('Redo', 'Nothing to redo', 'alert-info');
        }
        else {
            controller.update_selected_tool('redo');
        }
    }

    this._touchOrClick(this.btn_redo, redo);
};


gui.ToolbarController.prototype._setup_propagate_button = function(){

    var controller = this;

    function show_propagate_dialog(){
        var labels = controller.view.current_annotation.getUsedLabels();
        if (labels.length == 0){
            gui.alert.showAlert('Annotation empty',
                'The current slice does not have any annotations',
                'alert-warning'
            );
        }
        else{
            $('#label-propagation-modal-id').modal('show');
        }
    }
    this._touchOrClick(controller.btn_propagate, show_propagate_dialog);

    /*this.btn_propagate[0].addEventListener('click', function(event){
        event.preventDefault();
        event.stopPropagation();
        show_propagate_dialog();
    });

    this.btn_propagate[0].addEventListener('touchend', function(event){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        show_propagate_dialog();
    })*/


};

gui.ToolbarController.prototype.update_selected_tool = function (last_used) {

    $('.btn-icon-active').removeClass('btn-icon-active');
    this.btn_zoom.html("<i class='fa fa-search'></i>");

    switch (last_used) {
        case plx.OP_ANNOTATE:
            this.btn_brush.addClass('btn-icon-active');
            break;
        case plx.OP_DELETE:
            this.btn_eraser.addClass('btn-icon-active');
            break;
        case plx.OP_PAINT_BUCKET:
            this.btn_paint_bucket.addClass('btn-icon-active');
            break;
        case plx.OP_ZOOM:
            this.btn_zoom.addClass('btn-icon-active').html("<i class='fa fa-search'></i>");
            break;
        case plx.OP_PANNING:
            this.btn_zoom.addClass('btn-icon-active').html("<i class='fa fa-arrows'></i>");
            break;
        case 'undo':
            this.btn_undo.addClass('btn-icon-active');
            break;
        case 'redo':
            this.btn_redo.addClass('btn-icon-active');
            break;
    }
};

gui.ToolbarController.prototype.processNotification = function (kind,data) {
    var op = data.operation;
    this.update_selected_tool(op);
};

gui.ToolbarController.prototype.update_brush = function () {
    this.btn_brush.css('color', BRUSH.color);
    var label = plx.LABELS.getLabelByID(BRUSH.label_id);
    $('#status-current-label-id').html(label.id +' : '
        +label.name
        +'  (' + BRUSH.size + ', ' + BRUSH.type + ', ' + BRUSH.getHexColor() + ')');
};

gui.ToolbarController.prototype.update_eraser = function () {
    $('#status-current-label-id').html('Eraser [' + ERASER.size + ']');

};