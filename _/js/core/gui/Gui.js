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
 SECTION 1 - HOSTED DATASETS
 ------------------------------------------------------------------------------------------------*/
var DATASETS = [
    {
        'title':'Spine Phantom #1',
        'name':'spinal-phantom',
        'data':'data/ds_us_1',
        'start':1,
        'end':400,
        'step':1,
        'date':'Oct 9, 2015',
        'thumbnail':'data/ds_us_1/ds_us_1_200.png',
        'labels':'data/spine_labels.json'
    },
    {
        'title':'Spine G',
        'name':'spine-g',
        'data':'data/ds_us_goli',
        'start':1,
        'end':660,
        'step':10,
        'date':'March 21, 2015',
        'thumbnail':'data/ds_us_goli/ds_us_goli_330.png',
        'labels':'data/spine_labels.json'

    },
    {
        'title':'Spine J',
        'name':'spine-j',
        'data':'data/ds_us_jay',
        'start':1,
        'end':920,
        'step':15,
        'date':'March 21, 2015',
        'thumbnail':'data/ds_us_jay/ds_us_jay_450.png',
        'labels':'data/spine_labels.json'

    },
    {
        'title':'Brain Tumour Example',
        'name':'brain-example',
        'data':'data/mri_brain_tumour',
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
        'start':1,
        'end':1,
        'step':1,
        'date':'Dec 7, 2015',
        'thumbnail':'data/liver_metastases/liver_metastases_1.png'
    }


];

/*-----------------------------------------------------------------------------------------------
 SECTION 2 - GUI SETUP FUNCTIONS
 ------------------------------------------------------------------------------------------------*/

function show_dataset_selection_layout() {


    if (VIEW) VIEW.reset(); // important! removes all the information in memory from the view when we are about to
        // select a new dataset


    $('#plexo-layout-canvas-id').hide();
    $('#plexo-layout-toolbar-id').hide();

    $('#plexo-layout-tutorials-id').hide();
    $('#plexo-layout-datasets-id').fadeIn('slow');
    $(document.body).css('overflow-y','auto');
};

function show_annotation_layout() {
    $('#plexo-layout-canvas-id').fadeIn('slow');
    $('#plexo-layout-toolbar-id').fadeIn('slow');

    $('#plexo-layout-datasets-id').hide();
    $('#plexo-layout-tutorials-id').hide();
    $(document.body).css('overflow-y','hidden');

};

function show_tutorials_layout(){
    $('#plexo-layout-canvas-id').hide();
    $('#plexo-layout-toolbar-id').hide();
    $('#plexo-layout-datasets-id').hide();

    $('#plexo-layout-tutorials-id').load('tutorial/tutorial.html');
    $(document.body).css('overflow-y','auto');
    $('#plexo-layout-tutorials-id').fadeIn('slow');
}

function setup_selection_layout(){ //used to load remote datasets


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
        link.click({options:ds}, function(e){ //binding the appropriate object to the click action
            load_dataset(undefined, plx.Dataset.STORAGE_REMOTE, e.data.options);
        })
    }

}

function setup_standard_labels() {

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

    $('#tutorials-menu-id').click(function(){
        $('#navbar').collapse('hide');
        show_tutorials_layout();
    })
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
        var N = files.length;

        var ext = files[0].name.substr(files[0].name.lastIndexOf('.')+1);

        //-----------------------------------------------------------------------------------
        //handle special cases:
        //-----------------------------------------------------------------------------------
        if (N == 1 && (ext == 'mp4' || ext == 'png')){
            load_dataset(files, plx.Dataset.STORAGE_LOCAL);
            return;
        }
        else if (N > 1 && ext == 'png'){
            var all_png = false;
            //check that all the files are png
            for (var i; i<N;i+=1){
                var this_ext = files[i].name.substr(files[i].name.lastIndexOf('.')+1);
                all_png = (ext == this_ext);
            }
            if (all_png){
                load_dataset(files, plx.Dataset.STORAGE_LOCAL);
            }
            else{
                alert('Please select only one type of file to load at once');
            }
            return;

        }

        //-----------------------------------------------------------------------------------
        // STANDARD CASE
        // This should be the standard case. At some point we need to get rid of special cases and use
        //this mechanism.
        //-----------------------------------------------------------------------------------
        var reader_callback = function(image_list, name){
            load_dataset(image_list, plx.Dataset.STORAGE_LOCAL,{name:name});
        };


        for (var j=0;j<N;j+=1){
            var file = files[j];
            var ext = file.name.substr(file.name.lastIndexOf('.')+1);
            var reader = gui.reader.ReaderManager.getInstance().getReader(ext);
            if (reader) {
                console.debug('Reading ',file.name);
                reader.read(file,reader_callback);
            }
        }
    }

    fileSelector.addEventListener('change', handleFiles, false);
    fileSelector.onclick = function(){
        this.value = null;
    };
};

