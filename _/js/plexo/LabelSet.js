/*-----------------------------------------------------------------------------------------------
 Labels
 ------------------------------------------------------------------------------------------------*/

plx.Label = function(id, name, hexcolor){
    this.id = id;
    this.name = name;
    this.color = hexcolor;
    this.setColor(hexcolor);
};

plx.Label.prototype.setColor = function(hexcolor){
    var rgb = plx.hex2rgb(hexcolor);
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
    this.color = hexcolor;
};


plx.LabelSet = function(labels){
    this.labels = labels;
};

plx.LabelSet.prototype.getLabelByIndex = function (label_index) {

    if (label_index > 0 && label_index <= this.labels.length) {
        return this.labels[label_index - 1];
    }
    else {
        return undefined;
    }
};

plx.LabelSet.prototype.getLabelByID = function (label_id) {
    var N = this.labels.length;
    for (var i = 0; i < N; i += 1) {
        if (this.labels[i].id == label_id) {
            return this.labels[i];
        }
    }
    return undefined;
};

plx.LabelSet.prototype.getLabelByName = function(label_name){
    var N = this.labels.length;
    for (var i = 0; i < N; i += 1) {
        if (this.labels[i].name == label_name) {
            return this.labels[i];
        }
    }
    return undefined;
};

plx.LabelSet.prototype.getLabelByRGBColor = function(r,g,b){
    var N = this.labels.length;

    for (var i=0; i<N; i++){
        var label = this.labels[i];

        if (label.r == r && label.g == g && label.b == b){
            return label;
        }
    }
    return undefined;
};


plx.LabelSet.prototype.getLabelByHexColor = function(label_hexcolor){
    var N = this.labels.length;
    for (var i = 0; i < N; i += 1) {
        if (this.labels[i].color == label_hexcolor) {
            return this.labels[i];
        }
    }
    return undefined;
};

plx.LabelSet.prototype.getLabels = function(){
    return this.labels;
};



