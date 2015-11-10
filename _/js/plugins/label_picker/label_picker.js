/*
 * Very simple jQuery Color Picker
 * https://github.com/tkrotoff/jquery-labelpicker
 *
 * Copyright (C) 2012-2013 Tanguy Krotoff <tkrotoff@gmail.com>
 *
 * Licensed under the MIT license
 */

(function($) {
  'use strict';

  /**
   * Constructor.
   */
  var LabelPicker = function(select, options) {
    this.init('labelpicker', select, options);
  };

  /**
   * LabelPicker class.
   */
  LabelPicker.prototype = {
    constructor: LabelPicker,

    init: function(type, select, options) {
      var self = this;

      self.type = type;

      self.$select = $(select);
      self.$select.hide();

      self.options = $.extend({}, $.fn.labelpicker.defaults, options);

      self.$colorList = null;

      if (self.options.picker === true) {
        var selectText = self.$select.find('> option:selected').text();
        self.$icon = $('<span class="labelpicker icon"'
                     + ' title="' + selectText + '"'
                     + ' style="background-color: ' + self.$select.val() + ';"'
                     + ' role="button" tabindex="0">'
                     + '</span>').insertAfter(self.$select);
        self.$icon.on('click.' + self.type, $.proxy(self.showPicker, self));

        self.$picker = $('<span class="labelpicker picker ' + self.options.theme + '"></span>').appendTo(document.body);
        self.$colorList = self.$picker;

        // Hide picker when clicking outside
        $(document).on('mousedown.' + self.type, $.proxy(self.hidePicker, self));
        self.$picker.on('mousedown.' + self.type, $.proxy(self.mousedown, self));
      } else {
        self.$inline = $('<span class="labelpicker inline ' + self.options.theme + '"></span>').insertAfter(self.$select);
        self.$colorList = self.$inline;
      }

      // Build the list of colors
      // <span class="color selected" title="Green" style="background-color: #7bd148;" role="button"></span>
      self.$select.find('> option').each(function() {
        var $option = $(this);
        var color = $option.val();


        var isSelected = $option.is(':selected');

          if (self.options.noselected){
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

        }else {

            $colorSpan = $('<div class="block"><span class="color"'
                + title
                + ' style="background-color: ' + color + ';"'
                + ' data-color="' + color + '"'
                + selected
                + disabled
                + role + '>'
                + '</span>'
                + '<span class="label">'+$option.text()+'</span></div>');
        }
        self.$colorList.append($colorSpan);
        $colorSpan.on('click.' + self.type, $.proxy(self.labelClicked, self));

        var $next = $option.next();
        if ($next.is('optgroup') === true) {
          // Vertical break, like hr
          self.$colorList.append('<span class="vr"></span>');
        }
      });
    },

    /**
     * Changes the selected color.
     *
     * @param color the hexadecimal color to select, ex: '#fbd75b'
     */
    selectColor: function(color) {
      var self = this;

      var $colorSpan = self.$colorList.find('> span.color').filter(function() {
        return $(this).data('color').toLowerCase() === color.toLowerCase();
      });

      if ($colorSpan.length > 0) {
        self.selectLabel($colorSpan);
      } else {
        console.error("The given color '" + color + "' could not be found");
      }
    },

    showPicker: function() {
      var pos = this.$icon.offset();
      this.$picker.css({
        // Remove some pixels to align the picker icon with the icons inside the dropdown
        left: pos.left - 6,
        top: pos.top + this.$icon.outerHeight()
      });

      this.$picker.show(this.options.pickerDelay);
    },

    hidePicker: function() {
      this.$picker.hide(this.options.pickerDelay);
    },

    /**
     * Selects the given span inside $colorList.
     *
     * The given span becomes the selected one.
     * It also changes the HTML select value, this will emit the 'change' event.
     */
    selectLabel: function($colorSpan) {
      var color = $colorSpan.data('color');
      var title = $colorSpan.prop('title');

      // Mark this span as the selected one
      if (!this.options.multiple) {
          $colorSpan.siblings().removeAttr('data-selected');
          $colorSpan.attr('data-selected', '');
          // Change HTML select value
          this.$select.val(color);
      }
      else{

          var attr = $colorSpan.attr('data-selected');

          //if it has data selected
          if (typeof attr !== typeof undefined && attr !== false){
               $colorSpan.removeAttr('data-selected');
          }
          else { //otherwise
              $colorSpan.attr('data-selected', '');
          }

      }

      if (this.options.picker === true) {
        this.$icon.css('background-color', color);
        this.$icon.prop('title', title);
        this.hidePicker();
      }


    },

    /**
     * The user clicked on a color inside $colorList.
     */
    labelClicked: function(e) {
      // When a color is clicked, make it the new selected one (unless disabled)
      if ($(e.target).is('[data-disabled]') === false) {
        this.selectLabel($(e.target));
        this.$select.trigger('change');
      }
    },

    /**
     * Prevents the mousedown event from "eating" the click event.
     */
    mousedown: function(e) {
      e.stopPropagation();
      e.preventDefault();
    },

    destroy: function() {
      if (this.options.picker === true) {
        this.$icon.off('.' + this.type);
        this.$icon.remove();
        $(document).off('.' + this.type);
      }

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
  $.fn.labelpicker = function(option) {
    var args = $.makeArray(arguments);
    args.shift();

    // For HTML element passed to the plugin
    return this.each(function() {
      var $this = $(this),
        data = $this.data('labelpicker'),
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

    // Show the picker or make it inline
    picker: false,

    // Animation delay in milliseconds
    pickerDelay: 0,

    list: false,

    multiple: false,

    noselected: false
  };

})(jQuery);