/*-----------------------------------------------------------------------------------------------
 SECTION 3 - LOAD DATASETS/LABELS
 ------------------------------------------------------------------------------------------------*/
/**
 * The ds object is a json object that describes the dataset to be loaded. See the
 * global variable DATASETS
 *
 */
function load_dataset(files, storage, options) {

    VIEW.reset();
    VIEW.render();

    show_annotation_layout();

    var dataset = undefined;

    if (storage == plx.Dataset.STORAGE_LOCAL) {
        var url = undefined;
        if (files.length == 1){
            url = files[0].name;
        }
        else if (options.name){
            url = options.name;
        }
        else {
            url = 'local_dataset';
        }
        dataset = new plx.Dataset(url, plx.Dataset.STORAGE_LOCAL, {files: files});
    }
    else {
        dataset = new plx.Dataset(options.data, options.type, {
            'start': options.start,
            'end'  : options.end,
            'step' : options.step
        });
    }

    if (options && options.labels){
        load_labels(options.labels);
    }
    else{
        setup_standard_labels();
    }


    gui.progressbar.clear().show();

    VIEW.load(dataset, ld_dataset_callback); //The view is internally notified as the dataset is progressive loaded
                                             //Every time that a new slice is loaded, the ld_dataset_callback is invoked
                                             //This allows the gui to update the progress bar.
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

function load_labels(url){
    $.getJSON(url, function(data){
        plx.LABELS = new plx.LabelSet(undefined, data);
        var labels = plx.LABELS.getLabels();
        BRUSH.setLabelID(labels[0].id);
    });
};


/*-----------------------------------------------------------------------------------------------
 SECTION 4 - ENTRY POINT
 ------------------------------------------------------------------------------------------------*/
function initPlexo() {

    setup_selection_layout();
    show_dataset_selection_layout();
    setup_file_uploader();
    setup_top_menu();
    setup_keyboard();
    setup_standard_labels();

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

};

/*-----------------------------------------------------------------------------------------------
 SECTION 5 - GLOBAL GUI FUNCTIONS - this is where refactored hacks come to live happily ever after
 ------------------------------------------------------------------------------------------------*/
gui.f = {}; // namespace

gui.f.mouseWait = function(flag){
    if (flag == true) {
        $('body').css('cursor', 'wait');
    }
    else {
        $('body').css('cursor','default');
    }
};





/*-----------------------------------------------------------------------------------------------
  SECTION 6 - UGLY BUT CONVENIENT GUI HACKS - LETS KEEP IT TO A MINIMUM HERE
 ------------------------------------------------------------------------------------------------*/

/*-----------------------------------------------------------------------------------------------
 * AUTOMATICALLY RESIZE CANVAS SIZE TO WINDOW SIZE (OR IPAD ORIENTATION).
 *
 * Resizes the view only AFTER the user is done resizing the window
 *
 * @see http://alvarotrigo.com/blog/firing-resize-event-only-once-when-resizing-is-finished/
 -----------------------------------------------------------------------------------------------*/
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

/*-----------------------------------------------------------------------------------------------
 * INSERT DELAY TO RESIZE CANVAS
 *
 * Resizes the view only AFTER the user is done resizing the window
 *
 * @see http://alvarotrigo.com/blog/firing-resize-event-only-once-when-resizing-is-finished/
 -----------------------------------------------------------------------------------------------*/
var resize_timeout_id;
window.addEventListener('resize', function () {
    clearTimeout(resize_timeout_id);
    resize_timeout_id = setTimeout(update_canvas_size, 500);
});


/*-----------------------------------------------------------------------------------------------*/
/* CENTER MODAL DIALOGS:
 *
 * Center modal dialogs in screen
 * Credit for this elegant solution to keep the modals centered goes to Cory LaViska
 * http://www.abeautifulsite.net/vertically-centering-bootstrap-modals/
 *-----------------------------------------------------------------------------------------------*/
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

/*-----------------------------------------------------------------------------------------------
 * DEACTIVATE REGIONS OF THE INTERFACE THAT SHOULD NOT REACT TO TOUCH:
 *
 * Deactivate global touch events (tested on ipad so far)
 *-----------------------------------------------------------------------------------------------*/
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


