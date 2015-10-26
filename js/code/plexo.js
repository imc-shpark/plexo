/**
 * Created by dcantor on 20/10/15.
 */
var plx = plx || {};

plx.Brush = function(size, opacity, type){
    this.size = size;
    this.opacity= opacity;
    this.type = type;
};

plx.Brush.prototype.setColor = function(hex){
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);

    result = 'rgba('+r+','+g+','+b+','+this.opacity/100+')';
    return result;
};

plx.setGlobalBrush = function (brush){
    plx.brush = brush;
};

/**
 * Displays an image on a canvas
 */
plx.Slice = function(uri, dataset){
    this.dataset = dataset;
    this.uri= uri;
    this.image = new Image();
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
    this.folder = folder;
    this.slices = [];   //to do set operations
    this.slicemap = {}; //to quickly access a slice by index

    if (step == undefined || step <=0) step = 1;

    for (var i=start_item; i<=end_item; i=i+step) {
        var filename = folder + '/' + folder.substr(folder.lastIndexOf('/') + 1) + '_' + i + '.png';
        var slice = new plx.Slice(filename, this);
        this.slices.push(slice);
        this.slicemap[i] = slice;
    }
    this.num_items = this.slices.length;
    this.num_loaded = 0;
    console.debug('number items: '+this.num_items)
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
    this.data = undefined;
    this.lastX = undefined;
    this.lastY = undefined;
    this.ctx = this.offcanvas.getContext("2d");

    this.list = [];
};



plx.AnnotationSlice.prototype.update = function(label, x,y, start, view) {

    this.offcanvas.width = view.canvas.width;
    this.offcanvas.height = view.canvas.height;
    var ctx = this.ctx;
    var brush = plx.brush;

    if (this.data) {
        var image = new Image();
        image.src = this.data;
        ctx.drawImage(image, 0, 0, view.canvas.width, view.canvas.height);
    }

    ctx.beginPath();
    ctx.strokeStyle = "#F0A5F6";
    ctx.fillStyle   = "#F0A5F6";
    ctx.lineJoin    = brush.type;
    ctx.lineCap     = brush.type;
    ctx.lineWidth   = brush.size;

    if (!start) {
        ctx.moveTo(x,y);
        ctx.lineTo(x+1,y+1);
    }
    else{
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x,y);
    }
    console.debug(x,y, this.lastX, this.lastY);
    this.list.push({x:x, y:y, lastX:this.lastX, lastY:this.lastY, start:start});

    ctx.closePath();
    ctx.stroke();

    this.lastX = x;
    this.lastY = y;
    this.data = this.offcanvas.toDataURL('image/png');

};

plx.AnnotationSlice.prototype.draw = function(view){

    var ctx = view.ctx;
    var brush = plx.brush;

    var image2 = document.getElementById('image-id');

    if (this.data) {
        var image = new Image();
        image.src = this.data;
        ctx.drawImage(image, 0, 0, view.canvas.width, view.canvas.height);
        image2.src = this.data;
   }

    ctx.beginPath();
    ctx.strokeStyle = "#F0A5F6";
    ctx.fillStyle = "#F0A5F6";
    ctx.lineJoin = brush.type;
    ctx.lineCap = brush.type;
    ctx.lineWidth = brush.size;

    var N = this.list.length;
    for (var i= 0; i<N; i++){
        var item = this.list[i];
        var x = item.x;
        var y = item.y;
        var lastX = item.lastX;
        var lastY = item.lastY;
        var start = item.start;
        if (!start){
            ctx.moveTo(x,y);
            ctx.lineTo(x+1,y+1);
        }
        else {
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
        }
}
    ctx.closePath();
    ctx.stroke();

    /*else {
        ctx.drawImage(this.offcanvas, 0, 0, view.canvas.width, view.canvas.height);
    }*/
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
    this.ctx.drawImage(slice.image, 0, 0, this.canvas.width, this.canvas.height);

};

/**
 * Index in the dictionary (there could be missing indices if the
 * dataset is loaded with step != 1).
 * @param slice
 */
