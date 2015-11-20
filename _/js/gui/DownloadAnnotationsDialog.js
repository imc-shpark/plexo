
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
        self.generateZipFile();
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

        var annotations = self.view.annotation_set.annotations;
        var keys = self.view.annotation_set.getKeys();
        for (var i= 0, N = keys.length; i<N; i+=1){
            if (annotations[keys[i]].isEmpty()){
                continue;
            }

            var row = document.createElement('tr');
            var column = document.createElement('td');

            var acanvas = annotations[keys[i]].canvas;
            var dataURL = acanvas.toDataURL();
            var link = document.createElement('a');
            var filename = 'AL_'+keys[i];
            link.setAttribute('download',filename);
            link.href = dataURL;
            link.innerHTML = " "+filename;

            var thumb = document.createElement('img');
            thumb.setAttribute('width','50px');
            thumb.setAttribute('height','50px');
            thumb.src = dataURL;
            thumb.className='thumb';
            column.appendChild(thumb);
            column.appendChild(link);
            row.appendChild(column);
            tbody.appendChild(row);
        }



    });
};


gui.DownloadAnnotationsDialog.prototype.generateZipFile = function(){
    if (JSZip === undefined){
        throw "JSZip.js not found";
    }
    var zip = new JSZip();


    zip.file('labels.json', JSON.stringify(plx.LABELS));

    var annotations = this.view.annotation_set.annotations;
    var _keys = this.view.annotation_set.getKeys();
    for (var i= 0, N = _keys.length; i<N; i+=1) {
        if (annotations[_keys[i]].isEmpty()) {
            continue;
        }
        var drl = annotations[_keys[i]].canvas.toDataURL();
        drl = drl.substr(drl.indexOf(',')+1);
        zip.file('AL_' + _keys[i], drl,{'base64':true});
    }

    var content = zip.generate({type:'blob'});
    saveAs(content,this.view.dataset.name+'.zip');

};