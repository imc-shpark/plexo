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

