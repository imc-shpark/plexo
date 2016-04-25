/**
 * Created by dcantor on 14/04/16.
 */
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

/**
 * A reader parses a file and creates a dataset
 * @constructor
 */
gui.reader.MetaImageReader = function(){
    this.header          = {};
    this.images          = [];
    this.headerSize      = 0;
    this.sliceSize       = 0;
    this.numSlices       = 0;
    this.headerProcessed = false;
    this.validationError = false;
    this.loaded          = 0;
    gui.reader.ReaderManager.getInstance().register('mha', this);
};


/**
 * Useful every time we have to read
 */
gui.reader.MetaImageReader.prototype.resetFlags = function(){
    this.header          = {};
    this.images          = [];
    this.headerSize      = 0;
    this.sliceSize       = 0;
    this.numSlices       = 0;
    this.loaded          = 0;
    this.headerProcessed = false;
    this.validationError = false;
};


/**
 * Used to check assertions during the reading process
 * @param assertion
 * @param message
 */
gui.reader.MetaImageReader.prototype.check = function(assertion, message){
    if (!assertion){
        console.error('MetaImageReader:' + message);
        alert('MetaImageReader:' + message);
        this.validationError = true;
    }
};

/**
 * Process a chunk of text and determines if it is a complete header. If so,
 * updates the flags headerRead and lastHeaderIndex.
 * @param text
 * @returns a dictionary containing the header information {*}
 * @private
 */
gui.reader.MetaImageReader.prototype.processHeader = function(text){

    this.headerSize      = 0;
    this.headerProcessed = false;

    var header = {};
    var list = text.split('\n'); //returns the lines
    var NLINES  = list.length; //property access is expensive in for loops. Catching it here to speed up.
    var hbytes = 0;

    for (var i = 0; i<NLINES; i += 1){
        var line = list[i];

        var elements = line.split('=');

        if (elements.length==2){
            var key = elements[0].trim();
            var value = elements[1].trim();

            if (key.indexOf('Seq_Frame') == -1) { //ignore all of the Seq_Frame, save memory.
                header[key] = value;
            }

            hbytes = hbytes + (line.length) + 1; //the plus one is because we count the \n as one character too
        }
        else{
            this.headerSize =  hbytes;
            break;
        }
    }

    this.headerProcessed = !(this.headerSize == 0);

    return header;
};

/**
 * Reads the header and passes it to a callback method for further processing. The async callback
 * is necessary as IO is time consuming.
 *
 * @param file_object
 * @param header_size
 * @param callback
 */
gui.reader.MetaImageReader.prototype.readHeader = function(file_object, header_size, callback){

    var header = {};
    var self = this;

    var slice = file_object.slice(0,header_size); //read the first header_size bytes
                                                  // see if  this covers the whole header
    var freader = new FileReader();

    freader.onloadend = function(){
        var header = self.processHeader(freader.result);
        if (self.headerProcessed){
            callback(header);

        }
        else{
            console.error('the header is TOO BIG');
        }
    };

    freader.readAsText(slice);
};

/**
 * Performs sanity checks on the header information
 * @param header
 */
gui.reader.MetaImageReader.prototype.validateHeader = function(header){


    this.check(header['ObjectType'] == 'Image', 'The mha file does not contain an image');
    this.check(header['NDims'] == '3', 'The mha file is not a valid volume');
    this.check(header['ElementType'] == 'MET_UCHAR', 'The element type is not valid:'+header['ElementType']);

    if (this.validationError){ //any check can change this flag
        console.error('There have been validation errors in the header. stopping');
        gui.f.mouseWait(false);
        throw 'There have been validation errors in the header. stopping';
    }

    this.header = header; //keep a copy after validation
};

/**
 * Reads a chunk of data from the file and generates the respective images
 * @param file_object
 * @param init
 * @param end
 */
gui.reader.MetaImageReader.prototype.readData = function(file_object,init, end){

    var self = this;
    var SIZE = file_object.size;

    var chunk_size  = end-init;
    var num_slices = chunk_size / this.sliceSize;
    var num_slices_error = (num_slices !== parseInt(num_slices, 10)); //the chunk must have an integer number of slices

    if (num_slices_error){
        gui.f.mouseWait(false);
        console.error('MetaImageReader error reading data. chunk contains incomplete slices');
        throw 'MetaImageReader error reading data. chunk contains incomplete slices';
    }

    //now calculate the indices to see where the resulting images will be allocated
    var index_init = (init - this.headerSize) / this.sliceSize;
    var index_end = ((end-this.headerSize)/ this.sliceSize)-1;

    console.debug('Reading [',init,',',end,'] = ', num_slices, ' slices,  from ',index_init, ' to ', index_end);


    var slice = file_object.slice(init,end);

    var freader = new FileReader();

    freader.onloadend = function(){
        images = self.createImages(freader.result);
        var N = images.length;
        for (var i = 0; i<N; i+=1){
            self.images[index_init+i] = images[i];
        }
        self.loaded = self.loaded + N;
    };
    freader.readAsBinaryString(slice);
};

