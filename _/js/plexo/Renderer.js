/*-----------------------------------------------------------------------------------------------
 Renderer
 ------------------------------------------------------------------------------------------------*/
/**
 * Responsible for rendering the layers in the appropriate order, and reflecting changes
 * when requested by the different layers.
 * @constructor
 */
plx.Renderer = function (view) {
    this.current = undefined;
    this.stacks  = {};
    this.view    = view;
};

plx.Renderer.BACKGROUND_LAYER = 0;
plx.Renderer.ANNOTATION_LAYER = 1;
plx.Renderer.TOOLS_LAYER      = 2;

plx.Renderer.prototype.addLayer = function (key, index, layer) {
    var stack = this.stacks[key];
    if (stack == undefined) {
        stack            = [];
        this.stacks[key] = stack;
    }

    stack.splice(index, 0, layer);
};

plx.Renderer.prototype.removeLayer = function (key, index) {
    var stack = this.stacks[key];
    if (stack == undefined) {
        console.warn('layer was not removed because the stack ' + key + ' does not exist');
        return;
    }
    stack.splice(index, 0);
};

plx.Renderer.prototype.setCurrentStack = function (key) {
    if (!(key in this.stacks)) {
        this.stacks[key] = [];
    }
    this.current = this.stacks[key];

};

plx.Renderer.prototype.update = function () {
    var stack = this.current;
    for (var i = 0; i < stack.length; i += 1) {
        stack[i].updateLayer(this.view);
    }
};
