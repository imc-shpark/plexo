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
gui.DownloadAnnotationsDialog = function(view){
    this.view = view;
    this._dialog               = $('#download-annotations-modal-id');
    this.btn_download_zip      = $('#btn-download-zip-id');
    this._setup_controls();
    this._setup_events();
};


gui.DownloadAnnotationsDialog.prototype._setup_controls = function(){
    var self = this;
    this.btn_download_zip.click(function(){
        self.downloadZipFile();
    });
}

gui.DownloadAnnotationsDialog.prototype._setup_events = function(){
    var self = this;

    this._dialog.on('show.bs.modal', function () {


        var list = document.getElementById('download-annotations-list-id');
        list.innerHTML ='';
        var table = document.createElement('table');
        var tbody = document.createElement('tbody');


        table.className ='table';
        list.appendChild(table);
        table.appendChild(tbody);

        var bundle = self.view.annotation_set.save(plx.AnnotationSet.SAVE_PREVIEW);
        var files  = bundle.files;

        for (var i= 0, N = files.length; i<N; i+=1){

            var file = files[i];
            var row = document.createElement('tr');
            var column = document.createElement('td');

            var link = document.createElement('a');
            link.setAttribute('download',file.filename);
            link.href = file.dataURL;
            link.innerHTML = " "+file.filename;

            var thumb = document.createElement('img');
            thumb.setAttribute('width','50px');
            thumb.setAttribute('height','50px');
            thumb.src = file.dataURL;
            thumb.className='thumb';

            column.appendChild(thumb);
            column.appendChild(link);
            row.appendChild(column);
            tbody.appendChild(row);
        }

    });
};


gui.DownloadAnnotationsDialog.prototype.downloadZipFile = function(){
    this.view.annotation_set.save(plx.AnnotationSet.SAVE_DOWNLOAD);
    this._dialog.modal('hide');
};