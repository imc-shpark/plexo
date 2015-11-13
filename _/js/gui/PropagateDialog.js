/*-----------------------------------------------------------------------------------------------
 Propagate DIALOG
 ------------------------------------------------------------------------------------------------*/
gui.PropagateDialog = function (view) {
    this.view         = view;
    this._dialog      = $('#label-propagation-modal-id');
    this.used_labels_div = $('#used-labels-div-id');
    this.label_picker = $('#propagate-label-selector-id');
    this.btn_ok       = $('#btn-ok-propagate-id');
    this.labels       = undefined;
    this._setup_events();
    this._setup_controls();
};

gui.PropagateDialog.prototype._setup_events = function () {

    var propagate_dialog = this;

    this._dialog.on('show.bs.modal', function () {
        propagate_dialog.prepare();
    });
};

gui.PropagateDialog.prototype._setup_controls = function () {


};


gui.PropagateDialog.prototype.prepare = function () {

    var selector = this.label_picker;
    if (selector.labelpicker)  selector.labelpicker('destroy');
    selector.html('');

    var labels = this.view.current_annotation.getUsedLabels();

    $.each(labels, function () { selector.append($("<option />", {value: this.color, text: this.name})); });
    this.label_picker.labelpicker({'theme': 'fontawesome', 'list': true, 'multiple': true, 'noselected': true});

    if (labels.length <= 5){
        this.used_labels_div.css('height', (labels.length*40)+20 +'px');
    }
    else{
        this.used_labels_div.removeAttr('style');
    }
};

