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
 Slice Controller
 ------------------------------------------------------------------------------------------------*/
gui.SliceController = function (view) {
    this.view = view;
    this.slider = document.getElementById('dataset-slider-id');
    view.interactor.addObserver(this, plx.EV_SLICE_CHANGED);
    view.interactor.addObserver(this, plx.EV_DATASET_LOADED);
};

gui.SliceController.prototype._setup_slider = function(){

    var init_slice = this.view.dataset.options.start;
    var step_slice = this.view.dataset.options.step;
    var end_slice  = this.view.dataset.options.end;

    if (this.slider.noUiSlider){
        this.slider.noUiSlider.destroy();
    }

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
        var index = parseInt(values[handle]);
        message('slice: ' +index);
        VIEW.showSliceByIndex(index);
    });
};

gui.SliceController.prototype.processNotification = function (kind, data) {
    if (kind == plx.EV_SLICE_CHANGED) {
        this.slider.noUiSlider.set(data.slice);
    }
    else if (kind == plx.EV_DATASET_LOADED){
        this._setup_slider();
    }
};

