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
    var _type = 'mha';
    var readerman = gui.reader.ReaderManager.getInstance();
    readerman.register(_type, this);
};

gui.reader.MetaImageReader.prototype.check = function(assertion, message){
    if (!assertion){
        console.error('MetaImageReader:' + message);
        alert('MetaImageReader:' + message);
    }
};

/**
 * read the file object and creates an ordered list of HTML images
 * corresponding to the series  defined in the mha file.
 * @param file_object The file we are reading from
 * @param callback_function the function that will receive the list of HTML images once we are done
 *
 */
gui.reader.MetaImageReader.prototype.read = function(file_object, callback_function){
    var image_list = [];
    var freader = new FileReader();

    var header = {};
    var self = this;


    freader.onloadend = function(){
        var result = freader.result;
        console.debug('mha file has been loaded');

         //--------------------------------------------------------------------
        //read header
        //--------------------------------------------------------------------
        var list = result.split('\n'); //returns the lines
        var lastIndexOfHeader = 0;
        for (var i= 0; i<list.length;i++){
            var line = list[i];
            var elements = line.split('=');
            if (elements.length==2){
                var key = elements[0].trim();
                var value = elements[1].trim();
                header[key]=value;
            }
            else{
                lastIndexOfHeader =  i - 1;
                break;
            }
        }
        console.debug('mha header data has been parsed');

        //--------------------------------------------------------------------
        //Here we can check things about the header of the mha file.
        //--------------------------------------------------------------------
        self.check(header['ObjectType'] == 'Image', 'The mha file does not contain an image');
        self.check(header['NDims'] == '3', 'The mha file is not a valid volume');
        self.check(header['ElementType'] == 'MET_UCHAR', 'The element type is not valid:'+header['ElementType']);

        //--------------------------------------------------------------------
        //now recover the raw data:
        //--------------------------------------------------------------------
        var raw = list.slice(lastIndexOfHeader+1, list.length).join('\n');
        console.log('looking at raw data');

        var dims = header['DimSize'].split(' ');
        var dim1 = parseInt(dims[0]);
        var dim2 = parseInt(dims[1]);
        var dim3 = parseInt(dims[2]);

        //--------------------------------------------------------------------
        // validate raw data
        //--------------------------------------------------------------------
        self.check(dim1*dim2*dim3 == raw.length, 'The raw data is incomplete or corrupted. Sorry, I can\'t read it.')
        console.log('raw data looks good');
        console.log('dim1 = ',dim1, ' dim2 = ',dim2, ' dim3 = ',dim3);


        //--------------------------------------------------------------------
        // Process row data using an intermediary canvas
        //--------------------------------------------------------------------
        console.log('Processing RAW data...');
        var canvas = document.createElement('canvas');
        canvas.width = dim1;
        canvas.height = dim2;
        var ctx = canvas.getContext('2d');
        console.time('Processing RAW');
        for (var k=0;k<dim3;k+=1){ //for each slice
            var image = raw.slice(dim1*dim2*k, (dim1*dim2*k) + (dim1*dim2));
            var im_data = ctx.createImageData(dim1, dim2);
            var data = im_data.data;
            var index = 0;
            //console.log('Processing image slice ['+(k+1)+' of '+dim3+'] ');
            for (var i=0;i<dim1;i+=1){
                for (var j=0;j<dim2;j+=1){
                    var v = image.charCodeAt(i*dim2+j);
                    data[index] = v;
                    data[index+1] = v;
                    data[index+2] = v;
                    data[index+3] = 255;
                    index = index+4;
            }}
            ctx.putImageData(im_data,0,0);
            var file_url = canvas.toDataURL('image/png');
            //file_url = file_url.substr(file_url.indexOf(',') + 1);
            var html_image = new Image();
            html_image.src = file_url;

            //document.body.appendChild(html_image);
            //console.log('testing image');
            image_list.push(html_image);
        }
        console.timeEnd('Processing RAW');
        callback_function(image_list);
    };
    freader.readAsText(file_object);
};

gui.reader._meta_image_reader = new gui.reader.MetaImageReader();