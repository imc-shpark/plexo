/*-----------------------------------------------------------------------------------------------
 Alert Controller
 ------------------------------------------------------------------------------------------------*/
gui.AlertController = function (view) {
    view.interactor.addObserver(this, 'alert-event');
};

gui.AlertController.prototype.showAlert = function (title, message, alert_type, delay) {

    var alert = $('#alert-message-id');
    $(alert).removeAttr('class').attr('class', 'alert');

    if (alert_type == undefined || alert_type == 'alert-info') {
        $(alert).addClass('alert-info');
    }
    else {
        $(alert).addClass(alert_type);
    }

    $(alert).html('<strong>' + title + '</strong>  ' + message);

    var container = $('#alert-container-id');
    $(container).removeAttr('class').attr('class', '');
    $(container).addClass('animated');
    $(container).addClass('fadeInDown');

    //timing out the alert
    var timeout = window.setTimeout(function () {
        $(container).removeClass('fadeInDown').addClass('fadeOutUp');

    }, 5000);

    $(container).click(function (ev) {
        window.clearTimeout(timeout);
        $(container).removeClass('fadeInDown').addClass('fadeOutUp');
    });

    //dismissing it with a click in the alert
    var canvas = document.getElementById('plexo-canvas-id');

    $(canvas).on('click', function (evt) {
        console.debug('click');
        window.clearTimeout(timeout);
        $(container).removeClass('fadeInDown').addClass('fadeOutUp');
        $(this).off(evt);
    });
};

gui.AlertController.prototype.processNotification = function (data) {
    this.showAlert(data.title, data.message, data.type, 3000);
};
