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

plx.Brush.prototype.setLabelByIndex = function (label_index) {
    var label     = plx.LABELS.getLabelByIndex(label_index);
    this.setColor(label.color);
    this.label_id = label.id;
};

plx.setGlobalBrush = function (brush) {
    plx.BRUSH = brush;
    return plx.BRUSH;
};