plx.View.prototype.showSliceByIndex = function(slice_index, redraw){

    _redraw = redraw==undefined?false:redraw;

    var slice = this.dataset.slicemap[slice_index];

    if (slice == undefined){
        console.error('slice does not exist');
        return;
    }

    if (this.currentSlice != slice){
        this.showSliceByObject(slice);
    }
    else if (this.currentSlice == slice && _redraw){
        this.showSliceByObject(slice);
    }
};


plx.View.prototype.showMiddleSlice = function(){
    var keys = [];
    for (key in this.dataset.slicemap){
        keys.push(key);
    }

    var index = Math.floor(keys.length/2);
    var slice = this.dataset.slicemap[keys[index]];
    this.showSliceByObject(slice);
    return keys[index];
};

plx.View.prototype.showCurrentSlice = function(){
    this.showSliceByObject(this.currentSlice);
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


plx.View.prototype.toggleFullscreen = function(){

    var canvas = this.canvas;
    var memento = undefined;

    var ratio = window.devicePixelRatio || 1;
    var width = window.innerWidth * ratio;
    var height = window.innerHeight * ratio;

    if (!this.fullscreen){
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

    }
    else{
        //go back from fullscreen
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
    }

    this.showCurrentSlice();
    this.showCurrentAnnotationSlice();
};


plx.ViewInteractor = function(view){
    this.dragging = false;
    this.view = view;
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

    /*if (Hammer){

        console.debug('hammer is included');
        this.mc = new Hammer.Manager(canvas);
        this.mc.add(new Hammer.Press({ event: 'press', pointers: 1 }));
        this.mc.on('press', function(ev){
            alert('press');
            view.toggleFullscreen();
        });
    }*/

};

plx.ViewInteractor.prototype.onMouseDown = function(ev){

    this.dragging = true;
    var canvas = this.view.canvas;
    var rect = canvas.getBoundingClientRect();
    var x = Math.round((ev.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
    var y = Math.round((ev.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

    var view = this.view;
    var aslice = view.getCurrentAnnotationSlice();

    aslice.update('label-any',x,y,false, this.view);
    aslice.draw(this.view);
};

plx.ViewInteractor.prototype.onMouseMove = function(ev){

    if  (this.dragging){
        var canvas = this.view.canvas;
        var rect = canvas.getBoundingClientRect();
        var x = Math.round((ev.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
        var y = Math.round((ev.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

        var view = this.view;
        var aslice = view.getCurrentAnnotationSlice();
        aslice.update('label-any', x, y, true, this.view);
        aslice.draw(this.view);
    }
};

plx.ViewInteractor.prototype.onMouseUp = function(ev){
    if (this.dragging) {
        this.dragging = false;
    }

};


plx.ViewInteractor.prototype.onMouseLeave = function(ev){
    if (this.dragging){
        this.dragging = false;
    }

};

plx.ViewInteractor.prototype.onDoubleClick = function(ev){
    this.view.toggleFullscreen();
};

plx.ViewInteractor.prototype.onMouseWheel = function(ev){

};

plx.ViewInteractor.prototype.onTouchStart = function(ev){
    if (ev.targetTouches.length !=1) return;

    ev.preventDefault();
    var canvas = this.view.canvas;
    var rect = canvas.getBoundingClientRect();


    var touch = ev.targetTouches[0];

    var x = Math.round((touch.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
    var y = Math.round((touch.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

    var view = this.view;
    var aslice = view.getCurrentAnnotationSlice();
    aslice.update('label-any', x, y, false, this.view);
    aslice.draw(this.view);

};

plx.ViewInteractor.prototype.onTouchMove = function(ev){

    if (ev.targetTouches.length !=1) return;

    var canvas = this.view.canvas;
    var rect = canvas.getBoundingClientRect();


    var touch = ev.targetTouches[0];

    var x = Math.round((touch.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
    var y = Math.round((touch.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);

    var view = this.view;
    var aslice = view.getCurrentAnnotationSlice();
    aslice.update('label-any', x, y, true, this.view);
    aslice.draw(this.view);
};

plx.ViewInteractor.prototype.onTouchEnd = function(ev){

};








