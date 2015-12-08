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
 View Interactor
 ------------------------------------------------------------------------------------------------*/
plx.ViewInteractor = function (view) {

    this.dragging          = false;
    this.view              = view;
    this.aslice            = undefined;
    this.observers         = {};
    this.zooming           = false;
    this._long_press_timer = null;
    this._ongoing_touches  = [];
    this._distance         = 0;
    this._midpoint         = 0;
    this._scale            = 1;

    plx.zoom = new plx.Zoom();  //this is a good place
};

plx.ViewInteractor.prototype.connectView = function () {
    var view       = this.view;
    var canvas     = this.view.canvas;
    var interactor = this;


    canvas.onmousedown  = function (ev) { interactor.onMouseDown(ev); };
    canvas.onmouseup    = function (ev) { interactor.onMouseUp(ev); };
    canvas.onmousemove  = function (ev) { interactor.onMouseMove(ev); };
    canvas.onmouseleave = function (ev) { interactor.onMouseLeave(ev); };
    canvas.onwheel      = function (ev) { interactor.onWheel(ev);};
    canvas.addEventListener('dblclick', function (ev) { interactor.onDoubleClick(ev); }, false);

    canvas.addEventListener('touchstart', function (ev) { interactor.onTouchStart(ev); }, false);
    canvas.addEventListener('touchmove', function (ev) { interactor.onTouchMove(ev); }, false);
    canvas.addEventListener('touchend', function (ev) { interactor.onTouchEnd(ev); }, false);


    document.onkeyup = function (ev) { interactor.onKeyUp(ev);}

};

plx.ViewInteractor.prototype.addObserver = function (observer, kind) {
    var list = this.observers[kind];
    if (list == undefined) {
        list                 = [];
        this.observers[kind] = list;
    }

    if (list.indexOf(observer) < 0) {
        list.push(observer);
    }
};

plx.ViewInteractor.prototype.notify = function (kind, data) {
    var list = this.observers[kind];

    if (list == undefined) {
        return;
    } //no listeners for this

    for (var i = 0; i < list.length; i += 1) {
        list[i].processNotification(kind,data);
    }
};

plx.ViewInteractor.prototype._getCanvasCoordinates = function (eventX, eventY) {

    var canvas = this.view.canvas;
    var rect   = canvas.getBoundingClientRect();
    var x      = Math.round((eventX - rect.left) / (rect.right - rect.left) * canvas.width);
    var y      = Math.round((eventY - rect.top) / (rect.bottom - rect.top) * canvas.height);

    var zcoords = plx.zoom.transformPoint(x, y);
    x           = zcoords[0];
    y           = zcoords[1];

    return [x, y];
};

plx.ViewInteractor.prototype.action_startAnnotation = function (x, y) {
    var view    = this.view;
    this.aslice = view.getCurrentAnnotationLayer();
    this.aslice.startAnnotation();

};

plx.ViewInteractor.prototype.action_paintBucket = function (x, y) {

    var aslice = this.view.getCurrentAnnotationLayer();

    if (aslice.isEmpty() && plx.CURRENT_OPERATION == plx.OP_DELETE) {
        this.notify('alert-event', {'type': 'alert-info', 'title': 'Eraser', 'message': 'Nothing to erase'});
        return;
    }

    x          = Math.round(x);
    y          = Math.round(y);
    plx.bucket = new plx.PaintBucket(aslice);
    plx.bucket.fill(x, y, plx.BRUSH.getHexColor());
    this.view.render();
};

plx.ViewInteractor.prototype.action_paintBucket_long_press = function (x, y, delay) {
    var interactor = this;
    var px         = x;
    var py         = y;

    function deferred_execution() {
        interactor.action_paintBucket(px, py);
    }

    this._long_press_timer = window.setTimeout(deferred_execution, delay);
}

plx.ViewInteractor.prototype.action_panning = function (x, y) {
    plx.zoom.setFocus(x, y);
    this.view.render();
    message('panning');
};

