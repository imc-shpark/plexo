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
 Coordinates Tracker
 ------------------------------------------------------------------------------------------------*/
gui.CoordinatesTracker = function (view) {
    view.interactor.addObserver(this, plx.EV_COORDS_UPDATED);
};

gui.CoordinatesTracker.prototype.processNotification = function (data) {
    document.getElementById('status-current-coordinates-id').innerHTML = 'x:' + plx.COORDINATES.X.toPrecision(3) + ', y:' + plx.COORDINATES.Y.toPrecision(3);
};
