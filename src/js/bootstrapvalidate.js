/**
 * BootstrapValidate (https://github.com/nghuuphuoc/bootstrapvalidate)
 *
 * A jQuery plugin to validate form fields. Use with Bootstrap 3
 *
 * @author      Nguyen Huu Phuoc <phuoc@huuphuoc.me>
 * @copyright   (c) 2013 Nguyen Huu Phuoc
 * @license     MIT
 */

(function($) {
    // Plugin definition
    $.fn.bootstrapValidate = function(options) {
        return this.each(function() {
            var $this = $(this), data = $this.data('bootstrapValidate');
            if (!data) {
                $this.data('bootstrapValidate', (data = new $.bootstrapValidator(this, options)));
            }
        });
    };

    $.bootstrapValidator = function(form, options) {
        this.$form   = $(form);
        this.options = $.extend({}, $.bootstrapValidator.DEFAULT_OPTIONS, options);
        this.validate();
        this.xhrRequests = {};
        this.numPendingRequests = 0;
    };
    $.extend($.bootstrapValidator, {
        /**
         * The default options
         */
        DEFAULT_OPTIONS: {
            // Default invalid message
            message: 'This value is not valid',

            // Map the field name with validator rules
            fields: null,

            // CSS class of icons indicating that the field value is valid or not
            iconClass: {
                valid: 'icon-ok',
                invalid: 'icon-remove'
            }
        },

        // Available validators
        validator: {},

        prototype: {
            /**
             * Retrieve the form element
             * @returns {jQuery}
             */
            getForm: function() {
                return this.$form;
            },

            /**
             * Validate form
             */
            validate: function() {
                if (this.options.fields == null) {
                    return;
                }
                for (var field in this.options.fields) {
                    this.validateField(field);
                }
            },

            validateField: function(field) {
                if (this.options.fields[field] == null || this.options.fields[field].validator == null) {
                    return;
                }
                var foundFields = this.$form.find('[name="' + field + '"]');
                if (foundFields.length == 0) {
                    // Return if cannot find the field with given name
                    return;
                }

                var that         = this,
                    fieldElement = $(foundFields[0]),
                    type         = $(fieldElement).attr('type'),
                    event        = ('checkbox' == type || 'radio' == type) ? 'change' : 'keyup';

                $(fieldElement)
                    .on(event, function() {
                        var validators = that.options.fields[field].validator;
                        for (var validatorName in validators) {
                            if (!$.bootstrapValidator.validator[validatorName]) {
                                continue;
                            }
                            var isValid = $.bootstrapValidator.validator[validatorName].validate(that, fieldElement, validators[validatorName]);
                            if (isValid == false) {
                                that.showError(fieldElement, validatorName);
                                break;
                            } else if (isValid == true) {
                                that.removeError(fieldElement);
                            }
                        }
                    })
                    .blur(function() {
                        that.hideError(fieldElement);
                    });
            },

            showError: function(fieldElement, validatorName) {
                var $fieldElement = $(fieldElement),
                    field         = $fieldElement.attr('name'),
                    validator     = this.options.fields[field].validator[validatorName],
                    message       = validator.message || this.options.message;

                if (!$fieldElement.data('bootstrapValidator.tooltip')) {
                    var $a = $('<a/>').attr('href', '#')
                                      .attr('title', message)
                                      // Bootstrap tooltip options
                                      // see http://getbootstrap.com/javascript/#tooltips
                                      .attr('data-toggle', 'tooltip').attr('data-placement', 'right')
                                      .css('text-decoration', 'none')
                                      .css('position', 'absolute')
                                      .insertAfter(fieldElement);
                    $('<i/>').addClass(this.options.iconClass.invalid).appendTo($a);
                    $fieldElement.data('bootstrapValidator.tooltip', $a);

                    $a.on('shown.bs.tooltip', function() {
                        if (!$(this).data('bootstrapValidator.tooltip.calculated')) {
                            $(this).data('bootstrapValidator.tooltip.calculated', true);
                            var $parent   = $(this).parent(),
                                $tip      = $(this).data('bs.tooltip').$tip,
                                w         = $parent.width(),
                                h         = $parent.height(),
                                tipWidth  = parseInt($tip.width()),
                                tipHeight = parseInt($tip.height()),
                                tipLeft   = parseInt($tip.css('left')),
                                tipTop    = parseInt($tip.css('top'));
                            $tip.css('left', tipLeft + w + 10)
                                .css('top', tipTop - h + 5)
                                .width(tipWidth);
                            $(this).css('position', 'absolute')
                                   .css('left', tipLeft - $(this).width() + w + 5)
                                   .css('top', tipTop + tipHeight / 2 - $(this).height() / 2 - h + 5);
                        }
                    });
                }

                // Add has-error class to parent element
                $fieldElement.parents('.form-group').removeClass('has-success').addClass('has-error');

                var $tip = $fieldElement.data('bootstrapValidator.tooltip');
                $tip.find('i').attr('class', this.options.iconClass.invalid).end()
                    .attr('title', message)
                    .attr('data-original-title', message)
                    .tooltip('show');
            },

            hideError: function(fieldElement) {
                if (tip = $(fieldElement).data('bootstrapValidator.tooltip')) {
                    $(tip).tooltip('hide');
                }
            },

            removeError: function(fieldElement) {
                var $fieldElement = $(fieldElement);
                $fieldElement.parents('.form-group').removeClass('has-error').addClass('has-success');
                if (tip = $fieldElement.data('bootstrapValidator.tooltip')) {
                    $(tip).find('i').attr('class', this.options.iconClass.valid);
                    $(tip).tooltip('destroy');

                    $(tip).remove();
                    $fieldElement.removeData('bootstrapValidator.tooltip');
                }
            },

            startRequest: function(fieldElement, validatorName, xhr) {
                var field = $(fieldElement).attr('name');

                this.completeRequest(fieldElement, validatorName);

                if (this.numPendingRequests < 0) {
                    this.numPendingRequests = 0;
                }
                this.numPendingRequests++;
                if (!this.xhrRequests[field]) {
                    this.xhrRequests[field] = {};
                }
                this.xhrRequests[field][validatorName] = xhr;
            },

            completeRequest: function(fieldElement, validatorName) {
                var field = $(fieldElement).attr('name');
                if (!this.xhrRequests[field] || !this.xhrRequests[field][validatorName]) {
                    return;
                }

                var xhr = this.xhrRequests[field][validatorName];
                this.numPendingRequests--;
                console.log('---abort---');
                xhr.abort();
                delete this.xhrRequests[field][validatorName];
            }
        }
    });
}(window.jQuery));
