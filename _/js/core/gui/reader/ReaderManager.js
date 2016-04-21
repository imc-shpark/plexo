/**
 * Created by dcantor on 18/04/16.
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
 * Contains static methods to invoke an appropriate reader depending on the type
 * of the requested file. This class is a singleton).
 * @see http://robdodson.me/javascript-design-patterns-singleton/
 * @constructor
 */
gui.reader.ReaderManager = (

    function(){

        var instance;

        function init(){
            var dictionary = {}

            return {
                register: function(type, object){
                    if (dictionary[type]){
                        console.warn('There is already a reader for file type '+type +'. It will be replaced ' +
                            'with the new entry');
                    }
                    dictionary[type] = object;

                },

                getReader: function(type){
                    if (dictionary[type] == undefined){
                        console.warn('A reader for file type '+type+' has not been assigned.')
                    }
                    return dictionary[type];
                }
            }
        }


        return {
            getInstance: function(){
                if (!instance){
                    instance = init();
                }
                return instance;
            }
        };
})();