plx.ViewInteractor.prototype.action_zooming = function (scale, mouseOrTouch) {

    if (mouseOrTouch == 'mouse') {

        plx.zoom.setScaleMouse(scale);
        message('zoom (mouse): ' + plx.zoom.scale.toPrecision(3));
        this.view.render();

    }
    else {
        if (mouseOrTouch == 'touch') {

            plx.zoom.setScaleTouch(scale);
            this.view.render();
            message('zoom (touch): ' + scale.toPrecision(3));

        }
        else {
            message('Error: unknown type of zooming');
        }
    }
}

plx.ViewInteractor.prototype.onKeyUp = function(ev){
    if (ev.keyCode == 17 && plx.CURRENT_OPERATION == plx.OP_PANNING){
        plx.setCurrentOperation(this.last_operation);
        this.notify(plx.EV_OPERATION_CHANGED, {'operation': this.last_operation});
    }
};

plx.ViewInteractor.prototype.onDoubleClick = function (ev) {
    ev.preventDefault();
    var coords = this._getCanvasCoordinates(ev.clientX, ev.clientY);
    this.action_paintBucket(coords[0], coords[1]);
    plx.COORDINATES.X = coords[0];
    plx.COORDINATES.Y = coords[0];
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onMouseDown = function (ev) {
    this.initX = plx.COORDINATES.X;
    this.initY = plx.COORDINATES.Y;

    var coords = this._getCanvasCoordinates(ev.clientX, ev.clientY);


    this.action_paintBucket_long_press(coords[0], coords[1], 1000);

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:

            this.dragging = true;
            this.action_startAnnotation(coords[0], coords[1]);
            break;

        case plx.OP_PAINT_BUCKET:
            this.action_paintBucket(coords[0], coords[1]);
            break;
    }

    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onMouseMove = function (ev) {

    var coords = this._getCanvasCoordinates(ev.clientX, ev.clientY);
    var x      = coords[0];
    var y      = coords[1];

    clearTimeout(this._long_press_timer);
    /*if ((Math.abs(this.initX - x) > 3) && (Math.abs(this.initY - y) > 3)) { //it moved too much

     }*/

    if (ev.ctrlKey){
        if (plx.CURRENT_OPERATION != plx.OP_PANNING){
            this.last_operation = plx.CURRENT_OPERATION;
            console.debug('previous operation: '+this.last_operation);
            plx.setCurrentOperation(plx.OP_PANNING);
        }
        this.action_panning(x,y);
    }

    else {

        switch (plx.CURRENT_OPERATION) {
            case plx.OP_ANNOTATE:
            case plx.OP_DELETE:
                if (this.dragging) {
                    this.aslice = this.view.getCurrentAnnotationLayer();
                    message('annotating/deleting with mouse');
                    this.aslice.updateAnnotation(x, y);
                }
                break;
        }
    }

    plx.COORDINATES.X = x;
    plx.COORDINATES.Y = y;
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onMouseUp = function (ev) {

    clearTimeout(this._long_press_timer);

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:

            if (this.dragging) {
                this.aslice.saveAnnotation();
                message('annotation completed');
                this.dragging = false;

            }
            break;



    }
};

plx.ViewInteractor.prototype.onMouseLeave = function (ev) {

    clearTimeout(this._long_press_timer);

    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE || plx.CURRENT_OPERATION == plx.OP_DELETE) {
        if (this.dragging) {
            this.dragging = false;
        }
    }
};

plx.ViewInteractor.prototype.onWheel = function (ev) {
    ev.preventDefault();

    var direction = (ev.deltaY < 0 || ev.wheelDeltaY > 0) ? 1 : -1;

    if (!ev.ctrlKey && plx.CURRENT_OPERATION != plx.OP_ZOOM) {

        var slice = undefined;

        if (direction > 0) {
            slice = this.view.showPreviousSlice();

        }
        else {
            if (direction < 0) {
                slice = this.view.showNextSlice();

            }
        }

        message('slice: ' + slice);
        this.view.render();
        this.notify(plx.EV_SLICE_CHANGED, {'slice': slice}); //updates slider
        return;
    }
    else {
        if (plx.zoom.scale == 1) {
            plx.zoom.setFocus(plx.COORDINATES.X, plx.COORDINATES.Y);
        }
        this.action_zooming(direction, 'mouse');
    }
    this.notify(plx.EV_COORDS_UPDATED);
};

