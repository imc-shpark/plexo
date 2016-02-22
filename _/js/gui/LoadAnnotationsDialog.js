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

/**
 * Created by dcantor on 17/02/16.
 */

gui.LoadAnnotationsDialog = function(view){
    this.view = view;
    this._dialog = $('#load-annotations-modal-id');
    this.btn_upload_zip = $('#btn-load-zip-id');
    this.annotation_file = $('#annotation-file-id');
    this.error_message = $('#annotation-load-error-id');
    this.file = undefined;

    this._setup_controls();
    this._setup_events();

};


gui.LoadAnnotationsDialog.prototype._setup_controls = function(){
    var self = this;

    this.btn_upload_zip.click(function(){
       self.uploadZipFile();
    });


    var loadAnnotationsLink = $('#load-annotations-link-id');

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        loadAnnotationsLink.html('File API not supported in this browser');
        loadAnnotationsLink.off('click');
        return;
    }

    var fileSelector = document.createElement('input');
    fileSelector.id = 'annotations-uploader-dialog-id';
    fileSelector.setAttribute('type', 'file');
    fileSelector.setAttribute('accept','.zip');
    loadAnnotationsLink.click(function(){
        self.error_message.empty();
        self.annotation_file.empty();
        fileSelector.click(); return false;
    });


    function handleFiles(ev){
        var files = ev.target.files;
        self.file = files[0];
        self.annotation_file.html(files[0].name);
    }

    fileSelector.addEventListener('change', handleFiles, false);
};

gui.LoadAnnotationsDialog.prototype._setup_events = function(){
    var self = this;

    this._dialog.on('show.bs.modal', function () {
        self.error_message.empty();
        self.annotation_file.empty();
    });
}

gui.LoadAnnotationsDialog.prototype.uploadZipFile = function(){

    if (this.view.annotation_set == undefined){
        this.view.annotation_set = new plx.AnnotationSet(this.view);
    }

    var reader = new FileReader();
    var self = this;

    var annotations = {};
    var labels = undefined;

    /**
     * Parses the Zip file and extracts the labels and the set of PNG images corresponding
     * to the annotations
     */
    reader.onload = function(e){
        try {
            var zip = new JSZip(e.target.result); // this event (e) contains the file tha has been read.
            $.each(zip.files, function (index, zipEntry) {

                if (zipEntry.name == "labels.json"){ //labels file
                    labels = JSON.parse(zipEntry.asText());
                }
                else if (zipEntry.name.indexOf('A_') == 0){ //annotation file
                    var arrayBufferView = zipEntry.asUint8Array();
                    var blob = new Blob([arrayBufferView], {type: 'image/png'});
                    var urlCreator = window.URL || window.webkitURL;
                    var imageURL = urlCreator.createObjectURL(blob);
                    annotations[zipEntry.name] = imageURL;
                }
            });

            // Passes the unzipped objects to the annotation set for proper set up.
            var payload = {'labels':labels, 'annotations': annotations};
            self.view.annotation_set.load(payload, plx.AnnotationSet.LOAD_LOCAL);

            // if there are any error messages we show them
            var messages = self.view.annotation_set.getMessages();
            if (messages.length>0) {
                for (var i = 0; i < messages.length; i++) {
                    self.error_message.append(messages[i] + '\n');
                }
            }
            // otherwise the dialog is closed
            else{
                self._dialog.modal('hide');
            }
        }
        catch(ex){
            self.error_message.html('Error reading file ' + self.file.name+ ' : '+ ex.message);
        }
    };

    reader.readAsArrayBuffer(self.file);
};





