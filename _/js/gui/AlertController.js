/*-----------------------------------------------------------------------------------------------
 Alert Controller
 ------------------------------------------------------------------------------------------------*/
gui.AlertController = function (view) {
    view.interactor.addObserver(this, 'alert-event');
};

gui.AlertController.prototype.showAlert = function (title, message, alert_type) {

    var container = document.getElementById('alert-container-id');

    var alert = document.createElement('div');
    alert.className = 'alert '+alert_type+' alert-dismissable';
    alert.setAttribute('role','alert');
    alert.innerHTML = '<strong>' + title + '</strong>  ' + message;
    alert.innerHTML += "<button type='button' class='close' data-dismiss='alert' aria-label='Close'>Close</button>";
    alert.style.display = 'none';
    container.appendChild(alert);
    $(alert).fadeIn(1000);

    function closeAlert(element){
         $(element).fadeOut('slow', function(){
             $(this).alert('close');
         });
    };

    window.setTimeout(function(){closeAlert(alert);}, 3000);

};


gui.AlertController.prototype.processNotification = function (data) {
    this.showAlert(data.title, data.message, data.type);
};