/*-----------------------------------------------------------------------------------------------
 Touch Events
 ------------------------------------------------------------------------------------------------*/
plx.ViewInteractor.prototype.onTouchStart = function (ev) {
    ev.preventDefault();

    message('started touch');

    var touches = ev.changedTouches;

    for (var t = 0; t < touches.length; t++) {
        this._ongoing_touches.push(this._copyTouch(touches[t]));
    }

    touches = this._ongoing_touches;

    if (touches.length == 1 && !this.zooming) {
        this.onSingleTouchStart(touches[0])
    }
    else {
        if (touches.length == 2) {
            this.onDoubleTouchStart(touches);
        }
    }
};

plx.ViewInteractor.prototype.onTouchMove = function (ev) {

    var view   = this.view;
    var canvas = view.canvas;
    var rect   = canvas.getBoundingClientRect();

    var touches         = ev.targetTouches;
    var changed_touches = ev.changedTouches;

    if (touches.length == 1 && changed_touches.length == 1 && !this.zooming) { //annotating
        this.onSingleTouchMove(touches[0]);
    }

    if (touches.length == 2 && (changed_touches.length == 1 || changed_touches.length == 2)) {
        this.onDoubleTouchMove(touches);
        this.zooming = true;
    }

};

plx.ViewInteractor.prototype.onTouchEnd = function (ev) {

    clearTimeout(this._long_press_timer); //avoid redundance in the individual end methods

    var touches = ev.changedTouches;

    // DEBUG CODE
    //console.log('changed touches:', touches.length);
    //for (var i=0; i<touches.length; i++){
    //    console.log(touches[i])
    //}
    //console.log('ongoing touches:', this._ongoing_touches.length);
    //for (var i=0;i<this._ongoing_touches.length; i++){
    //    console.log(this._ongoing_touches[i]);
    //}

    for (var i = 0; i < touches.length; i++) { // remove the touch and see what we are left with
        var idx = this._ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) {
            this._ongoing_touches.splice(idx, 1);
            //console.log(' removing ', idx);
        }
    }
    //console.log('after removing ongoing touch, remaining:',this._ongoing_touches.length);

    if (touches.length == 1 && this._ongoing_touches.length == 0) {
        if (!this.zooming) {
            this.onSingleTouchEnd(touches[0]);
        }
        else {
            //message('zooming ended');
        }
        this.zooming = false;
    }
    else {
        if (touches.length == 1 && this._ongoing_touches.length == 1) {
            this.onOneOfTwoTouchEnd(touches[0], this._ongoing_touches[0]);
            //still zooming until last finger is released
        }
        else {
            if (touches.length == 2 && this._ongoing_touches.length == 0) {
                this.onDoubleTouchEnd(touches);
                this.zooming = false;
            }
        }
    }
};

plx.ViewInteractor.prototype._getMidpoint = function (arr) {
    var coords = {};
    coords.x   = Math.round((arr[0] + arr[2]) / 2);
    coords.y   = Math.round((arr[1] + arr[3]) / 2);
    return coords;
};

plx.ViewInteractor.prototype._copyTouch = function (touch) {
    return {
        identifier: touch.identifier,
        pageX     : touch.pageX,
        pageY     : touch.pageY,
        clientX   : touch.clientX,
        clientY   : touch.clientY
    };
};

plx.ViewInteractor.prototype._ongoingTouchIndexById = function (idToFind) {

    for (var i = 0; i < this._ongoing_touches.length; i++) {
        if (this._ongoing_touches[i].identifier == idToFind) {
            return i;
        }
    }
    return -1;
};

