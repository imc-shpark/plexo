/*
 * Label Picker
 * By Diego Cantor
 *
 * Forked from https://github.com/tkrotoff/jquery-simplecolorpicker
 * by Tanguy Krotoff (MIT Licence).
 *
 */

(function ($) {
    'use strict';

    /**
     * Constructor.
     */
    var LabelPicker = function (select, options) {
        this.init('labelpicker', select, options);
    };

    /**
     * LabelPicker class.
     */
    LabelPicker.prototype = {
        constructor: LabelPicker,

        init: function (type, select, options) {
            var self = this;

            self.type = type;
            self.$select = $(select);
            self.$select.hide();

            self.options = $.extend({}, $.fn.labelpicker.defaults, options);

            self.$colorList = null;
            self.$inline    = $('<span class="labelpicker inline ' + self.options.theme + '"></span>').insertAfter(self.$select);
            self.$colorList = self.$inline;


            // Build the list of colors
            self.$select.find('> option').each(function () {
                var $option = $(this);
                var color   = $option.val();

                var isSelected = $option.is(':selected');

                if (self.options.noselected) {
                    isSelected = false;
                }

                var isDisabled = $option.is(':disabled');

                var selected = '';
                if (isSelected === true) {
                    selected = ' data-selected';
                }

                var disabled = '';
                if (isDisabled === true) {
                    disabled = ' data-disabled';
                }

                var title = '';
                if (isDisabled === false) {
                    title = ' title="' + $option.text() + '"';
                }

                var role = '';
                if (isDisabled === false) {
                    role = ' role="button" tabindex="0"';
                }

                var $colorSpan = undefined;

                if (!self.options.list) {

                    $colorSpan = $('<span class="color"'
                        + title
                        + ' style="background-color: ' + color + ';"'
                        + ' data-color="' + color + '"'
                        + selected
                        + disabled
                        + role + '>'
                        + '</span>');

                }
                else {

                    $colorSpan = $('<div class="block"><span class="color"'
                        + title
                        + ' style="background-color: ' + color + ';"'
                        + ' data-color="' + color + '"'
                        + selected
                        + disabled
                        + role + '>'
                        + '</span>'
                        + '<span class="label">' + $option.text() + '</span></div>');
                }
                self.$colorList.append($colorSpan);
                $colorSpan.on('click.' + self.type, $.proxy(self.labelClicked, self));

            });
        },

        /**
         * The user clicked on a color inside $colorList.
         */
        labelClicked: function (e) {
            // When a color is clicked, make it the new selected one (unless disabled)
            if ($(e.target).is('[data-disabled]') === false) {
                this.selectLabel($(e.target));
                this.$select.trigger('change');
            }
        },


        /**
         * Selects the given span inside $colorList.
         *
         * The given span becomes the selected one.
         * It also changes the HTML select value, this will emit the 'change' event.
         */
        selectLabel: function ($colorSpan) {

            var self = this;
            var color = $colorSpan.data('color');
            var title = $colorSpan.prop('title');

            // Mark this span as the selected one
            if (!this.options.multiple) {
                $colorSpan.siblings().removeAttr('data-selected');
                $colorSpan.attr('data-selected', '');
            }
            else {

                var attr = $colorSpan.attr('data-selected');

                //if it has data selected
                if (typeof attr !== typeof undefined && attr !== false) {
                    $colorSpan.removeAttr('data-selected');
                }
                else { //otherwise
                    $colorSpan.attr('data-selected', '');
                }

                //remove all selected
                self.$select.children().each(function(){ $(this).removeAttr('selected')});
            }

            //add only those that have data-selected attribute.
            $(self.$colorList[0]).find('[data-selected=""]').each(
                function(){
                    var option = 'option[value="'+$(this).attr('data-color')+'"]';
                    var selector = $('#'+self.$select[0].id +' ' + option);
                    selector.attr('selected',true);
                });
        },

        /**
         * Changes the selected color.
         *
         * @param color the hexadecimal color to select, ex: '#fbd75b'
         */
        selectColor: function (color) {
            var self = this;

            var $colorSpan = self.$colorList.find('> span.color').filter(function () {
                return $(this).data('color').toLowerCase() === color.toLowerCase();
            });

            if ($colorSpan.length > 0) {
                self.selectLabel($colorSpan);
            }
            else {
                console.error("The given color '" + color + "' could not be found");
            }
        },





        /**
         * Prevents the mousedown event from "eating" the click event.
         */
        mousedown: function (e) {
            e.stopPropagation();
            e.preventDefault();
        },

        destroy: function () {

            this.$colorList.off('.' + this.type);
            this.$colorList.remove();

            this.$select.removeData(this.type);
            this.$select.show();
        }
    };

    /**
     * Plugin definition.
     * How to use: $('#id').labelpicker()
     */
    $.fn.labelpicker = function (option) {
        var args = $.makeArray(arguments);
        args.shift();

        // For HTML element passed to the plugin
        return this.each(function () {
            var $this   = $(this),
                data    = $this.data('labelpicker'),
                options = typeof option === 'object' && option;
            if (data === undefined) {
                $this.data('labelpicker', (data = new LabelPicker(this, options)));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    /**
     * Default options.
     */
    $.fn.labelpicker.defaults = {
        // No theme by default
        theme: '',

        // Animation delay in milliseconds
        pickerDelay: 0,

        list: false,

        multiple: false,

        noselected: false
    };



})(jQuery);
