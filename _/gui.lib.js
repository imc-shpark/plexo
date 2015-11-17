/**
* GUI
* Created by Diego Cantor
* (c) 2015 and onwards
*/

//@koala-append "definitions.js"
//@koala-append "Utilities.js"
//@koala-append "BrushDialog.js"
//@koala-append "EraserDialog.js"
//@koala-append "PropagateDialog.js"
//@koala-append "DownloadAnnotationsDialog.js"
//@koala-append "Keyboard.js"
//@koala-append "CoordinatesTracker.js"
//@koala-append "AlertController.js"
//@koala-append "SliceController.js"
//@koala-append "ToolbarController.js"
//@koala-append "Gui.js"





var VIEW, BRUSH, ERASER, LABELS;

BRUSH  = plx.setGlobalBrush(new plx.Brush(5, 0.5, 'round'));
ERASER = plx.setGlobalEraser(new plx.Eraser(10));
LABELS = {};

var gui = {} || gui; //gui namespace


/*-----------------------------------------------------------------------------------------------
 UTILITIES
 ------------------------------------------------------------------------------------------------*/
function draw_checkboard_canvas(canvas, nRow, nCol) {
    var ctx        = canvas.getContext("2d");
    var p          = document.createElement('canvas');
    p.width        = 2 * canvas.width / nRow;
    p.height       = 2 * canvas.height / nCol;
    var pctx       = p.getContext('2d');
    pctx.fillStyle = "rgb(200, 200, 200)";
    pctx.fillRect(0, 0, p.width / 2, p.height / 2);
    pctx.fillRect(p.width / 2, p.height / 2, p.width / 2, p.height / 2);
    var pattern    = ctx.createPattern(p, "repeat");
    ctx.fillStyle  = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

function dozoom(x,y,scale){
    plx.zoom.setFocus(x,y);
    plx.zoom.setScaleTouch(scale);
    VIEW.render();
}


/*-----------------------------------------------------------------------------------------------
 BRUSH MODAL DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.BrushDialog = function (view) {
    this.view = view;

    this._dialog               = $('#brush-options-modal-id');
    this._brush_size_slider    = document.getElementById('brush-size-slider-id');
    this._brush_opacity_slider = document.getElementById('brush-opacity-slider-id');
    this._current_label_text   = $('#current-label-text-id');
    this._setup_controls();
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
        brush_dialog._current_label_text.html(BRUSH.label_id);
        brush_dialog.update_brush_preview();
    });

    //Setting the current label id

    if (BRUSH.label_id == undefined) {
        BRUSH.setLabelID(LABELS[0].id);
        this._current_label_text.html(BRUSH.label_id);
    }
    else {
        this._current_label_text.html(BRUSH.label_id);
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
}



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

/*-----------------------------------------------------------------------------------------------
 Propagate DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.PropagateDialog = function (view) {
    this.view         = view;
    this._dialog      = $('#label-propagation-modal-id');
    this.used_labels_div = $('#used-labels-div-id');
    this.label_picker = $('#propagate-label-selector-id');
    this.btn_ok       = $('#btn-ok-propagate-id');
    this.labels       = undefined;
    this._setup_events();
    this._setup_controls();
};

gui.PropagateDialog.prototype._setup_events = function () {

    var propagate_dialog = this;

    this._dialog.on('show.bs.modal', function () {
        propagate_dialog.prepare();
    });
};

gui.PropagateDialog.prototype._setup_controls = function () {


};


gui.PropagateDialog.prototype.prepare = function () {

    var selector = this.label_picker;
    if (selector.labelpicker)  selector.labelpicker('destroy');
    selector.html('');

    var labels = this.view.current_annotation.getUsedLabels();

    $.each(labels, function () { selector.append($("<option />", {value: this.color, text: this.name})); });
    this.label_picker.labelpicker({'theme': 'fontawesome', 'list': true, 'multiple': true, 'noselected': true});

    if (labels.length <= 5){
        this.used_labels_div.css('height', (labels.length*40)+20 +'px');
    }
    else{
        this.used_labels_div.removeAttr('style');
    }
};




gui.DownloadAnnotationsDialog = function(view){
    this.view = view;
    this._dialog               = $('#download-annotations-modal-id');
    this.btn_download_zip      = $('#btn-download-zip-id');
    this._setup_controls();
    this._setup_events();
};


gui.DownloadAnnotationsDialog.prototype._setup_controls = function(){
    var self = this;
    this.btn_download_zip.click(function(){
        self.generateZipFile();
    });
}

gui.DownloadAnnotationsDialog.prototype._setup_events = function(){
    var self = this;

    this._dialog.on('show.bs.modal', function () {


        var list = document.getElementById('download-annotations-list-id');
        list.innerHTML ='';
        var table = document.createElement('table');
        var tbody = document.createElement('tbody');


        table.className ='table';
        list.appendChild(table);
        table.appendChild(tbody);

        var annotations = self.view.aset.annotations;
        var keys = self.view.aset.getKeys();
        for (var i= 0, N = keys.length; i<N; i+=1){
            if (annotations[keys[i]].isEmpty()){
                continue;
            }

            var row = document.createElement('tr');
            var column = document.createElement('td');

            var acanvas = annotations[keys[i]].canvas;
            var dataURL = acanvas.toDataURL();
            var link = document.createElement('a');
            var filename = 'AL_'+keys[i];
            link.setAttribute('download',filename);
            link.href = dataURL;
            link.innerHTML = " "+filename;

            var thumb = document.createElement('img');
            thumb.setAttribute('width','50px');
            thumb.setAttribute('height','50px');
            thumb.src = dataURL;
            thumb.className='thumb';
            column.appendChild(thumb);
            column.appendChild(link);
            row.appendChild(column);
            tbody.appendChild(row);
        }



    });
};


gui.DownloadAnnotationsDialog.prototype.generateZipFile = function(){
    if (JSZip === undefined){
        throw "JSZip.js not found";
    }
    var zip = new JSZip();


    zip.file('labels.json', JSON.stringify(plx.LABELS));

    var annotations = this.view.aset.annotations;
    var _keys = this.view.aset.getKeys();
    for (var i= 0, N = _keys.length; i<N; i+=1) {
        if (annotations[_keys[i]].isEmpty()) {
            continue;
        }
        var drl = annotations[_keys[i]].canvas.toDataURL();
        drl = drl.substr(drl.indexOf(',')+1);
        zip.file('AL_' + _keys[i], drl,{'base64':true});
    }

    var content = zip.generate({type:'blob'});
    saveAs(content,this.view.dataset.name+'.zip');

};

/*-----------------------------------------------------------------------------------------------
 KEY BINDINGS
 ------------------------------------------------------------------------------------------------*/
function setup_keyboard() {

    function inList(value, list) {
        return (list.indexOf(value) >= 0);
    }

    document.onkeypress = function (event) {
        var letter = String.fromCharCode(event.which).toLowerCase();

        if (inList(letter, ['1', '2', '3',
                '4', '5', '6', '7', '8', '9'])) {
            event.preventDefault();
            BRUSH.setLabelByIndex(parseInt(letter));
            plx.setCurrentOperation(plx.OP_ANNOTATE);
            gui.toolbar.update_brush();
            gui.toolbar.update_selected_tool(plx.OP_ANNOTATE);
        }

    };

    document.onkeydown = function (event) {
        //console.debug(event.key, event.charCode, event.ctrlKey);

        var mod    = (event.ctrlKey || event.metaKey);
        var letter = String.fromCharCode(event.which).toLowerCase();

        if (mod) {
            if (letter == 'd') { //Ctrl+D
                event.preventDefault();
                plx.setCurrentOperation(plx.OP_DELETE);
                gui.toolbar.update_eraser();
                gui.toolbar.update_selected_tool(plx.OP_DELETE);

            }
            else if (letter == 'a') { //Ctrl+A
                event.preventDefault();
                plx.setCurrentOperation(plx.OP_ANNOTATE);
                gui.toolbar.update_brush();
                gui.toolbar.update_selected_tool(plx.OP_ANNOTATE);
            }

            else if (letter == 'z' && !event.shiftKey) {
                event.preventDefault();
                if (!VIEW.undo() && gui.alert) {
                    gui.alert.showAlert('Undo', 'Nothing to undo', 'alert-info');
                }
                else {
                    gui.toolbar.update_selected_tool('undo');
                }
            }
            else if (letter == 'z' && event.shiftKey) {
                event.preventDefault();
                if (!VIEW.redo() && gui.alert) {
                    gui.alert.showAlert('Redo', 'Nothing to redo', 'alert-info');
                }
                else {
                    gui.toolbar.update_selected_tool('redo');
                }
            }
            else if (letter == 's') { //Ctrl + S
                event.preventDefault();
                plx.setCurrentOperation(plx.OP_PAINT_BUCKET);
                gui.toolbar.update_selected_tool(plx.OP_PAINT_BUCKET);
            }
            else if (letter == 'x') {
                event.preventDefault();
                plx.setCurrentOperation(plx.OP_ZOOM);
                gui.toolbar.update_selected_tool(plx.OP_ZOOM);
            }
        }

    };
};


/*-----------------------------------------------------------------------------------------------
 Coordinates Tracker
 ------------------------------------------------------------------------------------------------*/
gui.CoordinatesTracker = function (view) {
    view.interactor.addObserver(this, plx.EV_COORDS_UPDATED);
};

gui.CoordinatesTracker.prototype.processNotification = function (data) {
    document.getElementById('status-current-coordinates-id').innerHTML = 'x:' + plx.COORDINATES.X.toPrecision(3) + ', y:' + plx.COORDINATES.Y.toPrecision(3);
};


/*-----------------------------------------------------------------------------------------------
 Alert Controller
 ------------------------------------------------------------------------------------------------*/
gui.AlertController = function (view) {
    view.interactor.addObserver(this, 'alert-event');
};

gui.AlertController.prototype.showAlert = function (title, message, alert_type) {

    var container = document.getElementById('alert-container-id');

    var alert = document.createElement('div');
    alert.className = 'alert '+alert_type+' alert-dismissable';
    alert.setAttribute('role','alert');
    alert.innerHTML = '<strong>' + title + '</strong>  ' + message;
    alert.innerHTML += "<button type='button' class='close' data-dismiss='alert' aria-label='Close'>Close</button>";
    alert.style.display = 'none';
    container.appendChild(alert);
    $(alert).fadeIn(1000);

    function closeAlert(element){
         $(element).fadeOut('slow', function(){
             $(this).alert('close');
         });
    };

    window.setTimeout(function(){closeAlert(alert);}, 3000);

};


gui.AlertController.prototype.processNotification = function (data) {
    this.showAlert(data.title, data.message, data.type);
};


/*-----------------------------------------------------------------------------------------------
 Slice Controller
 ------------------------------------------------------------------------------------------------*/
gui.SliceController = function (view) {
    this.view = view;
    this.slider = document.getElementById('dataset-slider-id');
    this._setup_slider();
    view.interactor.addObserver(this, plx.EV_SLICE_CHANGED);
};

gui.SliceController.prototype._setup_slider = function(){

    var init_slice = this.view.dataset.options.start;
    var step_slice = this.view.dataset.options.step;
    var end_slice  = this.view.dataset.options.end;

    noUiSlider.create(this.slider, {
        start: init_slice,
        step : step_slice,
        range: {
            'min':[init_slice],
            'max':[end_slice]
        },
        connect:'lower',
        pips:{
            mode:'positions',
            density:4,
            values: [0,25,50,75,100]
        }
    });

    this.slider.noUiSlider.on('slide', function(values, handle){
        var index = parseInt(values[handle])
        message('slice: ' +index);
        VIEW.showSliceByIndex(index);
    });
}

gui.SliceController.prototype.processNotification = function (data) {
    this.slider.noUiSlider.set(data.slice);
};



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

    this.btn_brush        = $('#btn-brush-id');
    this.btn_eraser       = $('#btn-eraser-id');
    this.btn_undo         = $('#btn-undo-id');
    this.btn_redo         = $('#btn-redo-id');
    this.btn_paint_bucket = $('#btn-paint-bucket-id');
    this.btn_zoom         = $('#btn-zoom-id');
    this.btn_propagate    = $('#btn-propagate-id');
    this.btn_save         = $('#btn-save-id');

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
    };

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

