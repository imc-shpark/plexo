/**
 * Created by dcantor on 20/10/15.
 */
var plx = plx || {};


plx.PI2 = Math.PI * 2;
plx.brush = undefined;


plx.Brush = function(size, opacity, type){
    this.size = size;
    this.opacity= opacity;
    this.type = type;
    this.comp = 'lighten';
    this.color = "rgba(0,0,0,"+opacity+')';
    this.r = 0;
    this.g = 0;
    this.b = 0;

};

plx.Brush.prototype.setColor = function(hex){
    hex = hex.replace('#','');
    this.r = parseInt(hex.substring(0,2), 16);
    this.g = parseInt(hex.substring(2,4), 16);
    this.b = parseInt(hex.substring(4,6), 16);
    this.color = 'rgba('+this.r+','+this.g+','+this.b+','+this.opacity+')';
};


plx.Brush.prototype.setOpacity = function(opacity){
    this.opacity = opacity;
    this.color = 'rgba('+this.r+','+this.g+','+this.b+','+this.opacity+')';
};

plx.setGlobalBrush = function (brush){
    plx.brush = brush;
};

/**
 * Displays an image on a canvas
 */
plx.Slice = function(uri, dataset){

    this.dataset = dataset;
    this.uri    = uri;
    this.image  = new Image();
    this.index  = undefined; //given by the dataset
};


/**
 * Loads he image to display and tries to display it
 * @param filename
 */
plx.Slice.prototype.load = function(){
    var slice = this;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){
            var url = window.URL || window.webkitURL;
            slice.image.src = url.createObjectURL(this.response);
            if (slice.dataset != undefined) {
                slice.dataset.onLoadSlice(slice);
            }
        }
    }

    xhr.open('GET', slice.uri+'?1='+Math.random());
    xhr.responseType = 'blob';
    xhr.send();
};


/**
 * Checks if this is the current slice
 * @returns {boolean}
 */
plx.Slice.prototype.isCurrent = function(view){
    return view.currentSlice == this;
};


plx.Dataset = function(folder,start_item, end_item, step) {
    this.folder     = folder;
    this.slices     = []; //to do set operations
    this.slicemap   = {}; //to quickly access a slice by index
    this.keys       = []; //easy access to keys in the slicemap



    if (step == undefined || step <=0) step = 1;

    for (var i=start_item; i<=end_item; i=i+step) {
        var filename = folder + '/' + folder.substr(folder.lastIndexOf('/') + 1) + '_' + i + '.png';
        var slice = new plx.Slice(filename, this);

        slice.index = i;
        this.slices.push(slice);
        this.slicemap[i] = slice;
        this.keys.push(i);

    }

    this.num_items = this.slices.length;
    this.num_loaded = 0;

    console.debug('dataset: '+folder+', number items: '+this.num_items)
};


plx.Dataset.prototype.load = function(progress_callback) {
    this.progress_callback = progress_callback;

    for (var i=0; i<this.num_items; i++){
        this.slices[i].load();
    }


};

plx.Dataset.prototype.onLoadSlice = function(slice){
    this.num_loaded++;

    if (this.num_loaded == this.num_items){
        console.debug('all items loaded');
    }
    this.progress_callback(this);
};



/**
 *  Represents a list of labels that can be used for segmentation. Corresponds to a list of
 *  elements in the form ID - DESCRIPTION - ATTRIBUTE1 - ATTRIBUTE 2 - ETC..
 *
 *  Labels are read only and must be provided as a JSON file.
 */
plx.Labels = function(labels_uri){
    this.labels_uri;
    this.labels = [];
    //load labels here
};


/**
 * Represents the annotated slice. There can only be one at a time per slice.
 */
plx.AnnotationSlice = function(slice_id){

    this.slice_id = slice_id;
    this.offcanvas = document.createElement("canvas");
    this.ctx = this.offcanvas.getContext("2d");

    this.data = undefined;
    this.lastX = undefined;
    this.lastY = undefined;

    this.history = new Array();
};

plx.AnnotationSlice.prototype.saveStep = function(){
    this.history.push(this.ctx.getImageData(0,0, this.offcanvas.width, this.offcanvas.height));
};

plx.AnnotationSlice.prototype.undo = function(){

    this.history.pop();
    this.data = this.history[this.history.length-1];

    if (this.data == undefined){
        this.ctx.clearRect(0,0,this.offcanvas.width, this.offcanvas.height);
        this.data = this.ctx.getImageData(0,0,this.offcanvas.width, this.offcanvas.height);
    }
    this.ctx.putImageData(this.data,0,0);
};

