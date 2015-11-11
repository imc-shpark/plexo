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
//@koala-append "Keyboard.js"
//@koala-append "CoordinatesTracker.js"
//@koala-append "AlertController.js"
//@koala-append "SliceController.js"
//@koala-append "ToolbarController.js"
//@koala-append "Gui.js"




var VIEW, BRUSH, ERASER, LABELS;
var init_slice = 210; //remember it starts on one
var end_slice  = 215;
var step_slice = 1;

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
            gui.alert.showAlert('Delete', 'The layer is empty, nothing to delete', 'alarm-info', 3000);
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
gui.PropagateDialog = function(view){
    this.view = view;
    this._dialog      = $('#label-propagation-modal-id');
    this.label_picker = $('#propagate-label-selector-id');
    this.btn_ok       = $('#btn-ok-propagate-id');
    this._setup_events();
    this._setup_controls();
};

gui.PropagateDialog.prototype._setup_events = function(){

    var propagate_dialog = this;

    this._dialog.on('shown.bs.modal', function () {
        propagate_dialog.update_picker();
    });
};

gui.PropagateDialog.prototype._setup_controls = function(){

    this.btn_ok.click(function(){
        alert();
    });

}

gui.PropagateDialog.prototype.update_picker = function(){
    var labels = LABELS;

    var selector = this.label_picker;
    selector.labelpicker('destroy');
    selector.html('');
    $.each(labels, function () { selector.append($("<option />", {value: this.color, text: this.name})); });


    this.label_picker.labelpicker({'theme':'fontawesome','list':true, 'multiple':true, 'noselected':true});
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
                gui.tooblar.update_selected_tool(plx.OP_ANNOTATE);
            }

            else if (letter == 'z' && !event.shiftKey) {
                event.preventDefault();
                if (!VIEW.undo() && gui.alert) {
                    gui.alert.showAlert('Undo', 'Nothing to undo', 'alert-info', 3000);
                }
                else {
                    gui.toolbar.update_selected_tool('undo');
                }
            }
            else if (letter == 'z' && event.shiftKey) {
                event.preventDefault();
                if (!VIEW.redo() && gui.alert) {
                    gui.alert.showAlert('Redo', 'Nothing to redo', 'alert-info', 2000);
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

gui.AlertController.prototype.showAlert = function (title, message, alert_type, delay) {

    var alert = $('#alert-message-id');
    $(alert).removeAttr('class').attr('class', 'alert');

    if (alert_type == undefined || alert_type == 'alert-info') {
        $(alert).addClass('alert-info');
    }
    else {
        $(alert).addClass(alert_type);
    }

    $(alert).html('<strong>' + title + '</strong>  ' + message);

    var container = $('#alert-container-id');
    $(container).removeAttr('class').attr('class', '');
    $(container).addClass('animated');
    $(container).addClass('fadeInDown');

    //timing out the alert
    var timeout = window.setTimeout(function () {
        $(container).removeClass('fadeInDown').addClass('fadeOutUp');

    }, 5000);

    $(container).click(function (ev) {
        window.clearTimeout(timeout);
        $(container).removeClass('fadeInDown').addClass('fadeOutUp');
    });

    //dismissing it with a click in the alert
    var canvas = document.getElementById('plexo-canvas-id');

    $(canvas).on('click', function (evt) {
        console.debug('click');
        window.clearTimeout(timeout);
        $(container).removeClass('fadeInDown').addClass('fadeOutUp');
        $(this).off(evt);
    });
};

gui.AlertController.prototype.processNotification = function (data) {
    this.showAlert(data.title, data.message, data.type, 3000);
};


/*-----------------------------------------------------------------------------------------------
 Slice Controller
 ------------------------------------------------------------------------------------------------*/
gui.SliceController = function (view) {
    this.slider = document.getElementById('dataset-slider-id');

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


    view.interactor.addObserver(this, plx.EV_SLICE_CHANGED);
};

gui.SliceController.prototype.processNotification = function (data) {
    this.slider.noUiSlider.set(data.slice);
};



/*-----------------------------------------------------------------------------------------------
 UPDATE GUI METHODS
 ------------------------------------------------------------------------------------------------*/




/*-----------------------------------------------------------------------------------------------
 Toolbar Controller
 ------------------------------------------------------------------------------------------------*/
gui.ToolbarController = function (view) {
    this.view = view;
    view.interactor.addObserver(this, plx.EV_OPERATION_CHANGED);
    this._setup();
    this._setup_brush_button();
    this._setup_paint_bucket_button();
    this._setup_eraser_button();
    this._setup_zoom_button();
    this._setup_undo_button();
    this._setup_redo_button();
};

gui.ToolbarController.prototype._setup = function () {
    var controller = this;

    this.btn_brush        = $('#btn-brush-id');
    this.btn_eraser       = $('#btn-eraser-id');
    this.btn_undo         = $('#btn-undo-id');
    this.btn_redo         = $('#btn-redo-id');
    this.btn_paint_bucket = $('#btn-paint-bucket-id');
    this.btn_zoom         = $('#btn-zoom-id');
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

    this.btn_paint_bucket.on('touchstart click', function(event){
        event.preventDefault();
        event.stopPropagation();
        plx.setCurrentOperation(plx.OP_PAINT_BUCKET);
        controller.update_selected_tool(plx.OP_PAINT_BUCKET);
    });
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

    this.btn_zoom.on('click', function(event){
       if (controller.btn_zoom.touched === true) return; //if
        activate_zoom();
    });

    this.btn_zoom.on('touchend', function(event){
        event.stopPropagation();
        event.preventDefault();
        activate_zoom();
        controller.btn_zoom.touched = true;
   });
};

gui.ToolbarController.prototype._setup_undo_button = function () {
    var controller = this;

    function undo(){
        if (!controller.view.undo() && gui.alert) {
            gui.alert.showAlert('Undo', 'Nothing to undo', 'alert-info', 3000);
        }
        else {
            controller.update_selected_tool('undo');
        }
    }

    this.btn_undo.on('click', function(event){
        if (controller.btn_undo.touched === true) return;
        undo();
    })

    this.btn_undo.on('touchend', function(event){
        event.stopPropagation();
        event.preventDefault();
        undo();
        controller.btn_undo.touched = true;
    })
};

gui.ToolbarController.prototype._setup_redo_button = function () {

    var controller = this;

    function redo(){
        if (!controller.view.redo() && gui.alert) {
            gui.alert.showAlert('Redo', 'Nothing to redo', 'alert-info', 2000);
        }
        else {
            controller.update_selected_tool('redo');
        }
    }

    this.btn_redo.on('click', function(event){
       if (controller.btn_redo.touched === true) return;
        redo();
    });

    this.btn_redo.on('touchend', function(event){
        event.stopPropagation();
        event.preventDefault();
        redo();
        controller.btn_redo.touched = true;
    })

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
            var sliceIdx = index = VIEW.showMiddleSlice();
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

    dataset = new plx.Dataset('data/ds_us_1', init_slice, end_slice, step_slice);
    VIEW = new plx.View('plexo-canvas-id');
    VIEW.load(dataset, load_dataset_callback);

    gui.ctracker         = new gui.CoordinatesTracker(VIEW);
    gui.alert            = new gui.AlertController(VIEW);
    gui.slice            = new gui.SliceController(VIEW);
    gui.toolbar          = new gui.ToolbarController(VIEW);
    gui.brush_dialog     = new gui.BrushDialog(VIEW);
    gui.eraser_dialog    = new gui.EraserDialog(VIEW);
    gui.propagate_dialog = new gui.PropagateDialog(VIEW);
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
    $('.modal').on('show.bs.modal', reposition);
    // Reposition when the window is resized
    $(window).on('resize', function () {
        $('.modal:visible').each(reposition);
    });
});

/**
 * Deactivate global touch events (tested on ipad so far)
 */
document.body.ontouchmove = function (event) {
    if (event.touches.length == 2) {
        event.preventDefault();
    } //no zooming children./
};

