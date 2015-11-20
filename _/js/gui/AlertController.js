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
