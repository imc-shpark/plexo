/**
 * Created by dcantor on 29/10/15.
 */
var VIEW, BRUSH, ERASER, LABELS;
var init_slice = 210;
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

/*-----------------------------------------------------------------------------------------------
 BRUSH MODAL DIALOG
 ------------------------------------------------------------------------------------------------*/
function update_brush_preview() {

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

function update_brush_color_picker() {

    var labels = LABELS;

    $('#brush-color-id').simplecolorpicker('destroy');

    var widget = $('#brush-color-id');
    widget.html('');
    $.each(labels, function () {
        widget.append($("<option />", {value: this.color, text: this.id}));
    });

    $("#brush-color-id option").filter(function () {
        return this.text == BRUSH.label_id;
    }).attr('selected', 'selected');

    $('#current-label-text-id').html(BRUSH.label_id);

    $('#brush-color-id').simplecolorpicker().on('change', function () {
        var value            = $('#brush-color-id').val();
        var current_label_id = $(this).find(':selected').text();
        //BRUSH.setColor(value);
        BRUSH.setLabelID(current_label_id);
        $('#current-label-text-id').html(BRUSH.label_id);
        update_brush_preview()
    });

    if (BRUSH.label_id == undefined) {
        BRUSH.setLabelID(LABELS[0].id);
        $('#current-label-text-id').html(BRUSH.label_id);
        update_brush_gui();
    }
};

function update_brush_sliders() {

    var slider_size = $('#brush-size-slider-id').data('ionRangeSlider');
    slider_size.update({from: BRUSH.size});

    var slider_opacity = $('#brush-opacity-slider-id').data('ionRangeSlider');
    slider_opacity.update({from: BRUSH.opacity});
};

function setup_brush_modal_dialog() {

    $('#brush-shape-circle-id').click(function () {
        BRUSH.type = 'round';
        //$('.simplecolorpicker span.color').css('border-radius','30px')
        update_brush_preview();
    });

    $('#brush-shape-square-id').click(function () {
        BRUSH.type = 'square';
        //$('.simplecolorpicker span.color').css('border-radius','5px')
        update_brush_preview();
    });

    $('#brush-size-slider-id').ionRangeSlider({
        grid: true, min: 1, max: 10, from: BRUSH.size, onChange: function (data) {
            BRUSH.size = data.from;
            update_brush_preview();
        }
    });

    $('#brush-opacity-slider-id').ionRangeSlider({
        grid: true, min: 0.5, max: 1, step: 0.1, from: BRUSH.opacity, onChange: function (data) {
            BRUSH.setOpacity(data.from);
            update_brush_preview();
        }
    });
};

/*-----------------------------------------------------------------------------------------------
 ERASER MODAL DIALOG
 ------------------------------------------------------------------------------------------------*/
function update_eraser_preview() {
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

function update_clear_slice_button() {
    var alayer = VIEW.getCurrentAnnotationLayer();
    if (alayer.isEmpty()) {
        $('#btn-clear-slice-id').hide();
    }
    else {
        $('#btn-clear-slice-id').show();
    }
};

function update_eraser_slider() {
    var slider = $('#eraser-size-slider-id').data("ionRangeSlider");
    slider.update({from: ERASER.size});
};

function setup_eraser_modal_dialog() {
    $('#eraser-size-slider-id').ionRangeSlider({
        grid: true, min: 1, max: 20, from: ERASER.size, onChange: function (data) {
            ERASER.size = data.from;
            update_eraser_preview();
        }
    });

    $('#btn-clear-slice-id').click(function () {
        var layer = VIEW.getCurrentAnnotationLayer();
        if (layer.isEmpty() && gui.alert) {
            gui.alert.showAlert('Delete', 'The layer is empty, nothing to delete', 'alarm-info', 3000);
        }
        else {
            layer.clearAnnotations();
            VIEW.render();
        }
    });
};

/*-----------------------------------------------------------------------------------------------
 MAIN TOOLBAR
 ------------------------------------------------------------------------------------------------*/
function setup_toolbar() {
    $('#btn-undo-id').click(function () {

        if (!VIEW.undo() && gui.alert) {
                gui.alert.showAlert('Undo', 'Nothing to undo', 'alert-info', 3000);
        }
        else {
            update_selected_tool('undo');
        }
    });

    $('#btn-redo-id').click(function () {

        if (!VIEW.redo() && gui.alert) {
                gui.alert.showAlert('Redo', 'Nothing to redo', 'alert-info', 2000);
        }
        else {
            update_selected_tool('redo');
        }
    });

    $('#btn-paint-bucket-id').click(function () {
        plx.setCurrentOperation(plx.OP_PAINT_BUCKET);
        update_selected_tool(plx.OP_PAINT_BUCKET);

    });

    $('#btn-zoom-id').click(function () {
        plx.setCurrentOperation(plx.OP_ZOOM);
        update_selected_tool(plx.OP_ZOOM);
    });
};

/*-----------------------------------------------------------------------------------------------
 UPDATE GUI METHODS
 ------------------------------------------------------------------------------------------------*/
function update_brush_gui() {
    $('#btn-brush-id').css('color', BRUSH.color + ' !important');
    $('#status-current-label-id').html(BRUSH.label_id + ' [' + BRUSH.size + ', ' + BRUSH.type + ', ' + BRUSH.getHexColor() + ']');
};

function update_eraser_gui() {
    $('#status-current-label-id').html('Eraser [' + ERASER.size + ']');
};

function update_selected_tool(last_used) {
    $('.btn-icon-active').removeClass('btn-icon-active');

    if (last_used == plx.OP_ANNOTATE) {
        $('#btn-brush-id').addClass('btn-icon-active');
    }
    else if (last_used == plx.OP_PAINT_BUCKET) {
        $('#btn-paint-bucket-id').addClass('btn-icon-active');
    }
    else if (last_used == plx.OP_DELETE) {
        $('#btn-eraser-id').addClass('btn-icon-active');
    }
    else if (last_used == plx.OP_ZOOM) {
        $('#btn-zoom-id').addClass('btn-icon-active');
    }
    else if (last_used == 'undo') {
        $('#btn-undo-id').addClass('btn-icon-active');
    }
    else if (last_used == 'redo') {
        $('#btn-redo-id').addClass('btn-icon-active');
    }
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
            update_brush_gui();
            update_selected_tool(plx.OP_ANNOTATE);
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
                update_eraser_gui();

            }
            else if (letter == 'a') { //Ctrl+A
                event.preventDefault();
                plx.setCurrentOperation(plx.OP_ANNOTATE);
                update_brush_gui()
                update_selected_tool(plx.OP_ANNOTATE);
            }

            else if (letter == 'z' && !event.shiftKey) {
                event.preventDefault();
                if (!VIEW.undo() && gui.alert) {
                    gui.alert.showAlert('Undo', 'Nothing to undo', 'alert-info', 3000);
                }
                else {
                    update_selected_tool('undo');
                }
            }
            else if (letter == 'z' && event.shiftKey) {
                event.preventDefault();
                if (!VIEW.redo() && gui.alert) {
                    gui.alert.showAlert('Redo', 'Nothing to redo', 'alert-info', 2000);
                }
                else{
                    update_selected_tool('redo');
                }
            }
            else if (letter == 's') { //Ctrl + S
                event.preventDefault();
                plx.setCurrentOperation(plx.OP_PAINT_BUCKET);
                update_selected_tool(plx.OP_PAINT_BUCKET);
            }
            else if (letter == 'x') {
                event.preventDefault();
                plx.setCurrentOperation(plx.OP_ZOOM);
                update_selected_tool(plx.OP_ZOOM);
            }
        }

    };
};

