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
 Brush
 ------------------------------------------------------------------------------------------------*/
plx.Brush = function (size, opacity, type) {
    this.size     = size;
    this.opacity  = opacity;
    this.type     = type;
    this.color    = "rgba(0,0,0," + opacity + ')';
    this.r        = 0;
    this.g        = 0;
    this.b        = 0;
    this.label_id = undefined;
};

plx.Brush.prototype.getHexColor = function () {
    return plx.rgb2hex(this.r, this.g, this.b);
};

plx.Brush.prototype.setColor = function (hex) {
    var clr    = plx.hex2rgb(hex);
    this.r     = clr.r;
    this.g     = clr.g;
    this.b     = clr.b;
    this.color = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.opacity + ')';
};

plx.Brush.prototype.setOpacity = function (opacity) {
    this.opacity = opacity;
    this.color   = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.opacity + ')';
};

plx.Brush.prototype.setLabelID = function (label_id) {
    this.label_id = label_id;
    var label     = plx.LABELS.getLabelByID(label_id);
    this.setColor(label.color);
    this.label_id = label.id;
};

plx.Brush.prototype.getLabelName = function(){
    var label = plx.LABELS.getLabelByID(this.label_id);
    return label.name;

};

plx.Brush.prototype.setLabelByIndex = function (label_index) {
    var label     = plx.LABELS.getLabelByIndex(label_index);
    this.setColor(label.color);
    this.label_id = label.id;
};

plx.setGlobalBrush = function (brush) {
    plx.BRUSH = brush;
    return plx.BRUSH;
};
