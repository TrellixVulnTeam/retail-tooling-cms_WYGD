/**
 * Frontwise grid editor plugin.
 */
(function( $ ){

$.fn.gridEditor = function( options ) {
    var self = this;
    var grideditor = self.data('grideditor');
    var elementCount = 0;

    /** Methods **/

    if (arguments[0] == 'getHtml') {
        if (grideditor) {
            grideditor.deinit();
            var html = self.html();
            grideditor.init();
            return html;
        } else {
            return self.html();
        }
    } else if (arguments[0] == 'deinit') {
      if (grideditor) {
          grideditor.deinit();
          $('.ge-mainControls').remove();
          $('.ge-html-output').remove();
          return;
      }
    }

    /** Initialize plugin */

    self.each(function(baseIndex, baseElem) {
        baseElem = $(baseElem);

        var settings = $.extend({
            'new_row_layouts'   : [ // Column layouts for add row buttons
                                    [12],
                                    [6, 6],
                                    [4, 4, 4],
                                    [3, 3, 3, 3],
                                    [2, 2, 2, 2, 2, 2],
                                    [2, 8, 2],
                                    [4, 8],
                                    [8, 4]
                                ],
            'row_classes'       : [{ label: 'Example class', cssClass: 'example-class'}],
            'col_classes'       : [{ label: 'Example class', cssClass: 'example-class'}],
            'col_tools'         : [], /* Example:
                                        [ {
                                            title: 'Set background image',
                                            iconClass: 'glyphicon-picture',
                                            on: { click: function() {} }
                                        } ]
                                    */
            'row_tools'         : [],
            'custom_filter'     : '',
            'editor_types'      : ['tinymce'],
            'valid_col_sizes'   : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            'source_textarea'   : '',
            'content_types'     : [{id: "text", label: "Tekst"}, {id: "rich-text", label: "Opgemaakte tekst"}, {id: "list", label: "Lijst"}, {id: "quote", label: "Annotatie"}, {id: "image", label: "Afbeelding"}, {id: "image-list", label: "Meerdere afbeeldingen"}, {id: "warning", label: "Waarschuwing"}],
            'default_content_type_id'     : "text"
        }, options);


        // Elems
        var canvas,
            mainControls,
            addRowGroup,
            htmlTextArea
        ;
        var colClasses = ['col-md-', 'col-sm-', 'col-xs-'];
        var curColClassIndex = 0; // Index of the column class we are manipulating currently
        var MAX_COL_SIZE = 12;

        // Copy html to sourceElement if a source textarea is given
        if (settings.source_textarea) {
            var sourceEl = $(settings.source_textarea);

            sourceEl.addClass('ge-html-output');
            htmlTextArea = sourceEl;

            if (sourceEl.val()) {
                baseElem.html(sourceEl.val());
            }
        }

        // Wrap content if it is non-bootstrap
        if (baseElem.children().length && !baseElem.find('div.row').length) {
            var children = baseElem.children();
            var newRow = $('<div class="row"><div class="col-md-12"/></div>').appendTo(baseElem);
            newRow.find('.col-md-12').append(children);
        }

        setup();
        init();

        function setup() {
            /* Setup canvas */
            canvas = baseElem.addClass('ge-canvas');

            if (typeof htmlTextArea === 'undefined' || !htmlTextArea.length) {
                htmlTextArea = $('<textarea class="ge-html-output"/>').insertBefore(canvas);
            }

            /* Create main controls*/
            mainControls = $('<div class="ge-mainControls" />').insertBefore(htmlTextArea);
            var wrapper = $('<div class="ge-wrapper ge-top" />').appendTo(mainControls);

            var previewControlsWrapper = $('<div id="preview-controls" class="form-inline"></div>').appendTo(wrapper);
            var previewWrapper = $('<div class="form-group"></div>').appendTo(previewControlsWrapper);

            // Layout dropdown
            var layoutDropdown = $('<div class="dropdown ge-layout-mode">' +
                '<label for="layout-type-select">Preview size: </label>' +
                '<button id="layout-type-select" type="button" class="btn btn-md btn-secondary dropdown-toggle" data-toggle="dropdown"><span>Desktop</span></button>' +
                '<ul class="dropdown-menu" role="menu">' +
                    '<li><a data-width="auto" title="Desktop"><span>Desktop</span></a></li>' +
                    '<li><a title="Tablet"><span>Tablet</span></li>' +
                    '<li><a title="Phone"><span>Phone</span></a></li>' +
                    '</ul>' +
                '</div>')
                .on('click', 'a', function() {
                    var a = $(this);
                    switchLayout(a.closest('li').index());
                    var btn = layoutDropdown.find('button');
                    btn.find('span').remove();
                    btn.append(a.find('span').clone());
                })
                .appendTo(previewWrapper)
            ;
            // Content dropdown
            var contentDropdown = $('<div id="preview-content" class="dropdown ge-content-mode">' +
                '<label for="preview-content-select">Preview content: </label>' +
                '<button id="preview-content-select" type="button" class="btn btn-md btn-secondary dropdown-toggle" data-toggle="dropdown"><span>George Orwell - 1984</span></button>' +
                  '<ul class="dropdown-menu" role="menu">' +
                  '</ul>' +
                '</div>')
                .on('click', 'a', function() {
                    var a = $(this);
                    var btn = contentDropdown.find('button');
                    btn.find('span').remove();
                    btn.append(a.find('span').clone());
                })
                .appendTo(previewWrapper)
            ;

            // Add row
            addRowGroup = $('<div class="ge-addRowGroup btn-group" />').appendTo(wrapper);
            $.each(settings.new_row_layouts, function(j, layout) {
                var btn = $('<a class="btn btn-md btn-primary" />')
                    .attr('title', 'Add row ' + layout.title)
                    .on('click', function() {
                        var row = createRow(layout.title).appendTo(canvas);
                        layout.cols.forEach(function(col) {
                            createColumn(col.count, col.type).appendTo(row);
                        });
                        init();
                    })
                    .appendTo(addRowGroup)
                ;

                btn.append('<span class="glyphicon glyphicon-plus-sign"/>');

                var layoutName = layout.title;
                var icon = '<div class="row ge-row-icon">';
                if (layout.cols) {
                  layout.cols.forEach(function(i) {
                      icon += '<div class="column col-xs-' + i + '"/>';
                  });
                }
                icon += '</div>';
                // btn.append(icon);
                btn.append(layoutName);
            });

            var btnGroup = $('<div class="btn-group pull-right"/>')
                .appendTo(wrapper)
            ;
            var htmlButton = $('<button title="Edit Source Code" type="button" class="btn btn-md btn-primary gm-edit-mode"><span class="glyphicon glyphicon-chevron-left"></span><span class="glyphicon glyphicon-chevron-right"></span></button>')
                .on('click', function() {
                    if (htmlButton.hasClass('active')) {
                        canvas.empty().html(htmlTextArea.val()).show();
                        init();
                        htmlTextArea.hide();
                    } else {
                        deinit();
                        htmlTextArea
                            .height(0.8 * $(window).height())
                            .val(canvas.html())
                            .show()
                        ;
                        canvas.hide();
                    }

                    htmlButton.toggleClass('active btn-danger');
                })
                // .appendTo(btnGroup)
            ;
            var previewButton = $('<button title="Preview" type="button" class="btn btn-md btn-primary gm-preview"><span class="glyphicon glyphicon-eye-open"></span></button>')
                .on('mouseenter', function() {
                    canvas.removeClass('ge-editing');
                })
                .on('click', function() {
                    previewButton.toggleClass('active btn-danger').trigger('mouseleave');
                })
                .on('mouseleave', function() {
                    if (!previewButton.hasClass('active')) {
                        canvas.addClass('ge-editing');
                    }
                })
                // .appendTo(btnGroup)
            ;
            // var loadContentButton = $('<button title="Load content" type="button" id="gm-load-content" class="btn btn-md btn-primary gm-export"><span class="glyphicon glyphicon-download"></span></button>')
            //     .appendTo(btnGroup)
            // ;
            // var saveAllButton = $('<button title="Save all" type="button" id="gm-save-all" class="btn btn-md btn-primary gm-export"><span class="glyphicon glyphicon-file-export"></span></button>')
            //     .appendTo(btnGroup)
            // ;
            // var saveContentButton = $('<button title="Save content" type="button" id="gm-save-content" class="btn btn-md btn-primary gm-export"><span class="glyphicon glyphicon-file"></span></button>')
            //     .appendTo(btnGroup)
            // ;
            // var saveTemplateButton = $('<button title="Save template" type="button" id="gm-save-template" class="btn btn-md btn-primary gm-export"><span class="glyphicon glyphicon-save"></span></button>')
            //     .appendTo(btnGroup)
            // ;
            // var resetTemplateButton = $('<button title="Reset template" type="button" id="gm-reset-template" class="btn btn-primary gm-export">Reset template</button>')
            //     .appendTo(btnGroup)
            // ;
            // var saveTemplateButton = $('<button title="Save template" type="button" id="gm-save-template" class="btn btn-primary gm-export">Save template</button>')
            //     .appendTo(btnGroup)
            // ;

            // // Make controls fixed on scroll
            // var $window = $(window);
            // $window.on('scroll', function(e) {
            //     if (
            //         $window.scrollTop() > mainControls.offset().top &&
            //         $window.scrollTop() < canvas.offset().top + canvas.height()
            //     ) {
            //         if (wrapper.hasClass('ge-top')) {
            //             wrapper
            //                 .css({
            //                     left: wrapper.offset().left,
            //                     width: wrapper.outerWidth(),
            //                 })
            //                 .removeClass('ge-top')
            //                 .addClass('ge-fixed')
            //             ;
            //         }
            //     } else {
            //         if (wrapper.hasClass('ge-fixed')) {
            //             wrapper
            //                 .css({ left: '', width: '' })
            //                 .removeClass('ge-fixed')
            //                 .addClass('ge-top')
            //             ;
            //         }
            //     }
            // });

            /* Init RTE on click */
            // canvas.on('click', '.ge-content', function(e) {
            //     var rte = getRTE($(this).data('ge-content-type'));
            //     if (rte) {
            //         rte.init(settings, $(this));
            //     }
            // });

            /* ----------- Show/hide drawer ----------- */
            canvas.on('mouseenter', '.row > .ge-tools-drawer', function(e) {
                $(this).parent().find('> .ge-tools-drawer a').show();
                // $(this).parent().find('.content-type').show();
            });

            canvas.on('mouseleave', '.row > .ge-tools-drawer', function(e) {
              $(this).parent().find('> .ge-tools-drawer a').hide();
              $(this).parent().find('.content-type').hide();
              $(this).parent().find('.ge-details').hide();
            });

            canvas.on('mouseenter', '.column', function(e) {
                $(this).find('> .ge-tools-drawer > a').show();
                $(this).find('.content-type').show();
            });

            canvas.on('mouseleave', '.column', function(e) {
              $(this).find('> .ge-tools-drawer > a').hide();
              $(this).find('.content-type').hide();
              $(this).find('.ge-details').hide();
            });

            // canvas.on('mouseenter', '.ge-content', function(e) {
            //     $(this).parent().find('> .ge-tools-drawer a').show();
            // });
            //
            // canvas.on('mouseleave', '.ge-content', function(e) {
            //   var element = $(this).parent();
            //   if (element.hasClass("column")) element.find('> .ge-tools-drawer').hide();
            //   $(this).parent().find('.ge-details').hide();
            // });
            //
            // canvas.on('mouseenter', '.column > .ge-tools-drawer', function(e) {
            //     $(this).show();
            // });
            //
            // canvas.on('mouseleave', '.column > .ge-tools-drawer', function(e) {
            //   $(this).hide();
            //   $(this).parent().find('.ge-details').hide();
            // });
        }

        function reset() {
            deinit();
            init();
        }

        function init() {
            runFilter(true);
            canvas.addClass('ge-editing');
            addAllColClasses();
            wrapContent();
            createRowControls();
            createColControls();
            makeSortable();
            addListeners();
            switchLayout(curColClassIndex);
        }

        function deinit() {
            canvas.removeClass('ge-editing');
            var contents = canvas.find('.ge-content').each(function() {
                var content = $(this);
                getRTE(content.data('ge-content-type')).deinit(settings, content);
            });
            canvas.find('.ge-tools-drawer').remove();
            removeSortable();
            removeTitles();
            runFilter();
        }

        function createRowControls() {
            canvas.find('.row').each(function() {
                var row = $(this);
                if (row.find('> .ge-tools-drawer').length) { return; }

                var title = row.attr('data-title') ? row.attr('data-title') : "No title";
                var rowTitle = $('<div class="ge-element-title" contenteditable="true">' + title + '</div>').prependTo(row);
                var drawer = $('<div class="ge-tools-drawer" />').prependTo(row);

                var details = createDetails(row, settings.row_classes).appendTo(drawer);
                details.hide()

                createTool(drawer, 'Move', 'ge-move', 'glyphicon-move', null, true);

                // createTool(drawer, 'Settings', 'settings', 'glyphicon-cog', function() {
                //     details.toggle();
                // }, true);

                settings.row_tools.forEach(function(t) {
                    createTool(drawer, t.title || '', t.className || '', t.iconClass || 'glyphicon-wrench', t.on, null, true);
                });
                createTool(drawer, 'Remove row', '', 'glyphicon-trash', function() {
                    // if (window.confirm('Delete row?')) {
                        row.slideUp(function() {
                            row.remove();
                        });
                    // }
                }, true);
                createTool(drawer, 'Add column', 'ge-add-column', 'glyphicon-plus-sign', function() {
                    row.append(createColumn(12));
                    init();
                }, true);
            });

            $(".row .ge-element-title").change(function() {
              $(this).parent().attr("data-id", slugify($(this).text()));
              $(this).parent().attr("data-title", $(this).text());
            })
        }

        function createColControls() {
            elementCount = 0;
            canvas.find('.column').each(function() {
                elementCount++
                var col = $(this);
                if (col.find('> .ge-tools-drawer').length) { return; }

                var title = col.attr('data-title') ? col.attr('data-title') : "No title";
                var rowTitle = $('<div class="ge-element-title" contenteditable="true">' + title + '</div>').prependTo(col);
                var contentType = col.attr('data-type') ? col.attr('data-type') : "";
                var drawer = $('<div class="ge-tools-drawer" />').prependTo(col);
                var contentTypeSelect = $('<select class="content-type btn btn-xs btn-secondary dropdown-toggle"></select>').prependTo(drawer);
                settings.content_types.forEach(function(type) {
                  var option = contentTypeSelect.append($("<option></option>")
                              .attr("value", type.id)
                              .text(type.label)
                            );
                  if (contentType==type.id) contentTypeSelect.val(contentType);
                });
                contentTypeSelect.hide();
                // drawer.hide();

                var details = createDetails(col, settings.col_classes).appendTo(drawer);

                createTool(drawer, 'Move', 'ge-move', 'glyphicon-move', null, true);

                createTool(drawer, 'Make column narrower\n(hold shift for min)', 'ge-decrease-col-width', 'glyphicon-minus', function(e) {
                    var colSizes = settings.valid_col_sizes;
                    var curColClass = colClasses[curColClassIndex];
                    var curColSizeIndex = colSizes.indexOf(getColSize(col, curColClass));
                    var newSize = colSizes[clamp(curColSizeIndex - 1, 0, colSizes.length - 1)];
                    if (e.shiftKey) {
                        newSize = colSizes[0];
                    }
                    setColSize(col, curColClass, Math.max(newSize, 1));
                }, true);

                createTool(drawer, 'Make column wider\n(hold shift for max)', 'ge-increase-col-width', 'glyphicon-plus', function(e) {
                    var colSizes = settings.valid_col_sizes;
                    var curColClass = colClasses[curColClassIndex];
                    var curColSizeIndex = colSizes.indexOf(getColSize(col, curColClass));
                    var newColSizeIndex = clamp(curColSizeIndex + 1, 0, colSizes.length - 1);
                    var newSize = colSizes[newColSizeIndex];
                    if (e.shiftKey) {
                        newSize = colSizes[colSizes.length - 1];
                    }
                    setColSize(col, curColClass, Math.min(newSize, MAX_COL_SIZE));
                }, true);

                // createTool(drawer, 'Settings', 'settings', 'glyphicon-cog', function() {
                //     details.toggle();
                // }, true);
                //
                settings.col_tools.forEach(function(t) {
                    createTool(drawer, t.title || '', t.className || '', t.iconClass || 'glyphicon-wrench', t.on, true);
                });

                createTool(drawer, 'Remove col', '', 'glyphicon-trash', function() {
                    // if (window.confirm('Delete column?')) {
                        col.animate({
                            opacity: 'hide',
                            width: 'hide',
                            height: 'hide'
                        }, 400, function() {
                            col.remove();
                        });
                    // }
                }, true);

                // createTool(drawer, 'Settings', '', 'glyphicon-cog', function() {
                //     details.toggle();
                // }, true);
                //
                // createTool(drawer, 'View col', '', 'glyphicon-eye-open', function() {
                //     $('html, body').animate({
                //         scrollTop: $("#samenvatting-nl").offset().top - 80
                //     }, 1000);
                // });
                //
                // createTool(drawer, 'Add row', 'ge-add-row', 'glyphicon-plus-sign', function() {
                //     var row = createRow();
                //     col.append(row);
                //     row.append(createColumn(6)).append(createColumn(6));
                //     init();
                // });

                details.hide();
            });

            $(".column > .ge-element-title").change(function() {
              $(this).parent().attr("data-id", slugify($(this).text()));
              $(this).parent().attr("data-title", $(this).text());
            })

            $(".column .content-type").change(function() {
              $(this).parent().parent().attr("data-type", $(this).val());
            })
        }

        function createTool(drawer, title, className, iconClass, eventHandlers, isHidden) {
            var tool = $('<a title="' + title + '" class="' + className + '"><span class="glyphicon ' + iconClass + '"></span></a>')
                .appendTo(drawer)
            ;
            if (typeof eventHandlers == 'function') {
                tool.on('click', eventHandlers);
            }
            if (typeof eventHandlers == 'object') {
                $.each(eventHandlers, function(name, func) {
                    tool.on(name, func);
                });
            }

            if (isHidden) tool.hide();
        }

        function createDetails(container, cssClasses) {
            var detailsDiv = $('<div class="ge-details" />');

            // $('<input class="ge-id" />')
            //     .attr('placeholder', 'id')
            //     .val(container.attr('id'))
            //     .attr('title', 'Set a unique identifier')
            //     .appendTo(detailsDiv)
            //     .change(function() {
            //         container.attr('id', this.value);
            //     });

            $('<input class="ge-id" />')
                .attr('placeholder', 'title')
                .val(container.attr('data-title'))
                .attr('data-id', 'no-id')
                .attr('data-title', 'Set a unique title')
                .appendTo(detailsDiv)
                .change(function() {
                    container.attr('data-id', slugify(this.value));
                    container.attr('data-title', this.value);

                    var title = container.find('.ge-element-title').first();
                    if (title) title.text(this.value);
                    container.find('.ge-details').hide();
                });

            var classGroup = $('<div class="btn-group" />').appendTo(detailsDiv);
            cssClasses.forEach(function(rowClass) {
                var btn = $('<a class="btn btn-xs btn-default" />')
                    .html(rowClass.label)
                    .attr('title', rowClass.title ? rowClass.title : 'Toggle "' + rowClass.label + '" styling')
                    .toggleClass('active btn-primary', container.hasClass(rowClass.cssClass))
                    .on('click', function() {
                        btn.toggleClass('active btn-primary');
                        container.toggleClass(rowClass.cssClass, btn.hasClass('active'));
                    })
                    .appendTo(classGroup)
                ;
            });

            return detailsDiv;
        }

        function addAllColClasses() {
            canvas.find('.column, div[class*="col-"]').each(function() {
                var col = $(this);

                var size = 2;
                var sizes = getColSizes(col);
                if (sizes.length) {
                    size = sizes[0].size;
                }

                var elemClass = col.attr('class');
                colClasses.forEach(function(colClass) {
                    if (elemClass.indexOf(colClass) == -1) {
                        col.addClass(colClass + size);
                    }
                });

                col.addClass('column');
            });
        }

        /**
         * Return the column size for colClass, or a size from a different
         * class if it was not found.
         * Returns null if no size whatsoever was found.
         */
        function getColSize(col, colClass) {
            var sizes = getColSizes(col);
            for (var i = 0; i < sizes.length; i++) {
                if (sizes[i].colClass == colClass) {
                    return sizes[i].size;
                }
            }
            if (sizes.length) {
                return sizes[0].size;
            }
            return null;
        }

        function getColSizes(col) {
            var result = [];
            colClasses.forEach(function(colClass) {
                var re = new RegExp(colClass + '(\\d+)', 'i');
                if (re.test(col.attr('class'))) {
                    result.push({
                        colClass: colClass,
                        size: parseInt(re.exec(col.attr('class'))[1])
                    });
                }
            });
            return result;
        }

        function setColSize(col, colClass, size) {
            var re = new RegExp('(' + colClass + '(\\d+))', 'i');
            var reResult = re.exec(col.attr('class'));
            if (reResult && parseInt(reResult[2]) !== size) {
                col.switchClass(reResult[1], colClass + size, 50);
            } else {
                col.addClass(colClass + size);
            }
        }

        function makeSortable() {
            canvas.find('.row').sortable({
                items: '> .column',
                connectWith: '.ge-canvas .row',
                handle: '.ge-tools-drawer .ge-move',
                start: sortStart,
                helper: 'clone',
            });
            canvas.add(canvas.find('.column')).sortable({
                items: '> .row, > .ge-content',
                connectsWith: '.ge-canvas, .ge-canvas .column',
                handle: '.ge-tools-drawer .ge-move',
                start: sortStart,
                helper: 'clone',
            });

            function sortStart(e, ui) {
                ui.placeholder.css({ height: ui.item.outerHeight()});
            }
        }

        function removeSortable() {
            canvas.add(canvas.find('.column')).add(canvas.find('.row')).sortable('destroy');
        }

        function addListeners() {
          $('body').on('focus', '[contenteditable]', function() {
              var $this = $(this);
              $this.data('before', $this.html());
              return $this;
          }).on('blur keyup paste input', '[contenteditable]', function() {
              var $this = $(this);
              if ($this.data('before') !== $this.html()) {
                  $this.data('before', $this.html());
                  $this.trigger('change');
              }
              return $this;
          });
        }
        function removeTitles() {
            canvas.find('.column .ge-element-title').remove();
        }

        function createRow(title) {
            return $('<div class="row" data-id="' + slugify(title) + '" data-title="' + title + '" />')
        }

        function createColumn(size, contentType, title) {
          elementCount++;
          if (title==undefined) title = $.grep(settings.content_types, function(e){ return e.id == settings.default_content_type_id}).label;
          if (contentType==undefined) contentType = settings.default_content_type_id;
          var columnId = contentType + "-" + elementCount;

          return $('<div/>')
              .addClass(colClasses.map(function(c) { return c + size; }).join(' '))
              .addClass('content-' + contentType)
              .attr("id", columnId)
              .attr("data-id", columnId)
              .attr("data-title", title)
              .attr("data-type", contentType)
              .append(createDefaultContentWrapper().html(
                  getRTE(settings.editor_types[0]).initialContent)
              )
          ;
        }

        /**
         * Run custom content filter on init and deinit
         */
        function runFilter(isInit) {
            if (settings.custom_filter.length) {
                $.each(settings.custom_filter, function(key, func) {
                    if (typeof func == 'string') {
                        func = window[func];
                    }

                    func(canvas, isInit);
                });
            }
        }

        /**
         * Wrap column content in <div class="ge-content"> where neccesary
         */
        function wrapContent() {
            canvas.find('.column').each(function() {
                var col = $(this);
                var contents = $();
                col.children().each(function() {
                    var child = $(this);
                    if (child.is('.row, .ge-tools-drawer, .ge-element-title, .ge-content')) {
                        doWrap(contents);
                    } else {
                        contents = contents.add(child);
                    }
                });
                doWrap(contents);
            });
        }
        function doWrap(contents) {
            if (contents.length) {
                var container = createDefaultContentWrapper().insertAfter(contents.last());
                contents.appendTo(container);
                contents = $();
            }
        }

        function createDefaultContentWrapper() {
          return $('<div/>')
              .addClass('ge-content ge-content-type-' + settings.editor_types[0])
              .attr('data-ge-content-type', settings.editor_types[0]);
        }

        function switchLayout(colClassIndex) {
            curColClassIndex = colClassIndex;

            var layoutClasses = ['ge-layout-desktop', 'ge-layout-tablet', 'ge-layout-phone'];
            layoutClasses.forEach(function(cssClass, i) {
                canvas.toggleClass(cssClass, i == colClassIndex);
            });
        }

        function getRTE(type) {
            return $.fn.gridEditor.RTEs[type];
        }

        function clamp(input, min, max) {
            return Math.min(max, Math.max(min, input));
        }

        baseElem.data('grideditor', {
            init: init,
            deinit: deinit,
        });

        function slugify(text) {
          return text.toLowerCase().split(' ').join('-');;
        }

    });

    return self;

};

$.fn.gridEditor.RTEs = {};

})( jQuery );

