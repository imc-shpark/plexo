/*-----------------------------------------------------------------------------------------------
 Labels
 ------------------------------------------------------------------------------------------------*/

plx.Label = function(id, name, color){
    this.id = id;
    this.name = name;
    this.color = color;
    this.setColor(color);
};

plx.Label.prototype.setColor = function(color){
    var rgb = plx.hex2rgb(color);
    this.r = rgb.r;
    this.g = rgb.g;
    this.b = rgb.b;
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

plx.LabelSet.prototype.getLabels = function(){
    return this.labels;
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