/**
 * Creates images from a chunk of data
 * @param data
 */
gui.reader.MetaImageReader.prototype.createImages = function(data){

    var self = this;
    var image_list = [];
    var dim1 = this.dim1;
    var dim2 = this.dim2;

    var canvas = document.createElement('canvas');
    canvas.width = dim1;
    canvas.height =dim2;
    var ctx = canvas.getContext('2d');

    var SLICE_SIZE = self.sliceSize;
    var NUM_SLICES = data.length / SLICE_SIZE;


    console.log('Creating ',NUM_SLICES, ' images');

    for (var k=0;k<NUM_SLICES;k+=1) { //for each slice
        var image   = data.slice(SLICE_SIZE * k, SLICE_SIZE * k + SLICE_SIZE);
        var im_data = ctx.createImageData(dim1, dim2);
        var buffer  = im_data.data;
        var index   = 0;

        for (var i = 0; i < dim1; i += 1) {
            for (var j = 0; j < dim2; j += 1) {
                var v             = image.charCodeAt(i * dim2 + j);
                buffer[index]     = v;
                buffer[index + 1] = v;
                buffer[index + 2] = v;
                buffer[index + 3] = 255;
                index             = index + 4;
            }
        }
        ctx.putImageData(im_data, 0, 0);
        var file_url   = canvas.toDataURL('image/png');
        var html_image = new Image();
        html_image.src = file_url;
        image_list.push(html_image);
    }

    return image_list;
};

/**
 * read the file object and creates an ordered list of HTML images
 * corresponding to the series  defined in the mha file.
 * @param file_object The file we are reading from
 * @param callback_function the function that will receive the list of HTML images once we are done
 *
 */
gui.reader.MetaImageReader.prototype.read = function(file_object, callback_function) {

    this.resetFlags(); // start a new reading
    gui.f.mouseWait(true);

    var image_list = [];
    var header     = {};
    var freader    = new FileReader();
    var self       = this;

    var SIZE = file_object.size;
    var sizeInMB = (SIZE / 1000000).toFixed(2);
    console.debug();
    console.debug('---------------------------------------------------------')
    console.debug('Reading ' + file_object.name, ' size = ', sizeInMB + ' MB');
    console.debug('---------------------------------------------------------')

    if (sizeInMB > 100) {
        console.debug('This is a huge file');
    }

    var ESTIMATED_HSIZE = Math.round(SIZE / 20);

    console.debug('Estimated header size ', ESTIMATED_HSIZE, 'bytes');

    this.readHeader(file_object, ESTIMATED_HSIZE, function (h) {

        self.validateHeader(h);

        var dims  = h['DimSize'].replace(/ +/g,' ').split(' '); //the regexp takes care of extra spaces

        self.dim1 = parseInt(dims[0]);
        self.dim2 = parseInt(dims[1]);
        self.dim3 = parseInt(dims[2]);
        self.sliceSize = self.dim1*self.dim2;
        self.numSlices  = self.dim3;
        self.images = new Array(self.numSlices);
        self.loaded = 0;


        var slices_per_chunk = 30;
        var slice_size = self.sliceSize; //copy only for loop performance
        var chunk_size = slices_per_chunk * slice_size;
        var file_size = file_object.size;
        var init = self.headerSize;
        var end  = init + chunk_size;
        var num_chunks = parseInt((file_size-self.headerSize)/chunk_size);
        var residual = (file_size-self.headerSize) % chunk_size;


        console.debug('File size        = ', file_size);
        console.debug('Header size      = ', self.headerSize);
        console.debug('Slice size       = ', self.sliceSize);
        console.debug('Number of slices = ', self.numSlices);
        console.debug('Slices per chunk = ', slices_per_chunk);
        console.debug('Number of chunks = ', num_chunks);
        console.debug('Leftover         = ', (residual>0));
        console.debug('---------------------------------------------------------')


        for (var k = 0; k < num_chunks; k+=1){
            console.debug('k = ',k,' init = ', init, ' end = ', end, ' size ', (end-init));
            self.readData(file_object, init, end);
            init = end;
            end = end + chunk_size;

        }
        if (residual > 0){
            end = file_size;
            console.debug('left over. init = ', init, ' end = ', end, ' size ', (end-init), residual);
            self.readData(file_object, init, end);
        }


        function waitforit(){
            var checker = setInterval(function(){
                console.debug('Images loaded ' , self.loaded, ' from ', self.numSlices);

                if (self.loaded == self.numSlices){
                    clearInterval(checker);
                    gui.f.mouseWait(false);
                    console.debug('MetaImage file '+file_object.name, ' DONE');

                    callback_function(self.images);
                }
            },1000);
        };

        waitforit();

    });
};

/*
Create a dummy instance, so it gets registered with ReaderManager.
See the constructor of MetaImageReader for details
*/
gui.reader._meta_image_reader = new gui.reader.MetaImageReader();