(function($) {
  saveTemplate = function(templateId, templateTitle, html, templateLink) {
    var template = {title: templateTitle, content: {}, link: templateLink};
    var sectionCount = 0;
    var elementCount = 0;

    $(html).filter('.row').each(function() {
      var row = this;
      var templateElements = {};
      var rowTitle = $(row).attr("data-title") ? $(row).attr("data-title") : "";
      var rowId = $(row).attr("data-id") ? $(row).attr("data-id") : slugify(rowTitle);
      sectionCount++;

      $(row).find('.column').each(function() {
        var col = this;
        var id = $(col).attr("data-id");
        var title = $(col).attr("data-title") ? $(col).attr("data-title") : "";
        var contentType = $(col).attr("data-type") ? $(col).attr("data-type") : "";
        var colClasses = $.grep(col.className.split(" "), function(v, i){
          return v.indexOf('col-') === 0;
        }).join(" ");
        elementCount++;

        templateElements[id] = {title: title, type: contentType, class: colClasses, sort: elementCount};
      })

      template.content[rowId] = {title: $(row).attr("data-title"), elements: templateElements, sort: sectionCount};
    })

    // console.log(template);
    return setTemplate(templateId, template);
  }

  resetSampleTemplate = function() {
    return $.getJSON("sample-templates.json", function(data) {
      console.log("Template reset completed");
      setTemplates(data);
    });
  }

  resetSampleContent = function() {
    return $.getJSON("sample-products.json", function(data) {
      console.log("Content reset completed");
      setContent(data, false, true);
    });
  }

  saveContent = function(contentElement, configOptions) {
    return getContent().then(function(allContent){
      var content = parseContent(contentElement, configOptions);
      var contentId = getProductId();
      var type = contentElement.attr("data-template-id");

      if (!allContent[contentId]) allContent[contentId] = {};
      allContent[contentId].content = content;
      allContent[contentId].type = type;

      setContent(allContent, configOptions.isPreview);
    })
  }

  parseContent = function(contentElement, configOptions) {
    var sectionElements = {};
    var elementCount = 0;
    var html = contentElement.html();
    var sectionDivider = configOptions && configOptions.sectionDivider ? configOptions.sectionDivider : '.row';
    var elementDivider = configOptions && configOptions.elementDivider ? configOptions.elementDivider : '[class^="col-"]';
    var subElement = configOptions && configOptions.subElement ? configOptions.subElement : null;
    var contentFormat = configOptions && configOptions.contentFormat ? configOptions.contentFormat : "object";

    contentElement.find(sectionDivider).each(function() {
      var row = this;
      var templateElements = {};

      $(row).find(elementDivider).each(function() {
        var col = this;
        var contentType = $(col).attr("data-type") ? $(col).attr("data-type") : "";//getContentTypeFromClass(col);

        if (subElement) {
          var columnElements = $(col).find(subElement);
        } else {
          var columnElements = $(col);
        }

        columnElements.each(function() {
          if ($(this).attr('data-id')) {
            elementCount++;
            var content = (contentFormat=="object") ? $(this).val() : $(this).html();
            content = content.replace(/\r?\n|\r/g,"").trim();
            console.log(content.replace(/"/g, '\\"'));
            var html = convertHtmlToMarkdown(content)
            if ($(this).attr('data-type')=="list" && html.trim()=="\*") html = "";
            templateElements[$(this).attr('data-id')] = html;
          }
        });
      })
      sectionElements[row.id] = {elements: templateElements};
    })

    return sectionElements;
  }

  loadTemplate = function(formElement, templateId, subElement, sectionTemplate, elementTemplate, contentSelector) {
    if (templateId) setTemplateId(templateId);

    return getTemplate(getTemplateId()).then(function(template) {

      // Sort sections & elements
      var sectionsArray = [];
      $.each(template.data().content, function(sectionKey, section) {
        var elementsArray = [];
        $.each(section.elements, function(elementKey, element) {
          element.id = elementKey;
          elementsArray.push(element);
        })

        elementsArray.sort(function (a, b) {
          return a.sort && b.sort ? a.sort.toString().localeCompare(b.sort.toString()) : 0;
        });

        section.id = sectionKey;
        section.elements = elementsArray;
        sectionsArray.push(section);
      })

      sectionsArray.sort(function (a, b) {
        return a.sort && b.sort ? a.sort.toString().localeCompare(b.sort.toString()) : 0;
      });

      $(formElement).html("");
      $(formElement).attr("data-template-id", template.id);
      $(formElement).attr("data-template-title", template.data().title);
      $(formElement).attr("data-template-link", template.data().link);

      $.each(sectionsArray, function(sectionId, section) {
        if (!subElement || subElement==section.id) {
          // var panel = $('<div class="row"></div>');
          var panel = sectionTemplate ? $(sectionTemplate).clone() : $('<div class="row"></div>');
          panel.attr("id", section.id);
          panel.attr("data-id", section.id);
          panel.attr("data-title", section.title);

          if (sectionTemplate) {
            $(panel).find("[data-title-element='true']").html(section.title);
          }

          $.each(section.elements, function(elementId, element) {
            var elementHtml = elementTemplate ? $(elementTemplate) : $('<div></div>');
            elementHtml.attr("id", element.id);
            elementHtml.attr("data-id", element.id);
            elementHtml.attr("data-title", element.title);
            elementHtml.attr("data-type", element.type);
            elementHtml.addClass(element.class);
            elementHtml.addClass("column");
            elementHtml.addClass("element-" + elementId);
            elementHtml.addClass("content-" + element.type);

            if (elementTemplate) {
              var elementContent = elementHtml.append(elementTemplate);
              elementContent.find("[data-title-element='true']").html(element.title);
            } else {
              elementHtml.append("<span></span>");
            }

            if (contentSelector) {
              panel.find(contentSelector).append(elementHtml);
            } else {
              panel.append(elementHtml);
            }
          })
          $(formElement).append(panel);
        }
      })
      return template;
    });
  }

  loadTemplates = function(formElement) {
    return getTemplates().then(function(templates) {
      var templatesArray = [];
      var table = $(formElement);
      table.html("");
      table.append("<thead><tr><th>Naam</th></tr></thead>");
      table.append("<tbody></tbody>");

      $.each(templates, function(templateId, template) {
        template.id = templateId;
        templatesArray.push(template);
      })

      templatesArray.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });

      $.each(templatesArray, function(templateId, template) {
        table.append('<tr><td><a href="/template.html?template=' + template.id + '">' + template.title + '</a></td></tr>');
      })
    });
  }

  loadTemplateInContentEditor = function(form, sectionTemplate) {
    return getTemplate(getTemplateId()).then(function(template){
      form.html("");
      form.attr("data-template-id", getTemplateId());

      // Sort sections & elements
      var sectionsArray = [];
      $.each(template.data().content, function(sectionKey, section) {
        var elementsArray = [];
        $.each(section.elements, function(elementKey, element) {
          element.id = elementKey;
          elementsArray.push(element);
        })

        elementsArray.sort(function (a, b) {
          return a.sort && b.sort ? a.sort.toString().localeCompare(b.sort.toString()) : 0;
        });

        section.id = sectionKey;
        section.elements = elementsArray;
        sectionsArray.push(section);
      })

      sectionsArray.sort(function (a, b) {
        return a.sort && b.sort ? a.sort.toString().localeCompare(b.sort.toString()) : 0;
      });

      $.each(sectionsArray, function(sectionId, section) {
        var panel = sectionTemplate.clone();
        var panelTitle = $(panel).find(".panel-title")[0];
        var panelContent = $(panel).find(".panel-body")[0];
        var formElement = '';

        panel.attr("id", section.id);
        panel.addClass("section");
        panelTitle.innerHTML = section.title;

        $.each(section.elements, function(elementId, element) {
          formElement += '<div class="form-group" data-id="' + element.id + '">';
          var htmlElement = $("#" + element.id);
          if (htmlElement) {
            formElement += '<label for="' + element.id + '">' + element.title + '</label>';
            formElement += createElement(element.id, element);
          } else {
            console.log(element.id + " not found");
          }
          formElement += '</div>';
        })

        panelContent.innerHTML = formElement;
        form.append(panel);
      })
      return template;
    })
  }

  loadContentItems = function(formElement) {
    return getTemplates().then(function(templates) {
      return getContent().then(function(contentItems) {
        var contentArray = [];
        var table = $(formElement);
        table.html("");
        table.append("<thead><tr><th>Naam</th><th>Type</th></tr></thead>");
        table.append("<tbody></tbody>");

        $.each(contentItems, function(contentId, content) {
          if (contentId.substring(0, 5)!="empty") {
            content.id = contentId;
            contentArray.push(content);
          }
        })

        contentArray.sort(function (a, b) {
          return a.title.localeCompare(b.title);
        });

        // $.each(templates, function(templateId, template) {
        $.each(contentArray, function(contentId, content) {
          var type = templates[content.type] ? templates[content.type].title : "Geen";
          table.append('<tr><td><a href="/content.html?content=' + content.id + '">' + content.title + '</a></td><td>' + type + '</td></tr>');
        })
      });
    });
  }

  loadContent = function(contentId, rootElementId, subElement, placeholder, viewType) {
    // var contentId = getProductId();
    return getContent(viewType=="preview").then(function(allContent){
      var content = allContent[contentId];
      if (content) {
        var templateId = setTemplateId(content.type);
        return getTemplate(templateId).then(function(template){
          if (placeholder==undefined) placeholder = ""
          $(rootElementId).attr("data-content-title", content.title);

          $.each(template.data().content, function(sectionId, section) {
            $.each(section.elements, function(elementId, element) {
              var htmlElement = subElement && subElement!=null ? $(rootElementId + " [data-id='" + elementId + "'] " + subElement) : $(rootElementId + " #" + elementId);
              if (htmlElement[0]) {
                var value = getObjectById(content, elementId);
                if (!value) value = placeholder;
                switch (element.type) {
                  case "image":
                    htmlElement.html(value);
                    break;
                  case "quote":
                  case "text":
                  case "rich-text":
                    htmlElement.val(convertMarkdownToHtml(value));
                    htmlElement.html(convertMarkdownToHtml(value));
                    // htmlElement.val(value);
                    // htmlElement.html(value);
                    break;
                  case "list":
                    var html = convertMarkdownToHtml(value);

                    if (html=="" && viewType!="preview" && viewType!="live") html="<ul><li></li></ul>";
                    if (viewType=="live") {
                      if (elementId=="pluspunten" || elementId=="minpunten") {
                        $("body").append('<div id="temp-html" style="display: none"></div>');
                        var tempDiv = $("#temp-html").append(html);

                        $(tempDiv).find("ul").addClass("review-pros-and-cons__list review-pros-and-cons__list--pros");
                        if (elementId=="pluspunten") {
                          $(tempDiv).find("li").addClass("review-pros-and-cons__attribute review-pros-and-cons__attribute--pro");
                        } else {
                          $(tempDiv).find("li").addClass("review-pros-and-cons__attribute review-pros-and-cons__attribute--con");
                        }
                        
                        html = tempDiv.html();
                        tempDiv.remove();
                      }
                    }
                    htmlElement.val(html);
                    htmlElement.html(html);
                    break;
                  default:
                    htmlElement.html(value);
                }
              }
            })
          })
          return allContent[contentId];
        })
      }
    });
  }

  // watchContent = function() {
  //   db.collection("content").onSnapshot(function(docs) {
  //     var content = {};
  //     docs.forEach(function(doc) {
  //       var source = doc.metadata.hasPendingWrites ? "Local" : "Server";
  //       // console.log(source, " data: ", doc && doc.data());
  //       // console.log(doc);
  //       content[doc.id] = doc.data();
  //     });
  //     console.log(content);
  //     setContent(content);
  //   });
  //   // db.collection("content").onSnapshot(function(snapshot) {
  //   //     snapshot.docChanges.forEach(function(change) {
  //   //         if (change.type === "added") {
  //   //             console.log("New doc: ", change.doc.data());
  //   //         }
  //   //         if (change.type === "modified") {
  //   //             console.log("Modified doc: ", change.doc.data());
  //   //         }
  //   //         if (change.type === "removed") {
  //   //             console.log("Removed doc: ", change.doc.data());
  //   //         }
  //   //     });
  //   // });
  // }

  getContent = function(isPreview) {
    var contentItems = {};

    if (isPreview) {
      return new Promise(function(resolve, reject) {
        resolve(JSON.parse(localStorage.getItem("previewProducts")));
      });
    } else {
      return db.collection("products").get().then(function(querySnapshot) {
        querySnapshot.forEach(function(content) {
            contentItems[content.id] = content.data();
        });
        return contentItems;
      });
    }
  }

  setContent = function(content, isPreview, convertToMarkdown) {
    var jsonOutput = JSON.stringify(content);

    if (isPreview) {
      localStorage.setItem("previewProducts", jsonOutput);
    } else {
      var batch = db.batch();
      var that = this;
      $.each(content, function(contentKey, contentObject) {
        if (convertToMarkdown) contentObject = convertPropertiesToMarkdown(contentObject)
        var contentRef = db.collection("products").doc(contentKey);
        batch.set(contentRef, contentObject);
      })

      return batch.commit()
      .then(function() {
          console.log("Content successfully updated!");
      })
      .catch(function(error) {
          console.error("Error updating document: ", error);
      });
    }
  }

  getTemplate = function(id, isPreview) {
    if (isPreview) {
      return localStorage.getItem("previewTemplate");
    } else {
      var that = this;
      var templateRef = db.collection("templates").doc(id);
      return templateRef.get().then(function(template) {
          if (template.exists) {
            return template;
          } else {
            console.log("No such template: " + that.id);
          }
      }).catch(function(error) {
          console.log("Error getting template:", error);
      });
    }
  }

  getTemplates = function() {
    var templates = {};
    return db.collection("templates").get().then(function(querySnapshot) {
      querySnapshot.forEach(function(template) {
          templates[template.id] = template.data();
      });
      return templates;
    });
  }

  setTemplate = function(id, template, isPreview) {
    var templates = {};
    templates[id] = template;
    var jsonOutput = JSON.stringify(templates);

    if (isPreview) {
      localStorage.setItem("previewTemplate", jsonOutput);
    } else {
      var templateRef = db.collection("templates").doc(id);

      return templateRef.set(template)
      .then(function() {
          console.log("Template successfully updated!");
          return template;
      })
      .catch(function(error) {
          // The document probably doesn't exist.
          console.error("Error updating document: ", error);
      });
    }
  }

  setTemplates = function(templates) {
    var jsonOutput = JSON.stringify(templates);

    var batch = db.batch();
    $.each(templates, function(templateKey, templateObject) {
      var templatesRef = db.collection("templates").doc(templateKey);
      batch.set(templatesRef, templateObject);
    })

    return batch.commit()
    .then(function() {
        console.log("Templates successfully updated!");
    })
    .catch(function(error) {
        console.error("Error updating document: ", error);
    });
  }

  getProductId = function() {
    var contentId = localStorage.getItem("selectedProductId");
    if (!contentId || contentId=="undefined") contentId = setProductId();
    return contentId;
  }

  setProductId = function(contentId) {
    if (!contentId) contentId = "empty";
    localStorage.setItem("selectedProductId", contentId);
    return localStorage.getItem("selectedProductId");
  }

  getTemplateId = function() {
    var templateId = localStorage.getItem("selectedTemplateId");
    if (!templateId || templateId=="undefined") templateId = setTemplateId();
    return templateId;
  }

  setTemplateId = function(templateId) {
    if (!templateId) templateId = "product-description";
    localStorage.setItem("selectedTemplateId", templateId);
    return localStorage.getItem("selectedTemplateId");
  }

  getContentName = function() {
    var contentId = getProductId();
    return getContent().then(function(allContent){
      var contentItem = allContent[contentId];
      return contentItem.title;
    });
  }

  getTemplateItems = function() {
    return getTemplates().then(function(template){
      var templateArray = [];
      $.each(template, function(key, object) {
        templateArray.push({id: key, title: object.title});
      })

      templateArray.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });

      return templateArray;
    })
  }

  getContentItems = function(showEmptyItem) {
    if (showEmptyItem==undefined) showEmptyItem = false;
    return getContent().then(function(content){
      var contentArray = [];
      $.each(content, function(key, object) {
        if (showEmptyItem || key.substring(0, 5)!="empty") {
          contentArray.push({id: key, type: object.type, title: object.title});
        }
      })

      contentArray.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });

      return contentArray;
    })
  }

  populateTemplateItems = function() {
    return getTemplateItems().then(function(contentItems){
      contentItems.forEach(function (item) {
        $('#template-items').append($("<option></option>")
                    .attr("value", item.id)
                    .text(item.title)
                  );
      });

      console.log(getTemplateId());
      $("#template-items").val(getTemplateId());
    })
  }

  populateContentItems = function(showEmptyItem) {
    return getContentItems(showEmptyItem).then(function(contentItems) {
      $('#content-items').html("");

      var templateId = getTemplateId();
      var filteredContentItems = contentItems.filter(function(item) {
        return item.type === templateId || item.type === "all";
      })

      filteredContentItems.forEach(function (item) {
        $('#content-items').append($("<option></option>")
                    .attr("value", item.id)
                    .text(item.title)
                  );
        $('#preview-content ul.dropdown-menu').append($('<li><a data-width="auto" title="' + item.id + '"><span>' + item.title + '</span></li>'));
        if (item.id===getProductId()) $('#preview-content-select span').html(item.title);
      });

      $("#content-items").val(getProductId());
    })
  }

  createElement = function(id, element) {
    var content = "";

    switch (element.type) {
      case "text":
        content = '<textarea class="form-control text" id="' + id + '" data-id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "rich-text":
        content = '<textarea class="form-control rich-text" id="' + id + '" data-id="' + id + '"data-type="' + element.type + '"></textarea>';
        break;
      case "list":
        content = '<textarea class="form-control list" id="' + id + '" data-id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "quote":
        content = '<textarea class="form-control blockquote" id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "image":
        content = '<div id="' + id + '" data-type="' + element.type + '"></div>';
        break;
    }

    return content;
  }

  getContentTypeFromClass = function(element) {
    var classes = $(element).attr("class").split(' ');
    var filteredClasses = classes.filter(function(item) {
      return typeof item == 'string' && item.indexOf("content-") > -1;
    });
    var type = filteredClasses.map(function(name) {
      return name.substring(8)
    })[0];
    if (type==undefined) type = "text";

    return type;
  }

  separateContent = function(content) {
    var separator = ["blockquote", "img"];

    var htmlObject = $.parseHTML(content);
    var filteredHtmlObject = htmlObject.filter(function(index) {
      return index.nodeName != "#text";
    })

    var htmlArray = [];
    var content = {};
    var separatorIndex = 0;

    filteredHtmlObject.forEach(function(data) {
      separatorIndex = separator.indexOf(data.nodeName.toLowerCase());
      if (separatorIndex >= 0) {
        if (content) {
          htmlArray.push(content);
        }
        content = {};
        if (separator[separatorIndex] == "img") {
          content.type = "image";
          content.content = data.outerHTML;
        } else {
          content.type = separator[separatorIndex];
          content.content = data.innerHTML;
        }

        htmlArray.push(content);
      } else {
        if (content == undefined || content.type != "text") {
          content = {};
          content.type = "text";
          content.content = "";
        } else {
          content.content += data.innerHTML;
        }
      }
    })
    htmlArray.push(content);

    return htmlArray;
  }

  wrapWithParagraph = function(selector, replaceList) {
    var html = $(selector);

    $.each(replaceList, function(itemId, item) {
      html = $(selector + ' ' + item).wrapInner("<p></p>");
    });

    return html;
  }

  function getObjectById(obj, key) {
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (i==key) {
          return obj[i];
        } else if (typeof obj[i] == 'object') {
          var resultObject = getObjectById(obj[i], key);
          if (resultObject) {
            return resultObject;
          }
        }
    }
  }

  convertHtmlToMarkdown = function(html) {
    var reMarkedOptions = {
        link_list:  false,    // render links as references, create link list as appendix
        h1_setext:  true,     // underline h1 headers
        h2_setext:  true,     // underline h2 headers
        h_atx_suf:  false,    // header suffixes (###)
        gfm_code:   "```",    // gfm code blocks
        trim_code:	true,     // trim whitespace within <pre><code> blocks (full block, not per line)
        li_bullet:  "*",      // list item bullet style
        hr_char:    "-",      // hr style
        indnt_str:  "    ",   // indentation string
        bold_char:  "*",      // char used for strong
        emph_char:  "_",      // char used for em
        gfm_del:    true,     // ~~strikeout~~ for <del>strikeout</del>
        gfm_tbls:   true,     // markdown-extra tables
        tbl_edges:  false,    // show side edges on tables
        hash_lnks:  false,    // anchors w/hash hrefs as links
        br_only:    false,    // avoid using "  " as line break indicator
        col_pre:    "col ",   // column prefix to use when creating missing headers for tables
        nbsp_spc:   false,    // convert &nbsp; entities in html to regular spaces
        span_tags:  true,     // output spans (ambiguous) using html tags
        div_tags:   true,     // output divs (ambiguous) using html tags
        unsup_tags: {         // handling of unsupported tags, defined in terms of desired output style. if not listed, output = outerHTML
            // no output
            ignore: "script style noscript",
            // eg: "<tag>some content</tag>"
            inline: "span sup sub i u b center big",
            // eg: "\n\n<tag>\n\tsome content\n</tag>"
            block2: "div form fieldset dl header footer address article aside figure hgroup section",
            // eg: "\n<tag>some content</tag>"
            block1c: "dt dd caption legend figcaption output",
            // eg: "\n\n<tag>some content</tag>"
            block2c: "canvas audio video iframe"
        },
        tag_remap: {          // remap of variants or deprecated tags to internal classes
            "i": "em",
            "b": "strong"
        }
    };


    var reMarker = new reMarked(reMarkedOptions);
    var markdown = reMarker.render(html);
    return markdown;
  }

  convertMarkdownToHtml = function(markdown) {
    var converter = new showdown.Converter();
    var html = converter.makeHtml(markdown);
    return html;
  }

  convertPropertiesToMarkdown = function(object) {
    $.each(object.content, function(contentSectionKey, contentSection) {
      $.each(contentSection, function(contentPropKey, contentProperty) {
        object.content[contentSectionKey][contentPropKey] = convertHtmlToMarkdown(contentProperty);
      })
    })

    return object;
  }

  getURLParameter = function(sParam) {
      var sPageURL = window.location.search.substring(1);
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
          return sParameterName[1];
        }
      }
  }

  setURLParameter = function(parameter, value) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + parameter + '=' + value;
    window.history.pushState({path:newurl},'',newurl);
  }

  slugify = function(text) {
    return text.toLowerCase().split(' ').join('-');;
  }

})(jQuery);

