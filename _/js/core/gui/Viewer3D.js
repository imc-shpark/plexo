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

gui.Viewer3D = function(view){
    this.view = view;
    this._viewer = document.getElementById('viewer3d');
    this._setup_events();
    this._setup_webgl();
};

//Implements draggable behaviour
gui.Viewer3D.prototype._setup_events = function(){

    var viewer = this._viewer;
    var jqviewer = $('#viewer3d');
    var dragging = false;
    var offsetX = 0;
    var offsetY = 0;

    viewer.onmousedown = function(e){
        dragging =true;
        var pos = jqviewer.position();
        offsetX = e.clientX -  pos.left;
        offsetY = e.clientY - pos.top;

        if (offsetY > 20){
            dragging = false;
        }
    };

    viewer.onmousemove = function(e){
        if (!dragging) return;
        this.style.top =  (e.clientY - offsetY)+'px';
        this.style.left = (e.clientX - offsetX)+'px';
    };

    viewer.onmouseup = function(e){
        dragging = false;
    };

    viewer.onmouseleave = function(e){
        dragging=false;
    }
};

gui.Viewer3D.prototype._setup_webgl = function(){
    var nview = new nucleo.View('viewer3d-canvas');
    nview.scene.toys.floor.setGrid(10,2);
    nview.start();

    var ncamera = nview.getCurrentCamera();
    ncamera.setType(nucleo.Camera.TYPE.ORBITING);
    ncamera.setPosition(0,3,15);
    ncamera.setFocalPoint(0,3,0);

    this.nview = nview;
    this.ncamera = ncamera;


};