/*-----------------------------------------------------------------------------------------------
 MODALS CONFIGURATION
 ------------------------------------------------------------------------------------------------*/
function configure_modal_dialogs() {

    $('#brush-options-modal-id').on('show.bs.modal', function () {
        update_brush_color_picker();
        update_brush_sliders();
        update_brush_gui();
        update_brush_preview();
    });

    $('#brush-options-modal-id').on('shown.bs.modal', function () {
        plx.setCurrentOperation(plx.OP_ANNOTATE);
        update_selected_tool(plx.OP_ANNOTATE);
    });

    $('#brush-options-modal-id').on('hidden.bs.modal', function () {
        update_brush_gui();
    });

    $('#eraser-options-modal-id').on('show.bs.modal', function () {
        update_eraser_slider();
        update_clear_slice_button();
        update_eraser_preview();
    });

    $('#eraser-options-modal-id').on('shown.bs.modal', function () {
        plx.setCurrentOperation(plx.OP_DELETE);
        update_selected_tool(plx.OP_DELETE);
    });

    $('#eraser-options-modal-id').on('hidden.bs.modal', function () {
        update_eraser_gui();
    });

};

/*-----------------------------------------------------------------------------------------------
 GUI OBJECTS
 ------------------------------------------------------------------------------------------------*/