plx.AnnotationSlice.prototype.startAnnotation = function(x,y,view){

    var brush               = plx.brush;

    this.offcanvas.width    = view.canvas.width;
    this.offcanvas.height   = view.canvas.height;

    this.ctx                = this.offcanvas.getContext("2d");
    var ctx                 = this.ctx;
    ctx.strokeStyle         = plx.brush.color;
    ctx.fillStyle           = plx.brush.color;
    ctx.lineJoin            = brush.type;
    ctx.lineCap             = brush.type;
    ctx.lineWidth           = brush.size;

    this.lastX = x;
    this.lastY = y;


    if (this.data){
        ctx.clearRect(0,0,this.offcanvas.width, this.offcanvas.height);
        ctx.putImageData(this.data,0,0);
    }

}


plx.AnnotationSlice.prototype.updateAnnotation = function(x,y,view) {

    var ctx = this.ctx;
    var brush   = plx.brush;

    var mouseX = x, mouseY = y;
    var x1 = x, x2 = this.lastX, y1 = y, y2 = this.lastY;
    var steep = (Math.abs(y2 - y1) > Math.abs(x2 - x1));

    if (steep){
        var x = x1; x1 = y1; y1 = x;
        var y = y2; y2 = x2; x2 = y;
    }

    if (x1 > x2) {
        var x = x1; x1 = x2; x2 = x;
        var y = y1; y1 = y2; y2 = y;
    }

    var dx = x2 - x1,
        dy = Math.abs(y2 - y1),
        error = 0,
        de = dy / dx,
        yStep = -1,
        y = y1;

    if (y1 < y2) {
        yStep = 1;
    }

    var bsize2 = brush.size*2;
    for (var x = x1; x < x2; x+=1) {
        if (brush.type == 'square') {
            if (steep) {
                ctx.fillRect(y-brush.size, x-brush.size, bsize2, bsize2);
            } else {
                ctx.fillRect(x-brush.size, y-brush.size, bsize2, bsize2);
            }
        }
        else{
            if (steep) {
                ctx.beginPath();
                ctx.arc(y, x, brush.size, 0, plx.PI2);
                ctx.fill();

            } else {
                ctx.beginPath();
                ctx.arc(x,y, brush.size, 0, plx.PI2);
                ctx.fill();
            }
        }
        error += de;
        if (error >= 0.5) {
            y += yStep;
            error -= 1.0;
        }
    }

    this.lastX = mouseX;
    this.lastY = mouseY;


    view.ctx.globalAlpha = 1;
    view.ctx.clearRect(0,0,view.canvas.width, view.canvas.height);
    view.ctx.drawImage(view.currentSlice.image, 0,0, view.canvas.width, view.canvas.height);

    view.ctx.globalAlpha = plx.brush.opacity;
    view.ctx.drawImage(this.offcanvas, 0, 0, view.canvas.width, view.canvas.height);

};

plx.AnnotationSlice.prototype.stopAnnotation = function(){
    this.data = this.ctx.getImageData(0,0, this.offcanvas.width, this.offcanvas.height);
    this.saveStep();
};


plx.AnnotationSlice.prototype.draw = function(view){
    var view_ctx     = view.ctx;
    var off_ctx      = this.ctx;

    off_ctx.clearRect(0,0,this.offcanvas.width, this.offcanvas.height);

    if (this.data) {
        off_ctx.putImageData(this.data,0,0);

        view.ctx.globalAlpha = 1;
        view.ctx.clearRect(0,0,view.canvas.width, view.canvas.height);
        view.ctx.drawImage(view.currentSlice.image, 0,0, view.canvas.width, view.canvas.height);

        view_ctx.globalAlpha = plx.brush.opacity;
        view_ctx.drawImage(this.offcanvas, 0, 0, view.canvas.width, view.canvas.height);
   }
};



plx.AnnotationSet = function(dataset_id,
                          user_id,
                          annotation_set_id,
                          labelset_id){

    this.annotations = {}; //dictionary containing the slice-uri, annotation slice object pairing.

};


plx.AnnotationSet.load = function(anset_url){
  //loads an annotationset given the corresponding JSON file URL
  // the JSON file contains:
  //    the location of the dataset
  //    the user identifier
  //    the location of the annotated set
  //    the location of the label set
};


plx.AnnotationSet.prototype.save = function(){
    // Does two things:
    //  1. Saves a set of annotated images png to a writable location
    //  2. Writes the corresponding anset_url (so we can load this later on).
};


plx.AnnotationSet.prototype.getAnnotationSlice = function(slice_uri){

    var aslice = undefined;

    if (!(slice_uri in this.annotations)){
        aslice = new plx.AnnotationSlice(slice_uri);
        this.annotations[slice_uri] = aslice;
    }
    else{
        aslice = this.annotations[slice_uri];
    }
    return aslice;
};

