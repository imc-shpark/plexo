var VIEW, BRUSH, ERASER, LABELS;
var init_slice = 210; //remember it starts on one
var end_slice  = 215;
var step_slice = 1;

BRUSH  = plx.setGlobalBrush(new plx.Brush(5, 0.5, 'round'));
ERASER = plx.setGlobalEraser(new plx.Eraser(10));
LABELS = {};

var gui = {} || gui; //gui namespace
