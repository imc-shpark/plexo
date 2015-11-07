/*-----------------------------------------------------------------------------------------------
 Labels
 ------------------------------------------------------------------------------------------------*/
plx.LabelSet = {};

plx.LabelSet.getLabelByIndex = function (label_index) {
    if (label_index > 0 && label_index <= plx.LABELS.length) {
        return plx.LABELS[label_index - 1];
    }
    else {
        return undefined;
    }
};

plx.LabelSet.getLabelByID = function (label_id) {
    var N = plx.LABELS.length;
    for (var i = 0; i < N; i += 1) {
        if (plx.LABELS[i].id == label_id) {
            return plx.LABELS[i];
        }
    }
    return undefined;
};

plx.setGlobalLabels = function (labels) {
    plx.LABELS = labels;
    return plx.LABELS;
};

plx.hex2rgb = function (hex) {
    hex   = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return {'r': r, 'g': g, 'b': b};
}

plx.rgb2hex = function (R, G, B) {
    function toHex(n) {
        n = parseInt(n, 10);
        if (isNaN(n)) {
            return "00";
        }
        n = Math.max(0, Math.min(n, 255));
        return "0123456789ABCDEF".charAt((n - n % 16) / 16)
            + "0123456789ABCDEF".charAt(n % 16);
    }

    return '#' + toHex(R) + toHex(G) + toHex(B);
};
