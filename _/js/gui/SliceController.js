/*-----------------------------------------------------------------------------------------------
 Slice Controller
 ------------------------------------------------------------------------------------------------*/
gui.SliceController = function (view) {
    this.slider = document.getElementById('dataset-slider-id');

    noUiSlider.create(this.slider, {
        start: init_slice,
        step : step_slice,
        range: {
            'min':[init_slice],
            'max':[end_slice]
        },
        connect:'lower',
        pips:{
            mode:'positions',
            density:4,
            values: [0,25,50,75,100]
        }
    });

    this.slider.noUiSlider.on('slide', function(values, handle){
        var index = parseInt(values[handle])
        message('slice: ' +index);
        VIEW.showSliceByIndex(index);
    });


    view.interactor.addObserver(this, plx.EV_SLICE_CHANGED);
};

gui.SliceController.prototype.processNotification = function (data) {
    this.slider.noUiSlider.set(data.slice);
};

