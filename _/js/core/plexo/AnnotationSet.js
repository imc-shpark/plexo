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
 Annotation Set
 ------------------------------------------------------------------------------------------------*/
plx.AnnotationSet = function (view) {
    this.view = view;
    this.annotations = {}; //dictionary containing the slice-uri, annotation slice object pairing.
    this.messages = []; //save error messages for display if the AnnotationSet had issues loading.
};

//Static constants
plx.AnnotationSet.SAVE_PREVIEW = 'PREVIEW';
plx.AnnotationSet.SAVE_DOWNLOAD = 'DOWLOAD';
plx.AnnotationSet.SAVE_DROPBOX = 'DROPBOX';
plx.AnnotationSet.LOAD_LOCAL = 'LOAD_LOCAL';


/**
 * Returns the set of annotation layers as a list. Useful for set operations
 * @returns {Array}
 */
plx.AnnotationSet.prototype.getKeys = function () {
    return Object.keys(this.annotations).sort();
};

/**
* Loads an annotation set
*/
plx.AnnotationSet.prototype.load = function (payload,_type) {

    this.messages = []; //clear messages

    switch(_type){
        case plx.AnnotationSet.LOAD_LOCAL: this.loadLocal(payload); break;
        default: this.loadLocal(payload);
    }

};

plx.AnnotationSet.prototype.loadLocal = function(payload){

    this.messages = [];

    var labels = payload.labels;
    var annotations = payload.annotations;
    this._createAnnotationLayers(labels,annotations);

};

/**
 * Creates the annotation layers. Used in AnnotationSet.loadLocal
 *
 * @param annotations
 * @private
 */
plx.AnnotationSet.prototype._createAnnotationLayers = function(labels, annotations){

    for(f in annotations){
        var slice_name = f.substr(2, f.length);
        slice_name = slice_name.replace(/\.[^/.]+$/,"");
        var slice = this.view.dataset.getSliceByName(slice_name);
        if (slice == null){
            this.messages.push('No slice was found for annotation '+f);
        }
        else{
            console.debug('Annotation ',f,' loaded for ', slice.name);

            var imageURL = annotations[f];
            var an_layer = this.getAnnotation(slice);
            an_layer.loadFromImageURL(imageURL);
            this.view.showSlice(slice);

        }

    }

};

plx.AnnotationSet.prototype.getMessages = function(){
    return this.messages;
};

plx.AnnotationSet.prototype.save = function (type, options) {

    if (JSZip === undefined){
        throw "ERROR plx.AnnotationSet.save: JSZip.js not found";
    }

    var annotations = this.annotations;
    var keys        = this.getKeys();

    var bundle      = {};

    switch (type) {
        case plx.AnnotationSet.SAVE_DOWNLOAD:
        case plx.AnnotationSet.SAVE_PREVIEW:

            var files = [];

            for (var i = 0, N = keys.length; i < N; i += 1) {

                var annotation = annotations[keys[i]];

                if (annotation.isEmpty()) {
                    continue;
                }

                var file = {
                    dataURL : annotation.getDataURL(),
                    filename: annotation.getFilename()
                };
                if (type != plx.AnnotationSet.SAVE_PREVIEW) {
                    file.dataURL = file.dataURL.substr(file.dataURL.indexOf(',') + 1); //fix base64 string
                }
                files.push(file);

            }
            break;
    }

    bundle.files = files;
    bundle.labels = plx.LABELS;



    if (type == plx.AnnotationSet.SAVE_DOWNLOAD) {

        var zip = new JSZip();
        zip.file('labels.json', JSON.stringify(bundle.labels));

        for (var i = 0, N = bundle.files.length; i < N; i += 1) {
            var file = bundle.files[i];
            zip.file(file.filename, file.dataURL, {'base64': true});
        }

        var content = zip.generate({type: 'blob'});
        saveAs(content,this.view.dataset.name+'.zip');
    }

    return bundle;

};

plx.AnnotationSet.prototype.getAnnotation = function (slice) {

    var aslice = undefined;
    var key    = slice.url; //uses the url as the key in this dictionary

    if (!(key in this.annotations)) {
        aslice                = new plx.AnnotationLayer(slice);
        aslice.setView(this.view); //fixes bug on loading annotations dialog

        this.annotations[key] = aslice;
    }
    else {
        aslice = this.annotations[key];
    }

    return aslice;
};

plx.AnnotationSet.prototype.hasAnnotation = function (slice) {
    var key = slice.url; //uses the url as the key in this dictionary
    return (key in this.annotations);
};

plx.AnnotationSet.prototype.getUsedLabels = function () {

    for (annotation in this.annotations) {
        if (this.annotations.hasOwnProperty(annotation)) {
            var labels = annotation.getUsedLabels();
        }
    }
};
