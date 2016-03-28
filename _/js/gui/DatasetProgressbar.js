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

gui.DatasetProgressbar = function(view){
  this.view = view;
  this.bar =  $('#dataset-progressbar-id');
  this.container =  $('#dataset-progressbar-container-id');
};

gui.DatasetProgressbar.prototype.show = function(){
    this.container.show();
    return this;
};

gui.DatasetProgressbar.prototype.hide = function(){
    this.container.hide();
    return this;
};

gui.DatasetProgressbar.prototype.update = function(value){
    this.bar.css('width', value + '%').attr('aria-valuenow', value);
    this.bar.html(Math.round(value)+'%');
};

gui.DatasetProgressbar.prototype.clear = function(){
    this.bar.css('width', 0 + '%').attr('aria-valuenow', 0);
    return this;
};