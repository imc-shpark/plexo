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
 Zoom Object
 ------------------------------------------------------------------------------------------------*/
plx.Zoom = function () {

    this.x     = 0;
    this.y     = 0;
    this.scale = 1;

    this.delta       = 0;
    this.scaleFactor = 1.1;
};

plx.Zoom.prototype.setFocus = function (x, y) {
    this.x = x;
    this.y = y;
};

plx.Zoom.prototype.transformPoint = function (x, y) {
    var newX = ((x - this.x) / this.scale) + this.x;
    var newY = ((y - this.y) / this.scale) + this.y;
    return [newX, newY];
};

plx.Zoom.prototype.setScaleTouch = function (scale) {
    if (scale < 1) {
        this.scale = 1
    }
    else if (scale <= 50) {
        this.scale = scale;
    }
};

plx.Zoom.prototype.setScaleMouse = function (delta) {
    if (this.delta + delta < 0 || this.delta + delta > 30) {
        if (this.delta + delta < 0) {
            this.scale = 1;
        }
        return;
    }
    this.delta += delta;
    this.scale = Math.pow(this.scaleFactor, this.delta);
};

plx.Zoom.prototype.apply = function (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); //identitiy
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.x, -this.y);
};