gui.ToolbarController.prototype.processNotification = function (data) {
    var op = data.operation;
    this.update_selected_tool(op);
};

gui.ToolbarController.prototype.update_brush = function () {
    this.btn_brush.css('color', BRUSH.color + ' !important');
    var label = plx.LABELS.getLabelByID(BRUSH.label_id);
    $('#status-current-label-id').html(label.id +':'
        +label.name
        +'  (' + BRUSH.size + ', ' + BRUSH.type + ', ' + BRUSH.getHexColor() + ')');
};

gui.ToolbarController.prototype.update_eraser = function () {
    $('#status-current-label-id').html('Eraser [' + ERASER.size + ']');

};

/*-----------------------------------------------------------------------------------------------
 DATA GATHERING METHODS
 ------------------------------------------------------------------------------------------------*/
function load_dataset_callback(dataset) {

    var percentage = (dataset.num_loaded / dataset.num_items) * 100;

    $('#dataset-progress-bar-id').css('width', percentage + '%').attr('aria-valuenow', percentage);

    if (percentage == 100) {
        $('#dataset-progressbar-container-id').fadeOut(1000, function () {
            var sliceIdx = VIEW.showMiddleSlice();
            gui.slice.slider.noUiSlider.set(sliceIdx);
            VIEW.interactor.connectView();
            update_canvas_size();
        });
    }
};

