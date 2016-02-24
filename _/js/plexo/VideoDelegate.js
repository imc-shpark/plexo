/**
 * This file is part of PLEXO
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

plx.VideoDelegate = function (slice, file_object) {

    this.slice       = slice;
    this.file_object = file_object;
    this.canvas      = document.getElementById('plexo-video-id');
    this.ctx         = this.canvas.getContext("2d");

};

/**
 * Check if the filename is a video that can be played by the delegate
 * @param filename
 * @returns {boolean}
 */
plx.VideoDelegate.canPlay = function (filename) {
    var extension = filename.split('.').pop().toLowerCase();
    return (extension == 'mp4');
};

/**
 * Creates the DOM video element
 */
plx.VideoDelegate.prototype.load = function () {

    var slice    = this.slice;
    var videoURL = window.URL.createObjectURL(this.file_object);

    var video = document.createElement('video');
    //getElementById('plexo-video-id');
    video.src  = videoURL;
    video.loop = true;

    video.addEventListener("loadedmetadata", function (e) {
        slice.image.width  = this.videoWidth;
        slice.image.height = this.videoHeight;
    }, false);

    var self = this;
    video.addEventListener('play', function () {
        self._video_callback();
    }, false);

    this.video = video;

    this.slice.dataset.view.video_delegate = this; //shortcut
    message('video ready. Use [p] to play/pause')
};

plx.VideoDelegate.prototype.toggle = function () {
    if (this.video.paused) {
        this.video.play();
        message('playing video');
    }
    else {
        this.video.pause();
        message('video paused');
    }
};

plx.VideoDelegate.prototype._video_callback = function () {
    var self = this;
    if (this.video.paused) return;
    this.renderFrame();
    setTimeout(function () {self._video_callback();}, 0);
};

plx.VideoDelegate.prototype.renderFrame = function () {

    this.canvas.width = this.slice.image.width;
    this.canvas.height = this.slice.image.height;

    if (plx.zoom) {
        plx.zoom.apply(this.ctx);
    }
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
};
