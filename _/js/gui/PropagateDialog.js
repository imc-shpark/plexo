/*-----------------------------------------------------------------------------------------------
 Propagate DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.PropagateDialog = function(view){
    this.view = view;
    this._dialog      = $('#label-propagation-modal-id');
    this.label_picker = $('#propagate-label-selector-id');
    this.btn_ok       = $('#btn-ok-propagate-id');
    this._setup_events();
    this._setup_controls();
};

gui.PropagateDialog.prototype._setup_events = function(){

    var propagate_dialog = this;

    this._dialog.on('shown.bs.modal', function () {
        propagate_dialog.update_picker();
    });
};

gui.PropagateDialog.prototype._setup_controls = function(){

    this.btn_ok.click(function(){
        alert();
    });

}

gui.PropagateDialog.prototype.update_picker = function(){
    var labels = LABELS;

    var selector = this.label_picker;
    selector.labelpicker('destroy');
    selector.html('');
    $.each(labels, function () { selector.append($("<option />", {value: this.color, text: this.id})); });


    this.label_picker.labelpicker({'theme':'fontawesome','list':true, 'multiple':true, 'noselected':true});
};

