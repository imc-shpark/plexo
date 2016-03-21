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


var DATASETS = [
    {
        'title':'Spine Phantom #1',
        'name':'spinal-phantom',
        'data':'data/ds_us_1',
        'type': plx.Dataset.SELECT_INDEXED,
        'start':1,
        'end':400,
        'step':5,
        'date':'Oct 9, 2015',
        'thumbnail':'data/ds_us_1/ds_us_1_200.png'
    },
    {
        'title':'Spine G',
        'name':'spine-g',
        'data':'data/ds_us_goli',
        'type':plx.Dataset.SELECT_INDEXED,
        'start':1,
        'end':660,
        'step':5,
        'date':'March 21, 2015',
        'thumbnail':'data/ds_us_goli/ds_us_goli_330.png'

    },
    {
        'title':'Spine J',
        'name':'spine-j',
        'data':'data/ds_us_jay',
        'type':plx.Dataset.SELECT_INDEXED,
        'start':1,
        'end':920,
        'step':5,
        'date':'March 21, 2015',
        'thumbnail':'data/ds_us_jay/ds_us_jay_450.png'

    },
    {
        'title':'Brain Tumour Example',
        'name':'brain-example',
        'data':'data/mri_brain_tumour',
        'type': plx.Dataset.SELECT_INDEXED,
        'start':1,
        'end':1,
        'step':1,
        'date':'Dec 7, 2015',
        'thumbnail':'data/mri_brain_tumour/mri_brain_tumour_1.png'
    },
    {
        'title':'Liver Metastases Example',
        'name':'liver-example',
        'data':'data/liver_metastases',
        'type':plx.Dataset.SELECT_INDEXED,
        'start':1,
        'end':1,
        'step':1,
        'date':'Dec 7, 2015',
        'thumbnail':'data/liver_metastases/liver_metastases_1.png'

    }


];


/*-----------------------------------------------------------------------------------------------
 SETUP FUNCTIONS
 ------------------------------------------------------------------------------------------------*/

function show_dataset_selection_layout() {

    if (VIEW) VIEW.reset(); // important! removes all the information in memory from the view when we are about to
                  // select a new dataset

    $('#plexo-layout-canvas-id').hide();
    $('#plexo-layout-toolbar-id').hide();
    $('#plexo-layout-datasets-id').fadeIn('slow');
}
function show_annotation_layout() {
    $('#plexo-layout-canvas-id').fadeIn('slow');
    $('#plexo-layout-toolbar-id').fadeIn('slow');
    $('#plexo-layout-datasets-id').hide();

};

function populate_selection_layout(){


    var ds_panel = $('#dataset-selection-panel-id');

    ds_panel.empty();

    var N = DATASETS.length;

    for(var i=0;i<N;i++){
        var ds = DATASETS[i];

        var ds_template = $('#dataset-selection-template-id').html(); //reads the text
        var st= $(ds_template); //converts to a JQuery object
        var link_name = ds.name+'-link-id';

        st.find('#template-link').attr('id',link_name);
        st.find('#template-title').removeAttr('id','').html(ds.title +'<br/><small>Added: '+ds.date+'</small>');
        st.find('#template-image').attr('src',ds.thumbnail);
        ds_panel.append(st);

        var link = $('#'+link_name);
        link.click({ds:ds}, function(e){ //binding the appropriate object to the click action
            load_dataset(e.data.ds);
        })
    }

}

function setup_labels() {

    var palette = [
        "#ac725e", "#d06b64", "#f83a22", "#fa573c", "#ff7537", "#ffad46", "#42d692",
        "#16a765", "#7bd148", "#b3dc6c", "#fbe983", "#fad165", "#92e1c0", "#9fe1e7",
        "#9fc6e7", "#4986e7", "#9a9cff", "#b99aff", "#c2c2c2", "#cabdbf", "#cca6ac",
        "#f691b2", "#cd74e6", "#a47ae2"
    ];

    var num_labels = palette.length;
    var labels     = [];

    for (var i = 0; i < num_labels; i += 1) {
        var label = new plx.Label((i + 1), 'label-' + (i + 1), palette[i]);
        labels.push(label);
    }

    plx.LABELS = new plx.LabelSet(labels);
    var labels = plx.LABELS.getLabels();
    BRUSH.setLabelID(labels[0].id);
};

function setup_top_menu() {
    $('#datasets-menu-id').click(function () {
        $('#navbar').collapse('hide');
        show_dataset_selection_layout();
    });
};