plx.AnnotationSet.prototype.hasAnnotationSlice = function(slice_uri){
    return (slice_uri in this.annotations);
}


plx.View = function(canvas_id){

    var canvas= document.getElementById(canvas_id);

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.cursor = 'crosshair';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    this.canvas = canvas;
    this.ctx=canvas.getContext("2d");
    this.currentSlice = undefined;


    this.dataset = undefined;
    this.aset = undefined;

    this.interactor = new plx.ViewInteractor(this);
    this.fullscreen = false;


};



plx.View.prototype.clear = function(){
    this.ctx.fillStyle = "#3e495f";
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
};

plx.View.prototype.resizeTo = function(width, height){
    this.canvas.width = width;
    this.canvas.height = height;
};

plx.View.prototype.load = function(dataset, callback){
    this.dataset = dataset;
    dataset.load(callback);
};

plx.View.prototype.showSliceByObject = function(slice){
    this.currentSlice = slice;
    this.resizeTo(slice.image.width, slice.image.height);

    this.ctx.globalAlpha = 1;
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(slice.image, 0, 0, this.canvas.width, this.canvas.height);

};

/**
 * Index in the dictionary (there could be missing indices if the
 * dataset is loaded with step != 1).
 * @param slice
 */
plx.View.prototype.showSliceByIndex = function(slice_index){
    var slice = this.dataset.slicemap[slice_index];
    if (slice == undefined){
        console.error('slice does not exist');
        return;
    }
    this.showSliceByObject(slice);
};


plx.View.prototype.showMiddleSlice = function(){
    var keys = this.dataset.keys;
    var index = Math.floor(keys.length/2);
    var slice = this.dataset.slicemap[keys[index]];
    this.showSliceByObject(slice);
    return keys[index];
};

plx.View.prototype.showCurrentSlice = function(){
    this.showSliceByObject(this.currentSlice);
};

plx.View.prototype.showNextSlice = function(){
    var keys        = this.dataset.keys;
    var key         = this.currentSlice.index;
    var index_key   = keys.indexOf(key);
    var index       = undefined;

    if (index_key < keys.length-1){
        index = keys[index_key+1];
        this.showSliceByObject(this.dataset.slicemap[index]);

    }
    return index;
};

plx.View.prototype.showPreviousSlice = function(){
    var keys        = this.dataset.keys;
    var key         = this.currentSlice.index;
    var index_key   = keys.indexOf(key);
    var index       = undefined;

    if (index_key > 0){
        index = keys[index_key-1];
        this.showSliceByObject(this.dataset.slicemap[index]);
    }

    return index;
};

plx.View.prototype.showCurrentAnnotationSlice = function(){
    var aslice = view.getCurrentAnnotationSlice();
    aslice.draw(this);
}

plx.View.prototype.getAnnotationSlice = function(slice_uri){
    if (this.aset == undefined){ //@TODO: review hard code
        this.aset = new plx.AnnotationSet('spine_phantom_1','dcantor','1','labels_spine');
    }

    var aset = this.aset;
    return aset.getAnnotationSlice(slice_uri);
};

plx.View.prototype.getCurrentAnnotationSlice = function(){
  if (this.aset == undefined){ //@TODO: review hard code
      this.aset = new plx.AnnotationSet('spine_phantom_1','dcantor','1','labels_spine');
  }

  var aset = this.aset;
  return aset.getAnnotationSlice(this.currentSlice.uri);
};


plx.View.prototype.undo = function(){
    var aslice = this.getCurrentAnnotationSlice();
    aslice.undo();
    this.showCurrentSlice();
    this.showCurrentAnnotationSlice();
};

plx.View.prototype.toggleFullscreen = function(){

    var canvas = this.canvas;
    var memento = undefined;

    var ratio = window.devicePixelRatio || 1;
    var width = window.innerWidth * ratio;
    var height = window.innerHeight * ratio;

    if (!this.fullscreen){

        //canvas.mozRequestFullScreen();
        //go fullscreen
        memento = {};
        memento['width'] = canvas.width;
        memento['height'] = canvas.height;
        memento['style-position'] = canvas.style.position;
        memento['style-left'] = canvas.style.left;
        memento['style-top'] = canvas.style.top;
        memento['style-z-index'] = canvas.style.zIndex;


        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'fixed';
        canvas.style.left = 0;
        canvas.style.top = 0;
        canvas.style.zIndex = 1000;
        this.fullscreen = true;
        this.memento = memento;
        this.fullscreen = true;

    }
    else{        //go back from fullscreen
        memento = this.memento;
        if (memento != undefined){
            canvas.width = memento['width'] ;
            canvas.height = memento['height'];
            canvas.style.position = memento['style-position'];
            canvas.style.left = memento['style-left'] ;
            canvas.style.top = memento['style-top'];
            canvas.style.zIndex = memento['style-z-index'];

        }
        this.fullscreen = false;
       // document.mozCancelFullScreen();
        this.fullscreen = false;
    }

    this.showCurrentSlice();
    this.showCurrentAnnotationSlice();
};