// // Initialize Firebase
var firebaseConfig = {
  apiKey: "AIzaSyC1oK8OilCE_f6tBdsKkCSEScjnhNWVelU",
  authDomain: "retail-tooling-cms.firebaseapp.com",
  databaseURL: "https://retail-tooling-cms.firebaseio.com",
  projectId: "retail-tooling-cms",
  storageBucket: "retail-tooling-cms.appspot.com",
  messagingSenderId: "73299715568"
};
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();

(function() {
    $.fn.gridEditor.RTEs.ckeditor = {

        init: function(settings, contentAreas) {

            if (!window.CKEDITOR) {
                console.error(
                    'CKEditor not available! Make sure you loaded the ckeditor and jquery adapter js files.'
                );
            }

            var self = this;
            contentAreas.each(function() {
                var contentArea = $(this);
                if (!contentArea.hasClass('active')) {
                    if (contentArea.html() == self.initialContent) {
                        // CKEditor kills this '&nbsp' creating a non usable box :/ 
                        contentArea.html('&nbsp;'); 
                    }
                    
                    // Add the .attr('contenteditable',''true') or CKEditor loads readonly
                    contentArea.addClass('active').attr('contenteditable', 'true');
                    
                    var configuration = $.extend(
                        {},
                        (settings.ckeditor && settings.ckeditor.config ? settings.ckeditor.config : {}), 
                        {
                            // Focus editor on creation
                            on: {
                                instanceReady: function( evt ) {
                                    // Call original instanceReady function, if one was passed in the config
                                    var callback;
                                    try {
                                        callback = settings.ckeditor.config.on.instanceReady;
                                    } catch (err) {
                                        // No callback passed
                                    }
                                    if (callback) {
                                        callback.call(this, evt);
                                    }
                                    
                                    instance.focus();
                                }
                            }
                        }
                    );
                    var instance = CKEDITOR.inline(contentArea.get(0), configuration);
                }
            });
        },

        deinit: function(settings, contentAreas) {
            contentAreas.filter('.active').each(function() {
                var contentArea = $(this);
                
                // Destroy all CKEditor instances
                $.each(CKEDITOR.instances, function(_, instance) {
                    instance.destroy();
                });

                // Cleanup
                contentArea
                    .removeClass('active cke_focus')
                    .removeAttr('id')
                    .removeAttr('style')
                    .removeAttr('spellcheck')
                    .removeAttr('contenteditable')
                ;
            });
        },

        initialContent: '<p>Lorem initius... </p>',
    };
})();
(function() {

    $.fn.gridEditor.RTEs.summernote = {

        init: function(settings, contentAreas) {
            
            if (!jQuery().summernote) {
                console.error('Summernote not available! Make sure you loaded the Summernote js file.');
            }

            var self = this;
            contentAreas.each(function() {
                var contentArea = $(this);
                if (!contentArea.hasClass('active')) {
                    if (contentArea.html() == self.initialContent) {
                        contentArea.html('');
                    }
                    contentArea.addClass('active');

                    var configuration = $.extend(
                        true, // deep copy
                        {},
                        (settings.summernote && settings.summernote.config ? settings.summernote.config : {}),
                        {
                            tabsize: 2,
                            airMode: true,
                            // Focus editor on creation
                            callbacks: {
                                onInit: function() {
                                    
                                    // Call original oninit function, if one was passed in the config
                                    var callback;
                                    try {
                                        callback = settings.summernote.config.callbacks.onInit;
                                    } catch (err) {
                                        // No callback passed
                                    }
                                    if (callback) {
                                        callback.call(this);
                                    }
                                    
                                    contentArea.summernote('focus');
                                }
                            }
                        }
                    );
                    contentArea.summernote(configuration);
                }
            });
        },

        deinit: function(settings, contentAreas) {
            contentAreas.filter('.active').each(function() {
                var contentArea = $(this);
                contentArea.summernote('destroy');
                contentArea
                    .removeClass('active')
                    .removeAttr('id')
                    .removeAttr('style')
                    .removeAttr('spellcheck')
                ;
            });
        },

        initialContent: '<p>Lorem ipsum dolores</p>',
    };
})();