function setup_file_uploader() {

    var selectDialogLink = $('#file-uploader-link-id');

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    }
    else {
        selectDialogLink.html('File API not supported in this browser');
        selectDialogLink.off('click');
        return;
    }

    var fileSelector = document.createElement('input');
    fileSelector.id  = 'file-uploader-dialog-id';
    fileSelector.setAttribute('type', 'file');
    selectDialogLink.click(function () {
        fileSelector.click();
        return false;
    });

    function handleFiles(ev) {
        var files = ev.target.files;
        load_dataset('local', files);
    }

    fileSelector.addEventListener('change', handleFiles, false);

}

/*-----------------------------------------------------------------------------------------------
 LOAD DATASET
 ------------------------------------------------------------------------------------------------*/
function load_dataset(ds, files) {
    VIEW.reset();
    VIEW.render();

    console.debug(ds);
    show_annotation_layout();

    var dataset = undefined;

    if (ds == 'local') {
        dataset = new plx.Dataset('local', plx.Dataset.SELECT_LOCAL, {files: files});
    }
    else{
        dataset = new plx.Dataset(ds.data, ds.type,{
            'start':ds.start,
            'end':ds.end,
            'step':ds.step
        });
    }

    gui.progressbar.clear().show();
    VIEW.load(dataset, ld_dataset_callback);
}

function ld_dataset_callback(dataset) {
    var percentage = (dataset.num_loaded / dataset.num_items) * 100;
    gui.progressbar.update(percentage);

    if (percentage == 100) {
        gui.progressbar.container.fadeOut(1000, function () {
            var sliceIdx = VIEW.showMiddleSlice();
            gui.slice.slider.noUiSlider.set(sliceIdx);
            VIEW.interactor.connectView();
            update_canvas_size();
        });
    }
}
/*-----------------------------------------------------------------------------------------------
 MAIN
 ------------------------------------------------------------------------------------------------*/
function initPlexo() {

    populate_selection_layout();
    show_dataset_selection_layout();

    setup_file_uploader();
    setup_labels();
    setup_top_menu();
    setup_keyboard();

    VIEW = new plx.View('plexo-canvas-id');

    gui.ctracker         = new gui.CoordinatesTracker(VIEW);
    gui.alert            = new gui.AlertController(VIEW);
    gui.slice            = new gui.SliceController(VIEW);
    gui.toolbar          = new gui.ToolbarController(VIEW);
    gui.brush_dialog     = new gui.BrushDialog(VIEW);
    gui.eraser_dialog    = new gui.EraserDialog(VIEW);
    gui.propagate_dialog = new gui.PropagateDialog(VIEW);
    gui.download_dialog  = new gui.DownloadAnnotationsDialog(VIEW);
    gui.load_dialog      = new gui.LoadAnnotationsDialog(VIEW);
    gui.progressbar      = new gui.DatasetProgressbar(VIEW);
    //gui.viewer3d         = new gui.Viewer3D(VIEW);

}
/*-----------------------------------------------------------------------------------------------
 GLOBAL METHODS - WINDOW OBJECT
 ------------------------------------------------------------------------------------------------*/
function update_canvas_size() {

    if (VIEW == undefined) return;

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

        if (srcWidth == 0) {
            srcWidth = maxWidth;
        }

        if (srcHeight == 0) {
            srcHeight = maxHeight;
        }

        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {width: Math.floor(srcWidth * ratio), height: Math.floor(srcHeight * ratio)};
    }

    var view         = VIEW;
    var heightNavBar = $('div.navbar-header').outerHeight();
    var heightFooter = $('.plexo-footer').outerHeight();
    var heightWindow = $(window).height();
    var widthWindow  = $(window).width();
    var hAvailable   = heightWindow - (heightNavBar + heightFooter);

    var ratio = calculateAspectRatioFit(view.current_slice.image.width,
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
    else {
        if (hAvailable == height) {
            $(view.canvas).css('top', 0);
        }
    }

    if (widthWindow > width) {
        $(view.canvas).css('left', Math.ceil((widthWindow - width) / 2));
    }
    else {
        if (widthWindow == width) {
            $(view.canvas).css('left', 0);
        }
    }

    if (view.hasVideo()) {
        var can_video    = view.video_delegate.canvas;
        can_video.width  = width;
        can_video.height = height;

        can_video.style.setProperty('width', width + 'px', 'important');
        can_video.style.setProperty('height', height + 'px', 'important');

        if (hAvailable > height) {
            $(can_video).css('top', Math.ceil((hAvailable - height) / 2));
        }
        else {
            if (hAvailable == height) {
                $(can_video).css('top', 0);
            }
        }

        if (widthWindow > width) {
            $(can_video).css('left', Math.ceil((widthWindow - width) / 2));
        }
        else {
            if (widthWindow == width) {
                $(can_video).css('left', 0);
            }
        }
        $(can_video).css('z-index', '-1');
    }

    view.render();
}
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
    else {
        if (event.target.id == 'page-wrapper') {
            event.preventDefault();
            event.stopPropagation();
        }
    }
};