function setup_labels () {

    var palette = [
        "#ac725e", "#d06b64", "#f83a22", "#fa573c", "#ff7537", "#ffad46", "#42d692",
        "#16a765", "#7bd148", "#b3dc6c", "#fbe983", "#fad165", "#92e1c0", "#9fe1e7",
        "#9fc6e7", "#4986e7", "#9a9cff", "#b99aff", "#c2c2c2", "#cabdbf", "#cca6ac",
        "#f691b2", "#cd74e6", "#a47ae2"
    ];

    var num_labels = palette.length;
    var labels     = [];

    for (var i = 0; i < num_labels; i += 1) {
        var label = new plx.Label((i+1), 'label-'+(i+1), palette[i]);
        labels.push(label);
    }

    plx.LABELS = new plx.LabelSet(labels);

    LABELS = plx.LABELS.getLabels();

    BRUSH.setLabelID(LABELS[0].id);

};

/*-----------------------------------------------------------------------------------------------
 MAIN
 ------------------------------------------------------------------------------------------------*/
function initPlexo() {

    setup_labels();
    setup_keyboard();

    dataset = new plx.Dataset('data/ds_us_1', plx.Dataset.SELECT_INDEXED,
        {
            'start': 1,
            'end'  : 400,
            'step' : 1
        }
    );

    VIEW = new plx.View('plexo-canvas-id');
    VIEW.load(dataset, load_dataset_callback);

    gui.ctracker         = new gui.CoordinatesTracker(VIEW);
    gui.alert            = new gui.AlertController(VIEW);
    gui.slice            = new gui.SliceController(VIEW);
    gui.toolbar          = new gui.ToolbarController(VIEW);
    gui.brush_dialog     = new gui.BrushDialog(VIEW);
    gui.eraser_dialog    = new gui.EraserDialog(VIEW);
    gui.propagate_dialog = new gui.PropagateDialog(VIEW);
    gui.download_dialog  = new gui.DownloadAnnotationsDialog(VIEW);

};