plx.ViewInteractor = function(view){
    this.dragging = false;
    this.view = view;
    this.aslice = undefined; //annotation slice
};

plx.ViewInteractor.prototype.connectView = function(){
    var view        = this.view;
    var canvas      = this.view.canvas;
    var interactor  = this;

    canvas.onmousedown      = function(ev) { interactor.onMouseDown(ev); };
    canvas.onmouseup        = function(ev) { interactor.onMouseUp(ev);   };
    canvas.onmousemove      = function(ev) { interactor.onMouseMove(ev);  };
    canvas.onmouseleave     = function(ev){  interactor.onMouseLeave(ev); };
    canvas.onmousewheel     = function(ev){  interactor.onMouseWheel(ev); };
    canvas.addEventListener('dblclick',     function(ev){ interactor.onDoubleClick(ev);  });
    canvas.addEventListener('touchstart',   function(ev){ interactor.onTouchStart(ev); }, false);
    canvas.addEventListener('touchmove',    function(ev){ interactor.onTouchMove(ev); }, false);
    canvas.addEventListener('touchend',     function(ev){ interactor.onTouchEnd(ev); }, false);

    if (Hammer){

        this.mc = new Hammer.Manager(canvas);
        this.mc.add(new Hammer.Press({ event: 'press', pointers: 1 }));
        this.mc.add(new Hammer.Swipe({ event: 'swipe', pointers: 2 }));

        this.mc.on('press', function(ev){
            view.toggleFullscreen();
        });

        this.mc.on('swiperight', function(ev){
            view.showNextSlice();
        });

        this.mc.on('swipeleft', function(ev){
            view.showPreviousSlice();
        });
    }

};

plx.ViewInteractor.prototype.onMouseDown = function(ev){

    this.dragging = true;

    var view    = this.view,
    canvas      = view.canvas,
    rect        = canvas.getBoundingClientRect(),
    x           = Math.round((ev.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
    y           = Math.round((ev.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

    //@TODO: if brush active
    this.aslice = view.getCurrentAnnotationSlice();
    this.aslice.startAnnotation(x,y,view);
    //this.aslice.draw(view);
    //$('#btn-undo-id').removeClass('disabled');
};

plx.ViewInteractor.prototype.onMouseMove = function(ev){

    if  (this.dragging){

        var view    = this.view,
        canvas      = view.canvas,
        rect        = canvas.getBoundingClientRect(),
        x           = Math.round((ev.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
        y           = Math.round((ev.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

        //@TODO: if brush active
        this.aslice.updateAnnotation(x, y, view);
        //this.aslice.draw(view);
    }
};

plx.ViewInteractor.prototype.onMouseUp = function(ev){
    if (this.dragging) {
        this.dragging = false;
        this.aslice.stopAnnotation();
        this.aslice.draw(this.view);
    }
};

plx.ViewInteractor.prototype.onMouseLeave = function(ev){
    if (this.dragging){
        this.dragging = false;
    }
};
/**
 * Toggles the view to/from fullscreen
 * @param ev
 */
plx.ViewInteractor.prototype.onDoubleClick = function(ev){
    this.view.toggleFullscreen();
};
plx.ViewInteractor.prototype.onMouseWheel = function(ev){};

plx.ViewInteractor.prototype.onTouchStart = function(ev){
    if (ev.targetTouches.length !=1) return;

    ev.preventDefault();

    var view    = this.view,
    canvas      = view.canvas,
    rect        = canvas.getBoundingClientRect(),
    touch       = ev.targetTouches[0],
    x           = Math.round((touch.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
    y           = Math.round((touch.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

    this.aslice = view.getCurrentAnnotationSlice();
    this.aslice.startAnnotation(x,y,view);
    //this.aslice.draw(view);

};
plx.ViewInteractor.prototype.onTouchMove = function(ev){

    if (ev.targetTouches.length !=1) return;

    var view    = this.view,
    canvas      = view.canvas,
    rect        = canvas.getBoundingClientRect(),
    touch       = ev.targetTouches[0],
    x           = Math.round((touch.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
    y           = Math.round((touch.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);


    this.aslice.updateAnnotation(x, y, view);

};
plx.ViewInteractor.prototype.onTouchEnd = function(ev){
    this.aslice.stopAnnotation();
    this.aslice.draw(view);
};