plx.ViewInteractor.prototype.onSingleTouchStart = function (touch) {

    var coords = this._getCanvasCoordinates(touch.clientX, touch.clientY);

    console.log('single coords:' + coords[0] + ', ' + coords[1]);

    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    this.initX = x;
    this.initY = y;

    this.action_paintBucket_long_press(x, y, 1000);

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:
            this.action_startAnnotation(x, y);
            break;

        case plx.OP_PAINT_BUCKET:
            this.action_paintBucket(x, y);
            break;
    }

    plx.setCurrentCoordinates(x, y)
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onSingleTouchMove = function (touch) {

    message('annotating...');

    var coords = this._getCanvasCoordinates(touch.clientX, touch.clientY);

    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    //required because of sensitivity of screen to motion
    if ((Math.abs(this.initY - y) > 5) && (Math.abs(this.initX - x) > 5)) {
        clearTimeout(this._long_press_timer);
    }

    switch (plx.CURRENT_OPERATION) {
        case plx.OP_ANNOTATE:
        case plx.OP_DELETE:
            this.aslice.updateAnnotation(x, y);
            break;
        case plx.OP_PANNING:
            this.action_panning(x, y);
            break;
    }

    plx.setCurrentCoordinates(x, y);
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onSingleTouchEnd = function (touchReleased) {

    if (plx.CURRENT_OPERATION == plx.OP_ANNOTATE || plx.CURRENT_OPERATION == plx.OP_DELETE) {
        this.aslice.saveAnnotation();
        this.view.render();
    }

    message('last touch ended');
};

plx.ViewInteractor.prototype._getDistanceScreen = function (touches) {
    var canvas = this.view.canvas;
    var rect   = canvas.getBoundingClientRect();

    t1 = touches[0];
    t2 = touches[1];

    var t1_x = Math.round((t1.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    var t1_y = Math.round((t1.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    var t2_x = Math.round((t2.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    var t2_y = Math.round((t2.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);

    var x = Math.pow(t1_x - t2_x, 2);
    var y = Math.pow(t1_y - t2_y, 2);

    return Math.sqrt(x + y);
};

plx.ViewInteractor.prototype.onDoubleTouchStart = function (touches) {

    window.clearTimeout(this._long_press_timer);

    //Distance in screeen coordinates
    this._distance = this._getDistanceScreen(touches);

    //Zooming centre
    var touch1 = touches[0];
    var touch2 = touches[1];

    var tc1 = this._getCanvasCoordinates(touch1.clientX, touch1.clientY);
    var tc2 = this._getCanvasCoordinates(touch2.clientX, touch2.clientY);

    var coords     = [tc1[0], tc1[1], tc2[0], tc2[1]];
    this._midpoint = this._getMidpoint(coords);
    this._scale    = plx.zoom.scale;

    plx.zoom.setFocus(this._midpoint.x, this._midpoint.y);

    //Notifications
    //console.log('>>> INITIAL FOCUS:' + this._midpoint.x + ', ' + this._midpoint.y);

    message('zoom start. scale:' + this._scale.toPrecision(3));
    plx.setCurrentCoordinates(this._midpoint.x, this._midpoint.y);
    this.notify(plx.EV_COORDS_UPDATED);
    this.notify(plx.EV_OPERATION_CHANGED, {'operation': plx.OP_ZOOM});
};

plx.ViewInteractor.prototype.onDoubleTouchMove = function (touches) {

    //Updating scale
    var distance = this._getDistanceScreen(touches);
    var scale    = distance / this._distance * this._scale; //wait until release to update this._scale
    if (scale < 1) { scale = 1;}                            //to avoid 'snowballing'

    var touch1 = touches[0];
    var touch2 = touches[1];

    var tc1 = this._getCanvasCoordinates(touch1.clientX, touch1.clientY);
    var tc2 = this._getCanvasCoordinates(touch2.clientX, touch2.clientY);

    var coords     = [tc1[0], tc1[1], tc2[0], tc2[1]];
    this._midpoint = this._getMidpoint(coords);
    var mp         = this._midpoint;

    this.action_zooming(scale, 'touch');

    plx.setCurrentCoordinates(mp.x, mp.y);
    this.notify(plx.EV_COORDS_UPDATED);
};

plx.ViewInteractor.prototype.onOneOfTwoTouchEnd = function (touchReleased, touchPending) {
    message('lifted one of two fingers. zoom:' + plx.zoom.scale.toPrecision(3));
};

plx.ViewInteractor.prototype.onDoubleTouchEnd = function (touchesReleased) {
    message('lifted two fingers. ending zoom :' + plx.zoom.scale.toPrecision(3));
};