(function() {
    $.fn.gridEditor.RTEs.tinymce = {
        init: function(settings, contentAreas) {
            if (!window.tinymce) {
                console.error('tinyMCE not available! Make sure you loaded the tinyMCE js file.');
            }
            if (!contentAreas.tinymce) {
                console.error('tinyMCE jquery integration not available! Make sure you loaded the jquery integration plugin.');
            }
            var self = this;
            contentAreas.each(function() {
                var contentArea = $(this);
                if (!contentArea.hasClass('active')) {
                    if (contentArea.html() == self.initialContent) {
                        contentArea.html('');
                    }
                    contentArea.addClass('active');
                    var configuration = $.extend(
                        {},
                        (settings.tinymce && settings.tinymce.config ? settings.tinymce.config : {}),
                        {
                            inline: true,
                            oninit: function(editor) {
                                // Bring focus to text field
                                $('#' + editor.settings.id).focus();

                                // Call original oninit function, if one was passed in the config
                                var callback;
                                try {
                                    callback = settings.tinymce.config.oninit;
                                } catch (err) {
                                    // No callback passed
                                }

                                if (callback) {
                                    callback.call(this);
                                }
                            }
                        }
                    );
                    var tiny = contentArea.tinymce(configuration);
                }
            });
        },

        deinit: function(settings, contentAreas) {
            contentAreas.filter('.active').each(function() {
                var contentArea = $(this);
                var tiny = contentArea.tinymce();
                if (tiny) {
                    tiny.remove();
                }
                contentArea
                    .removeClass('active')
                    .removeAttr('id')
                    .removeAttr('style')
                    .removeAttr('spellcheck')
                ;
            });
        },

        initialContent: '<p>No content</p>',
    };
})();
