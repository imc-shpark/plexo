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

var GUI_TOUCH = false;

/*-----------------------------------------------------------------------------------------------
 loading callback, progress bar
 ------------------------------------------------------------------------------------------------*/
function load_dataset_callback(dataset) {
    var percentage = (dataset.num_loaded / dataset.num_items) * 100;
    $('#dataset-progress-bar-id').css('width', percentage + '%').attr('aria-valuenow', percentage);
    if (percentage == 100) {
        $('#dataset-progressbar-container-id').fadeOut(1000, function () {

            index = VIEW.showMiddleSlice();
            VIEW.interactor.connectView();
            set_view_dimensions();
            setup_slice_slider(index);
        });

    }
};

function setup_slice_slider(idx) {
    $('#dataset-slider-id').ionRangeSlider({
        grid: false, grid_snap:true, min: init_slice, max: end_slice, step: step_slice, from: idx, onChange: function (data) {
            index = data.from;
            VIEW.showSliceByIndex(index);
            VIEW.showCurrentAnnotationSlice();
        }
    });
};

/*-----------------------------------------------------------------------------------------------
 Set up brush tool
 ------------------------------------------------------------------------------------------------*/
function draw_brush_preview() {

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

function setup_brush_color_picker() {

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

    $('#brush-color-id').simplecolorpicker('destroy');

    var widget = $('#brush-color-id');
    widget.html('');
    $.each(labels, function () {
        widget.append($("<option />", {value: this.color, text: this.id}));
    });

    $('#brush-color-id').simplecolorpicker().on('change', function () {
        var value            = $('#brush-color-id').val();
        var current_label_id = $(this).find(':selected').text();

        //BRUSH.setColor(value);
        BRUSH.setLabelID(current_label_id);
        $('#current-label-text-id').html(BRUSH.label_id);
        draw_brush_preview()
    });
};

function setup_label_tooltips() {
    var children = $('#brush-color-id').next().children();
    $.each(children, function () { $(this).attr('data-placement', 'top');});
    $.each(children, function () { $(this).attr('data-toggle', 'tooltip');});
    $.each(children, function () { $(this).attr('data-container', '#brush-options-modal-body-id');});
    $('[data-toggle="tooltip"]').tooltip();

    if (GUI_TOUCH) {
        // Force click of the option on touch
        $('[data-toggle="tooltip"]').on('shown.bs.tooltip', function () {
            $(this).click();
        });
    }
};

function setup_brush_sliders() {
    $('#brush-size-slider-id').ionRangeSlider({
        grid: true, min: 1, max: 10, from: BRUSH.size, onChange: function (data) {
            BRUSH.size = data.from;
            draw_brush_preview();
        }
    });
    $('#brush-opacity-slider-id').ionRangeSlider({
        grid: true, min: 0.5, max: 1, step: 0.1, from: BRUSH.opacity, onChange: function (data) {
            BRUSH.setOpacity(data.from);
            draw_brush_preview();
        }
    });
};

function setup_brush_type_buttons() {
    $('#brush-shape-circle-id').click(function () {
        BRUSH.type = 'round';
        draw_brush_preview();
    });
    $('#brush-shape-square-id').click(function () {
        BRUSH.type = 'square';
        draw_brush_preview();
    });
};

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
 Eraser options
 ------------------------------------------------------------------------------------------------*/
function setup_eraser_options() {
    $('#eraser-size-slider-id').ionRangeSlider({
        grid: true, min: 1, max: 20, from: ERASER.size, onChange: function (data) {
            ERASER.size = data.from;
            draw_eraser_preview();
        }
    });

//			$('#eraser-shape-circle-id').click(function () {
//				ERASER.type = 'round';
//				draw_eraser_preview();
//			});
//			$('#eraser-shape-square-id').click(function () {
//				ERASER.type = 'square';
//				draw_eraser_preview();
//			});
};

function draw_eraser_preview() {
    var canvas = document.getElementById('eraser-canvas-id');
    var ctx    = canvas.getContext("2d");

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius  = ERASER.size;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_checkboard_canvas(canvas, 6, 6);

    ctx.fillStyle = "#000";

    //if (ERASER.type == 'round') {
    //	ctx.beginPath();
    //	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    //	ctx.fill();
    //} else {
    var x1, y1, p;
    p  = radius;
    x1 = centerX - p;
    y1 = centerY - p;
    ctx.fillRect(x1, y1, p * 2, p * 2);
    //}
};

/*-----------------------------------------------------------------------------------------------
 Undo/Redo options
 ------------------------------------------------------------------------------------------------*/
function setup_undo_button() {
    $('#btn-undo-id').click(function () {
        VIEW.undo();
    });
};

function setup_redo_button() {
    $('#btn-redo-id').click(function () {
        VIEW.redo();
    });
};

/*-----------------------------------------------------------------------------------------------
 Zoom option
 ------------------------------------------------------------------------------------------------*/
function setup_zoom_button() {
    $('#btn-zoom-id').click(function () {
        VIEW.toggleFullscreen();
        VIEW.showCurrentSlice();
        VIEW.showCurrentAnnotationSlice();
    });
};

/*-----------------------------------------------------------------------------------------------
 Configure Keyboard Events
 ------------------------------------------------------------------------------------------------*/
function inList(value, list) {
    return (list.indexOf(value) >= 0);
};

function setup_keyboard() {
    document.onkeypress = function (event) {
        //console.debug(event.key, event.charCode, event.ctrlKey);
        if (event.key == 'd' || event.key == 'D') {
            plx.setCurrentOperation(plx.OP_DELETE);
            update_eraser_gui();
        }
        else if (event.key == 'a' || event.key == 'A') {
            plx.setCurrentOperation(plx.OP_ANNOTATE);
            update_brush_gui()
        }
        else if (event.ctrlKey) {
            if (inList(event.key, ['1', '2', '3', '4', '5', '6', '7', '8', '9'])) {
                BRUSH.setLabelByIndex(parseInt(event.key));
                plx.setCurrentOperation(plx.OP_ANNOTATE);
                update_brush_gui();
            }

        }
        else if (event.key == 'e' || event.key == 'E'){
            plx.setCurrentOperation(plx.OP_EROSION);
        }
        else {
            plx.setCurrentOperation(plx.OP_NONE);
        }
    }
};

/*-----------------------------------------------------------------------------------------------
 Update GUI Methods
 ------------------------------------------------------------------------------------------------*/
function update_brush_gui() {
    $('#btn-brush-id').css('color', BRUSH.color + ' !important');
    $('#status-current-label-id').html(BRUSH.label_id + ' [' + BRUSH.size + ', ' + BRUSH.type + ']');
};

function update_eraser_gui() {
    $('#status-current-label-id').html('Eraser [' + ERASER.size + ']');
}

/*-----------------------------------------------------------------------------------------------
 Modal Dialogs setup
 ------------------------------------------------------------------------------------------------*/
function setup_modal_dialogs() {

    $('#brush-options-modal-id').on('shown.bs.modal', function () {
        setup_brush_sliders();
        setup_brush_type_buttons();
        draw_brush_preview();
        setup_label_tooltips();
        plx.setCurrentOperation(plx.OP_ANNOTATE);
    });

    $('#brush-options-modal-id').on('hidden.bs.modal', function () {
        $('#btn-brush-id').blur();
        update_brush_gui();

    });

    $('#eraser-options-modal-id').on('shown.bs.modal', function () {
        setup_eraser_options();
        draw_eraser_preview();
        plx.setCurrentOperation(plx.OP_DELETE);
        update_eraser_gui();
    });
}

/*-----------------------------------------------------------------------------------------------
 MAIN
 ------------------------------------------------------------------------------------------------*/
function initPlexo() {
    setup_zoom_button();
    setup_undo_button();
    setup_redo_button();
    setup_brush_color_picker();
    setup_keyboard();
    setup_modal_dialogs();

    VIEW    = new plx.View('plexo-canvas-id');
    dataset = new plx.Dataset('data/ds_us_1', init_slice, end_slice, step_slice);
    VIEW.load(dataset, load_dataset_callback);
};

/*-----------------------------------------------------------------------------------------------
 Global Event Listeners
 ------------------------------------------------------------------------------------------------*/
function set_view_dimensions() {

    if (!VIEW.dataset.hasLoaded() || VIEW.currentSlice == undefined) return;

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

    var ratio  = calculateAspectRatioFit(view.currentSlice.image.width, view.currentSlice.image.height, widthWindow, hAvailable);
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
    else if (hAvailable == height){
        $(view.canvas).css('top', 0);
    }

    if (widthWindow > width) {
        $(view.canvas).css('left', Math.ceil((widthWindow - width) / 2));
    }
    else if(widthWindow == width){
        $(view.canvas).css('left',0);
    }

    view.showCurrentSlice();
    view.showCurrentAnnotationSlice();
};

/**
 * Resizes the view only AFTER the user is done resizing the window
 *
 * @see http://alvarotrigo.com/blog/firing-resize-event-only-once-when-resizing-is-finished/
 */
var resize_timeout_id;
window.addEventListener('resize', function () {
    clearTimeout(resize_timeout_id);
    resize_timeout_id = setTimeout(set_view_dimensions, 500);
});

//window.addEventListener('orientationchange', function(){
//   console.debug('checking orientation');
//   alert(window.orientation);
//});

/**
 * Detects if the device is touch-enabled
 *
 * @see http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
 */
window.addEventListener('touchstart', function setHasTouch() {
    GUI_TOUCH = true;
    console.debug('touch device detected');
    window.removeEventListener('touchstart', setHasTouch);
});





