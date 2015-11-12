
gui.DownloadAnnotationsDialog = function(view){
    this.view = view;
    this._dialog               = $('#download-annotations-modal-id');
    this._setup_events();
};

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

        var annotations = self.view.aset.annotations;
        var keys = self.view.aset.getKeys();
        for (var i= 0, N = keys.length; i<N; i+=1){
            if (annotations[keys[i]].isEmpty()){
                continue;
            }

            var row = document.createElement('tr');
            var column = document.createElement('td');

            var acanvas = annotations[keys[i]].canvas
            var dataURL = acanvas.toDataURL();
            var link = document.createElement('a');
            link.setAttribute('download','annotation_'+keys[i]);
            link.href = dataURL;
            link.innerHTML = " Annotation Layer - "+keys[i];

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