gui.CoordinatesTracker = function (view) {
    view.interactor.addObserver(this, 'coordinates-event');
};

gui.CoordinatesTracker.prototype.processNotification = function (data) {
    $('#status-current-coordinates-id').html('x:' + plx.COORDINATES.X + ', y:' + plx.COORDINATES.Y);
};

gui.AlertWidget = function (view) {
    view.interactor.addObserver(this, 'alert-event');
};

gui.AlertWidget.prototype.showAlert = function (title, message, alert_type, delay) {

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

gui.AlertWidget.prototype.processNotification = function (data) {
    this.showAlert(data.title, data.message, data.type, 3000);
};

gui.SliceTracker = function (view) {
    view.interactor.addObserver(this, 'slice-change-event');
};

gui.SliceTracker.prototype.processNotification = function (data) {
    var slider = $('#dataset-slider-id').data('ionRangeSlider');
    slider.update({from: data.slice});

};

/*-----------------------------------------------------------------------------------------------
 DATA GATHERING METHODS
 ------------------------------------------------------------------------------------------------*/
function load_dataset_callback(dataset) {

    var percentage = (dataset.num_loaded / dataset.num_items) * 100;

    $('#dataset-progress-bar-id').css('width', percentage + '%').attr('aria-valuenow', percentage);

    if (percentage == 100) {
        $('#dataset-progressbar-container-id').fadeOut(1000, function () {
            index = VIEW.showMiddleSlice();
            VIEW.interactor.connectView();
            update_canvas_size();
            setup_slice_slider(index);
        });
    }
};

function setup_slice_slider(idx) {
    $('#dataset-slider-id').ionRangeSlider({
        grid     : false,
        grid_snap: true,
        min      : init_slice,
        max      : end_slice,
        step     : step_slice,
        from     : idx,
        onChange : function (data) {
            index = data.from;
            VIEW.showSliceByIndex(index);
        }
    });
};

function setup_labels() {

    var palette = [
        "#ac725e", "#d06b64", "#f83a22", "#fa573c", "#ff7537", "#ffad46", "#42d692",
        "#16a765", "#7bd148", "#b3dc6c", "#fbe983", "#fad165", "#92e1c0", "#9fe1e7",
        "#9fc6e7", "#4986e7", "#9a9cff", "#b99aff", "#c2c2c2", "#cabdbf", "#cca6ac",
        "#f691b2", "#cd74e6", "#a47ae2"
    ];

    var num_labels = 24,
        labels     = [];

    for (var i = 0; i < num_labels; i += 1) {
        labels.push({'id': 'label-' + (i + 1), 'color': palette[i]});
    }

    LABELS = plx.setGlobalLabels(labels);

    BRUSH.setLabelID(LABELS[0].id);
    update_brush_gui();
};
/*-----------------------------------------------------------------------------------------------
 MAIN
 ------------------------------------------------------------------------------------------------*/
function initPlexo() {

    setup_labels();
    setup_toolbar();
    setup_keyboard();
    setup_brush_modal_dialog();
    setup_eraser_modal_dialog();
    configure_modal_dialogs();

    dataset = new plx.Dataset('data/ds_us_1', init_slice, end_slice, step_slice);

    VIEW = new plx.View('plexo-canvas-id');
    VIEW.load(dataset, load_dataset_callback);

    gui.ctracker      = new gui.CoordinatesTracker(VIEW);
    gui.alert         = new gui.AlertWidget(VIEW);
    gui.slice_tracker = new gui.SliceTracker(VIEW);
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
//document.ontouchmove = function(event){
//    event.preventDefault();
//}



