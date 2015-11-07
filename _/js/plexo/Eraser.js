
/*-----------------------------------------------------------------------------------------------
 Eraser
 ------------------------------------------------------------------------------------------------*/
plx.Eraser = function (size) {
    this.size = size;
    this.type = 'square';
};

plx.setGlobalEraser = function (eraser) {
    plx.ERASER = eraser;
    return plx.ERASER;
};