/*-----------------------------------------------------------------------------------------------
 GLOBAL METHODS - WINDOW OBJECT
 ------------------------------------------------------------------------------------------------*/
function update_canvas_size() {

    if (!VIEW.dataset.hasLoaded() || VIEW.current_slice == undefined) {
        return;
    }

    /**
     * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
     * images to fit into a certain area.
     *
     * @param {Number} srcWidth Source area width
     * @param {Number} srcHeight Source area height
     * @param {Number} maxWidth Fittable area maximum available width
     * @param {Number} maxHeight Fittable area maximum available height
     * @return {Object} { width, heigth }
     */
    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {

        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {width: Math.floor(srcWidth * ratio), height: Math.floor(srcHeight * ratio)};
    }

    var view         = VIEW;
    var heightNavBar = $('div.navbar-header').outerHeight();
    var heightFooter = $('.plexo-footer').outerHeight();
    var heightWindow = $(window).height();
    var widthWindow  = $(window).width();
    var hAvailable   = heightWindow - (heightNavBar + heightFooter);

    var ratio  = calculateAspectRatioFit(view.current_slice.image.width,
        view.current_slice.image.height,
        widthWindow, hAvailable);
    var height = ratio.height;
    var width  = ratio.width;

    view.canvas.width  = width;
    view.canvas.height = height;
    $(view.canvas).css('width', width);
    $(view.canvas).css('height', height);
    $(view.canvas).css('position', 'absolute');

    if (hAvailable > height) {
        $(view.canvas).css('top', Math.ceil((hAvailable - height) / 2));
    }
    else if (hAvailable == height) {
        $(view.canvas).css('top', 0);
    }

    if (widthWindow > width) {
        $(view.canvas).css('left', Math.ceil((widthWindow - width) / 2));
    }
    else if (widthWindow == width) {
        $(view.canvas).css('left', 0);
    }

    view.render();
};

/**
 * Resizes the view only AFTER the user is done resizing the window
 *
 * @see http://alvarotrigo.com/blog/firing-resize-event-only-once-when-resizing-is-finished/
 */
var resize_timeout_id;
window.addEventListener('resize', function () {
    clearTimeout(resize_timeout_id);
    resize_timeout_id = setTimeout(update_canvas_size, 500);
});

/**
 * Center modal dialogs in screen
 * Credit for this elegant solution to keep the modals centered goes to Cory LaViska
 * http://www.abeautifulsite.net/vertically-centering-bootstrap-modals/
 */
$(function () {
    function reposition() {
        var modal  = $(this),
            dialog = modal.find('.modal-dialog');
        modal.css('display', 'block');

        // Dividing by two centers the modal exactly, but dividing by three
        // or four works better for larger screens.
        dialog.css("margin-top", Math.max(0, ($(window).height() - dialog.height()) / 2));
    }

    // Reposition when a modal is shown
    $('.modal').on('shown.bs.modal', reposition);
    // Reposition when the window is resized
    $(window).on('resize', function () {
        $('.modal:visible').each(reposition);
    });
});


/**
 * Deactivate global touch events (tested on ipad so far)
 */
document.body.ontouchmove = function (event) {
    if (event.touches.length >= 2) {
        event.preventDefault();
    }
    else{
        if (event.target.id == 'page-wrapper'){
            event.preventDefault();
            event.stopPropagation();
        }
    }
};


