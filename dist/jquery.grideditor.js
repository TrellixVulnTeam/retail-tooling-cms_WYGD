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
            'template_types'    : [{id: "basic", label: "Basic"}, {id: "collapsible", label: "Collapsible"}],
            'prios'             : [{id: 1, label: "Hoge prio"}, {id: 2, label: "Medium prio"}, {id: 3, label: "Lage prio"}],
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
                $(this).parent().find('.template-type').show();
            });

            canvas.on('mouseleave', '.row > .ge-tools-drawer', function(e) {
              $(this).parent().find('> .ge-tools-drawer a').hide();
              $(this).parent().find('.template-type').hide();
              $(this).parent().find('.ge-details').hide();
            });

            canvas.on('mouseenter', '.column', function(e) {
                $(this).find('> .ge-tools-drawer > a').show();
                $(this).find('.content-type').show();
                $(this).find('.prio').show();
            });

            canvas.on('mouseleave', '.column', function(e) {
              $(this).find('> .ge-tools-drawer > a').hide();
              $(this).find('.content-type').hide();
              $(this).find('.prio').hide();
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
                var templateType = row.attr('data-type') ? row.attr('data-type') : "basic";
                var templateTypeSelect = $('<select class="template-type btn btn-xs btn-secondary dropdown-toggle"></select>').prependTo(drawer);
                settings.template_types.forEach(function(type) {
                  var option = templateTypeSelect.append($("<option></option>")
                              .attr("value", type.id)
                              .text(type.label)
                            );
                  if (templateType==type.id) templateTypeSelect.val(templateType);
                });
                templateTypeSelect.hide();

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
                var contentPrio = col.attr('data-prio') ? col.attr('data-prio') : "";
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

                var prioSelect = $('<select class="prio btn btn-xs btn-secondary dropdown-toggle"></select>').prependTo(drawer);
                settings.prios.forEach(function(prio) {
                  var option = prioSelect.append($("<option></option>")
                              .attr("value", prio.id)
                              .text(prio.label)
                            );
                  if (contentPrio==prio.id) prioSelect.val(contentPrio);
                });
                prioSelect.hide();
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

            $(".row .template-type").change(function() {
              $(this).parent().parent().attr("data-type", $(this).val());
            })

            $(".column > .ge-element-title").change(function() {
              $(this).parent().attr("data-id", slugify($(this).text()));
              $(this).parent().attr("data-title", $(this).text());
            })

            $(".column .content-type").change(function() {
              $(this).parent().parent().attr("data-type", $(this).val());
            })

            $(".column .prio").change(function() {
              $(this).parent().parent().attr("data-prio", $(this).val());
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
              .attr("data-prio", contentPrio)
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
  saveTemplate = function(templateId, templateTitle, html, templateLink, parent) {
    var template = {title: templateTitle, content: {}, link: templateLink, parent: parent};
    var sectionCount = 0;
    var elementCount = 0;

    $(html).filter('.row').each(function() {
      var row = this;
      var templateElements = {};
      var rowTitle = $(row).attr("data-title") ? $(row).attr("data-title") : "";
      var rowType = $(row).attr("data-type") ? $(row).attr("data-type") : "";
      var rowId = $(row).attr("data-id") ? $(row).attr("data-id") : slugify(rowTitle);
      sectionCount++;

      $(row).find('.column').each(function() {
        var col = this;
        var id = $(col).attr("data-id");
        var title = $(col).attr("data-title") ? $(col).attr("data-title") : "";
        var contentType = $(col).attr("data-type") ? $(col).attr("data-type") : "";
        var contentPrio = $(col).attr("data-prio") ? parseInt($(col).attr("data-prio")) : 0;
        var colClasses = $.grep(col.className.split(" "), function(v, i){
          return v.indexOf('col-') === 0;
        }).join(" ");
        elementCount++;

        templateElements[id] = {title: title, type: contentType, prio: contentPrio, class: colClasses, sort: elementCount};
      })

      template.content[rowId] = {title: rowTitle, type: rowType, elements: templateElements, sort: sectionCount};
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
      var contentId = getContentId();
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
        // var contentType = $(col).attr("data-type") ? $(col).attr("data-type") : "";//getContentTypeFromClass(col);

        if (subElement) {
          var columnElements = $(col).find(subElement);
        } else {
          var columnElements = $(col);
        }

        columnElements.each(function() {
          if ($(this).attr('data-id')) {
            elementCount++;
            var elementId = $(this).attr('data-id');
            var elementType = $(this).attr('data-type');
            var elementPrio = $(this).attr('data-prio');
            var html = (contentFormat=="object") ? $(this).val() : $(this).html();
            var markdown = "";

            if (typeof html=="object") {
              markdown = JSON.stringify(html);
            } else {
              html = html.replace(/\r?\n|\r/g,"").trim();
              markdown = convertHtmlToMarkdown(html);
            }

            if (elementType=="quote") {
              var content = (contentFormat=="object") ? $(this).val() : $(this).html();

              var quote = $(this).find('#annotatie-content').val();
              if (!quote) quote = content;
              html = "<blockquote>" + quote + "</blockquote>";

              var person = $(this).find('#annotatie-person').val();
              if (person) html += "<person>" + person + "</person>";

              markdown = convertHtmlToMarkdown(html);
            } else if (elementType=="list") {
              if (markdown.trim()=="\*") markdown = "";
            }

            templateElements[elementId] = markdown;
          }
        });
      })
      sectionElements[row.id] = {elements: templateElements};
    })

    return sectionElements;
  }

  loadTemplate = function(formElement, templateId, subElement, sectionTemplates, contentSelector) {
    return getTemplate(templateId).then(function(template) {

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
      $(formElement).attr("data-template-parent", template.data().parent);

      $.each(sectionsArray, function(sectionId, section) {
        if (!subElement || subElement==section.id) {
          if (!section.type) section.type = "basic";

          var sectionElement = sectionTemplates ? $(sectionTemplates[section.type]).clone() : $('<div class="row"></div>');
          sectionElement.attr("data-id", section.id);
          sectionElement.attr("data-title", section.title);
          sectionElement.attr("data-type", section.type);

          if (sectionTemplates) {
            $(sectionElement).find("[data-title-element='true']").html(section.title);
          }

          $.each(section.elements, function(elementId, element) {
            var contentElement = $('<div></div>');
            contentElement.attr("data-id", element.id);
            contentElement.attr("data-title", element.title);
            contentElement.attr("data-type", element.type);
            contentElement.attr("data-prio", element.prio);
            contentElement.addClass(element.class);
            contentElement.addClass("column");
            contentElement.addClass("element-" + elementId);
            contentElement.addClass("content-" + element.type);

            var elementContent = contentElement.append('<span><h3 data-title-element="true"></h3></span>');
            elementContent.find("[data-title-element='true']").html(element.title);

            if (contentSelector) {
              sectionElement.find(contentSelector).append(contentElement);
            } else {
              sectionElement.append(contentElement);
            }
            sectionElement.hide();
          })
          $(formElement).html('<span class="loader glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>');
          $(formElement).append(sectionElement);
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
        template.sort = template.parent ? (template.parent + "-" + templateId) : templateId;
        templatesArray.push(template);
      })

      templatesArray.sort(function (a, b) {
        return a.sort.localeCompare(b.sort);
      });

      $.each(templatesArray, function(templateId, template) {
        var levelClass = template.parent ? "child" : ""
        table.append('<tr><td><a href="/template.html?template=' + template.id + '" class="' + levelClass + '">' + template.title + '</a></td></tr>');
      })
    });
  }

  loadTemplateInContentEditor = function(form, templateId, sectionTemplate) {
    return getTemplate(templateId).then(function(template){
      form.html("");
      form.attr("data-template-id", templateId);

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
        var sectionElement = sectionTemplate.clone();
        var sectionElementTitle = $(sectionElement).find(".panel-title")[0];
        var sectionElementContent = $(sectionElement).find(".panel-body")[0];
        var formElement = '';

        sectionElement.attr("id", section.id);
        sectionElement.addClass("section");
        sectionElementTitle.innerHTML = section.title;

        $.each(section.elements, function(elementId, element) {
          var htmlElement = $("#" + element.id);
          if (htmlElement) {
            formElement += createElement(element);
          } else {
            console.log(element.id + " not found");
          }
        })

        sectionElementContent.innerHTML = formElement;
        form.append(sectionElement);
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

  loadContent = function(contentId, rootElementId, placeholder, viewType) {
    return getContent(viewType=="preview").then(function(allContent){
      var content = allContent[contentId];
      var templateId = content.type!="all" ? content.type : getTemplateId();

      if (content) {
        switch (viewType) {
          case "template-editor":
            subElement = '> .ge-content';
            break;
          case "content-editor":
            subElement = '';
            break;
          default:
            subElement = 'span';
            break;
        }

        return getTemplate(templateId).then(function(template){
          if (placeholder==undefined) placeholder = ""
          $(rootElementId).attr("data-content-title", content.title);

          $.each(template.data().content, function(sectionId, section) {
            $.each(section.elements, function(elementId, element) {
              componentType = "element";
              var elementSelector = rootElementId + ' [data-id="element-' + elementId + '"]';
              var rootElement = $(elementSelector);

              if (rootElement.length==0) {
                componentType = "default";
                elementSelector = subElement && subElement!=null ? (rootElementId + ' [data-id="' + elementId + '"] ' + subElement) : (rootElementId + ' [data-id="' + elementId + '"]');
                rootElement = $(elementSelector);
              }

              if (rootElement.length > 0) {
                var value = getObjectById(content, elementId);
                if (!value) value = placeholder;
                switch (element.type) {
                  case "quote":
                    if (viewType=="live" || viewType=="preview") {
                      var html = convertMarkdownToHtml(value);

                      rootElement.val(convertMarkdownToHtml(value));
                      rootElement.html(convertMarkdownToHtml(value));
                    } else {
                      var html = convertMarkdownToHtml(value);

                      var quote = $(html).filter('blockquote').find('p').html();
                      if (!quote) quote = value;
                      rootElement.find("#" + elementId + "-content").val(quote);
                      rootElement.find("#" + elementId + "-content").html(quote);

                      var person = $(html).find('person').html();
                      rootElement.find("#" + elementId + "-person").val(person);
                      rootElement.find("#" + elementId + "-person").html(person);
                      break;
                    }
                  case "text":
                  case "rich-text":
                    if (viewType=="live" || viewType=="preview") {
                      rootElement.append(convertMarkdownToHtml(value));
                    } else {
                      rootElement.val(convertMarkdownToHtml(value));
                      rootElement.html(convertMarkdownToHtml(value));
                    }
                    break;
                  case "image":
                    if (viewType=="live") {
                      if (contentId=="productafbeeldingen-sonos") {
                        rootElement.attr("src", "/sample_content/images/" + template.id + "/" + value);
                      } else {
                        rootElement.html(convertMarkdownToHtml(value));
                      }
                    } else if (viewType=="content-editor") {
                      populateImageList(rootElement, template.id, value);
                    } else if (viewType=="template-editor") {
                      if (value) {
                        var imageElement = $('<img>')
                          .attr("src", "/sample_content/images/" + template.id + "/" + value)
                        rootElement.append(imageElement);
                      }
                    } else {
                      rootElement.val(convertMarkdownToHtml(value));
                      rootElement.html(convertMarkdownToHtml(value));
                    }
                    break;
                  case "imagelist":
                    var images = isJson(value) ? JSON.parse(value) : value;
                    if (viewType=="live") {
                      if (elementId=="product-afbeeldingen") {
                        var imageCounter = 0;
                        var list = $('.product-image-thumb-list');
                        rootElement.html("");

                        if (images) {
                          images.forEach(function(image) {
                            imageCounter++
                            var imageElement = $('<img unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb">')
                              .addClass("thumbnail")
                              .attr("src", "/sample_content/images/" + template.id + "/" + image)
                              .attr("data-index", imageCounter)

                            var listItem = $('<li class="nav nav--thumb js_thumb"></li>');
                            if (imageCounter==1) listItem.addClass("is-active");
                            rootElement.append(listItem.wrapInner(imageElement));
                          });
                        }
                      } else {
                        var list = $('<ul class="imagelist"></ul>');

                        if (images) {
                          images.forEach(function(image) {
                            var imageElement = $('<img>')
                              .addClass("thumbnail")
                              .attr("src", "/sample_content/images/" + template.id + "/" + image)
                            list.append($("<li></li>").wrapInner(imageElement));
                          });
                        }

                        rootElement.append(list);
                      }
                    } else if (viewType=="content-editor") {
                      populateImageList(rootElement, template.id, value);
                    } else if (viewType=="template-editor") {
                      var list = $('<ul class="imagelist"></ul>');

                      if (images) {
                        images.forEach(function(image) {
                          var imageElement = $('<img>')
                            .attr("src", "/sample_content/images/" + template.id + "/" + image)
                          list.append($("<li></li>").wrapInner(imageElement));
                        });
                      }

                      rootElement.append(list);
                    } else {
                      rootElement.val(convertMarkdownToHtml(value));
                      rootElement.html(convertMarkdownToHtml(value));
                    }
                    break;
                  case "list":
                    var html = convertMarkdownToHtml(value);

                    if (viewType=="live" || viewType=="preview") {
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
                      rootElement.append(html);
                    } else {
                      if (viewType!="template-editor" && html=="") html="<ul><li></li></ul>";
                      rootElement.val(html);
                      rootElement.html(html);
                    }
                    break;
                  default:
                    if (viewType=="live") {
                      rootElement.append(value);
                    } else {
                      if (element.type.substring(0, 9)=="template-") {
                        rootElement.val(value);
                      } else {
                        rootElement.val(value);
                        rootElement.html(value);
                      }
                    }
                }
              }
            })
          })
          $(rootElementId).find(".loader").remove();
          $(rootElementId).children().show();

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

  setShopMainTemplate = function() {
    $('#product_title').append('<a id="edit-page-template" href="http://localhost:8000/template.html?template=pdp" class="review__btn-write-review" style="float: right" title="Pas template aan"><i class="fa fa-th"></i> Pas pagina-template aan</a>');
  }

  setShopElementContent = function(rootElementSelector, templateId, contentId) {
    if (!contentId) contentId = getContentId();

    var preview = getURLParameter("preview") && getURLParameter("preview")!='undefined' ? true : false;

    var productImagesTemplate = `<div class="product-images product_media [ slot slot--product-images ] js_product_media" data-test="product-images">
      <a name="product_images" id="product_images"></a>
      <div class="product_image js_product_image">
        <div class="fluid-grid fluid-grid--s">
          <div class="fluid-grid__item one-whole">
            <div class="product-image__promo-labels">
              <div class="awareness-label awareness-label--image awareness-label--award" data-test="awareness-label-award">
                <a href="#awareness-award" class="awareness-label__link  js_awareness_scroll_trigger" data-test="scroll-to-trigger">
                  <img src="//s.s-bol.com/nl/upload/images/expertlabels/award_whathifi_5stars.png" alt="" title="" data-test="awareness-label-image" width="82" height="26">
                </a>
              </div>
            </div>
            <div class="product-image-content js_image_container">
              <div class="product-image-content js_image_container" data-rnwy-component="ab80e392-dfba-484d-b888-4c637c856f14">
                <div class="product-image--content js_product_image_pan" data-test="product-image-content">
                  <div class="sb sb-chevron-back sb-resize--lg product-image__paging product-image__prev js_prev"></div>
                  <div class="product_zoom_wrapper js_product_zoom_wrapper tst_product_zoom_wrapper js_product_image_pan_item product_zoom_wrapper--has-zoom">
                    <img data-id="element-afbeelding" src="//s.s-bol.com/imgbase0/imagebase3/large/FC/6/3/6/3/9200000050173636.jpg" data-zoom-src="//s.s-bol.com/imgbase0/imagebase3/extralarge/FC/6/3/6/3/9200000050173636.jpg" itemprop="image" class="js_product_img" alt="Sonos PLAY:5 - Zwart" title="Sonos PLAY:5 - Zwart" data-test="product-image">
                  </div>
                  <div class="sb sb-chevron-next sb-resize--lg product-image__paging product-image__next js_next"></div>
                </div>
                <div class="product-image__image-number js_product-image-number">Afbeelding 1 van 15</div>
              </div>
            </div>
          </div>
          <div class="fluid-grid__item one-whole product-image-thumb-list js_thumbs_list" data-test="thumb-list">
            <div class="product-image__thumb-list is-border-box product-image__thumb-list--has-navigation" data-test="product-images">
              <div class="nav nav--prev js_nav_prev"><span class="sb sb-chevron-back"></span></div>
              <div data-id="element-product-afbeeldingen" class="list js_list">
                <ul class="js_thumbs_list_ul product-image__thumb-list--has-scroller">
                  <li class="nav nav--thumb js_thumb is-active" data-index="0"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="1"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_1.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="2"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_2.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="3"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_3.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="4"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_4.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="5"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_5.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="6"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_6.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="7"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_7.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="8"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_8.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="9"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_9.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="10"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_10.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="11"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_11.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="12"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_12.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="13"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_13.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <li class="nav nav--thumb js_thumb" data-index="14"><img src="//s.s-bol.com/imgbase0/imagebase3/thumb/FC/6/3/6/3/9200000050173636_14.jpg" unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb"></li>
                  <div class="product-image__thumb-scroller" style="transform: translate3d(470px, 0px, 0px); width: 80px; height: 80px;"></div>
                </ul>
              </div>
              <div class="nav nav--next js_nav_next"><span class="sb sb-chevron-next"></span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="product-image-cta-container">
        <a href="#" title="Sonos PLAY:5 - Zwart" data-ean="8717755773036" data-image="https://s.s-bol.com/imgbase0/imagebase3/mini/FC/6/3/6/3/9200000050173636.jpg" data-test="product-image-cta-video" class="product-image-cta product-image-cta--video js-product-image-cta--video is-hidden">Bekijk video</a>
        <link rel="dns-prefetch" href="//bolcom.tu-vms.com">
        <link rel="preconnect" href="//bolcom.tu-vms.com">
      </div>
    </div>`;

    var productImagesSectionTemplate = `<ul class="js_thumbs_list_ul product-image__thumb-list--has-scroller" style="transform: translate3d(-147px, 0px, 0px);">
        <li class="nav nav--thumb js_thumb" data-index="0">
          <img unselectable="on" draggable="false" border="0" alt="" class="h-fluid-img js_product_thumb">
        </li>
      </ul>`;

    var sectionCollapsibleTemplate = `<div class="slot slot--description slot--seperated slot--seperated--has-more-content js_slot-description">
      <h2 data-title-element="true"></h2>
      <div class="js_show-more-description show-more">
        <div class="js_show-more-holder show-more-holder show-more--l product-tracklists-show-more--animate">
          <div data-id="section-productbeschrijving" class="description row">
          </div>
        </div>

        <div class="show-more__fade  js_show-more-button">
          <a href="#" class="show-more__button" data-test="showmore">
              <span class="[ show-more__text  show-more__text-more ]  js_link-more" title="Toon meer" data-test="showmore-text-more">Toon meer</span>
              <span class="[ show-more__text  show-more__text-less ]  js_link-less" title="Toon minder" data-test="showmore-text-less">Toon minder</span>
            </a>
        </div>
      </div>
    </div>`;

    var sectionBasicTemplate = `<div class="slot slot--description slot--seperated">
      <h2 data-title-element="true"></h2>
      <div data-id="productbeschrijving" class="description row">
      </div>
    </div>`;

    var rootElement = $(rootElementSelector);
    var rootElementContentSlug = ' .description';
    var rootElementContent = $(rootElementSelector + " " + rootElementContentSlug);
    rootElement.html("");

    var sectionTemplates = {"basic": sectionBasicTemplate, "collapsible": sectionCollapsibleTemplate, "product-images": productImagesTemplate};
    var viewType = preview ? "preview" : "live";

    loadTemplate(rootElement, templateId, null, sectionTemplates, rootElementContentSlug).then(function(template) {
      loadContent(contentId, rootElementSelector, null, viewType).then(function(content) {
        // var replaceList = ["blockquote"];
        // wrapWithParagraph(elementSelector, replaceList);

        var contentControls = $('<div class="content-controls"></div>');
        contentControls.hide();
        rootElement.append(contentControls);
        contentControls.append('<a href="http://localhost:8000/template.html?template=' + templateId + '&content=' + contentId + '" class="change-template btn buy-block__btn-wishlist btn--wishlist btn--quaternary btn--lg js_add_to_wishlist_link js_preventable_buy_action" title="Pas template aan"><i class="fa fa-th"></i> Pas template aan</a>');
        contentControls.append('<a href="http://localhost:8000/content.html?content=' + contentId + '" class="change-content btn buy-block__btn-wishlist btn--wishlist btn--quaternary btn--lg js_add_to_wishlist_link js_preventable_buy_action" title="Pas content aan"><i class="fa fa-edit"></i> Pas content aan</a>');

        rootElement.hover(function() {
          contentControls.show();
          rootElement.addClass("hover");
        }, function() {
          contentControls.hide();
          rootElement.removeClass("hover");
        })

        $(rootElementSelector + ' .show-more__button').click(function(event) {
          var parent = $(this).parent().parent().parent();
          if (parent.hasClass('active')) {
            parent.removeClass('active');
            event.preventDefault();
            parent.find('.show-more-holder').height('210px');
            parent.find('.js_link-less').hide();
            parent.find('.js_link-more').show();
          } else {
            parent.addClass('active');
            event.preventDefault();
            parent.find('.show-more-holder').height(parent.find('.description').height());
            parent.find('.js_link-less').show();
            parent.find('.js_link-more').hide();
          }

          $('html, body').animate({
              scrollTop: $(parent).offset().top
          }, 500);
        })
      })
    });
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

  getContentId = function() {
    var contentId = getURLParameter("content");
    if (!contentId || contentId=="undefined") contentId = setContentId();
    return contentId;
  }

  setContentId = function(contentId) {
    if (!contentId || contentId=="all") {
      contentId = "empty";
    } else {
      setURLParameter("content", contentId);
    }
    return contentId;
  }

  getTemplateId = function() {
    var templateId = getURLParameter("template");
    if (!templateId || templateId=="undefined") templateId = setTemplateId();
    return templateId;
  }

  setTemplateId = function(templateId) {
    if (!templateId) {
      templateId = "productbeschrijving-electronica";
    } else {
      setURLParameter("template", templateId);
    }
    return templateId;
  }

  getContentName = function() {
    var contentId = getContentId();
    return getContent().then(function(allContent){
      var contentItem = allContent[contentId];
      return contentItem.title;
    });
  }

  getTemplateItems = function() {
    return getTemplates().then(function(template){
      var templateArray = [];
      $.each(template, function(key, object) {
        templateArray.push({id: key, title: object.title, parent: object.parent ? object.parent : null});
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

  populateTemplateItems = function(templateId) {
    return getTemplateItems().then(function(templateItems){
      var templatesDropdown = $('#template-items');
      templatesDropdown.html("");

      templateItems.forEach(function (item) {
        templatesDropdown.append($("<option></option>")
            .attr("value", item.id)
            .text(item.title)
          );
      });

      templatesDropdown.val(templateId ? templateId : content.type);
    })
  }

  addTemplateToSectionDropdowns = function() {
    return getTemplateItems().then(function(templateItems){
      if (templateItems.length>0) {
        var mainTemplateId = $("#grid-editor").attr("data-template-id");
        var contentTypeDropdown = $('.content-type.dropdown-toggle');
        contentTypeDropdown.append($("<option disabled>___________________________</option>"));
        templateItems.forEach(function (item) {
          var disabled = (item.id == mainTemplateId) ? ' disabled="true"' : "";
          var title = item.parent ? "- " + item.title : item.title;
          contentTypeDropdown.append($("<option" + disabled + "></option>")
            .attr("value", "template-" + item.id)
            .text(title)
          );
        });

        $(".column .content-type.dropdown-toggle").each(function() {
          $(this).val($(this).parent().parent().attr("data-type"));
        })
      }
    })
  }

  populateContentItems = function(showEmptyItem) {
    return getContentItems(showEmptyItem).then(function(contentItems) {
      var contentDropdown = $('#preview-content');
      var contentSelect = $('#preview-content-select');

      var templateId = getTemplateId();
      var filteredContentItems = contentItems.filter(function(item) {
        return item.type === templateId || item.type === "all";
      })

      filteredContentItems.forEach(function (item) {
        contentDropdown.find('ul.dropdown-menu').append($('<li><a data-width="auto" title="' + item.id + '"><span>' + item.title + '</span></li>'));
        if (item.id===getContentId()) contentSelect.find('span').html(item.title);
      });

      contentDropdown.val(getContentId());
    })
  }

  createElement = function(element) {
    var panelId = "panel-" + element.id;
    var panelHeadingId = "panel-heading-" + element.id;
    var panelContentId = "panel-content-" + element.id;
    var collapseClass = (element.prio==1 || element.prio==2) ? "collapse in" : "collapse";
    var elementPanel = $(`<div class="panel-group">
      <div class="panel panel-default sub-panel" data-prio="` + element.prio + `">
        <div class="panel-heading" role="tab">
          <h4 class="panel-title">
            <a role="button" data-toggle="collapse" aria-expanded="true"></a>
          </h4>
        </div>
        <div class="panel-collapse ` + collapseClass + `" role="tabpanel">
          <div class="panel-body">
          </div>
        </div>
      </div>
    </div>`);

    var elementPanelHeading = elementPanel.find(".panel-heading");
    var elementPanelTitle = elementPanel.find(".panel-title a");
    var elementPanelContentHeading = elementPanel.find(".panel-collapse");
    var elementPanelContent = elementPanel.find(".panel-body");
    elementPanel.attr("id", panelId);
    elementPanelHeading.attr("id", panelHeadingId);
    elementPanelTitle.attr("data-parent", "#" + panelId);
    elementPanelTitle.attr("href", "#" + panelContentId);
    elementPanelTitle.attr("aria-controls", panelContentId);
    elementPanelContentHeading.attr("id", panelContentId);
    elementPanelContentHeading.attr("aria-labelledby", panelContentId);
    elementPanelTitle.html(element.title);

    var label = '<h4>' + element.title + '</h4>';
    var content = '<div id="element-' + element.id + '" class="form-group panel">';
    var type = element.type.substring(0, 9)=="template-" ? "template" : element.type;

    switch (type) {
      case "text":
        content += '<textarea class="form-control text" data-id="' + element.id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "rich-text":
        content += '<textarea class="form-control rich-text" data-id="' + element.id + '"data-type="' + element.type + '"></textarea>';
        break;
      case "list":
        content += '<textarea class="form-control list" data-id="' + element.id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "quote":
        content += '<div class="quote" data-id="' + element.id + '" data-type="' + element.type + '">';
        content += '<div class="row">';
        content += '<div class="col-md-9 form-group">';
        content += '<label for="' + element.id + '-content">Quote</label>';
        content += '<input id="' + element.id + '-content" class="form-control">';
        content += '</div>';
        content += '<div class="col-md-3 form-group">';
        content += '<label for="' + element.id + '-person">Gezegd door</label>';
        content += '<input id="' + element.id + '-person" class="form-control">';
        content += '</div>';
        break;
      case "image":
        content += '<select data-id="' + element.id + '" data-type="' + element.type + '"></select>';
        break;
      case "imagelist":
        content += '<select data-id="' + element.id + '" data-type="' + element.type + '" multiple="multiple"></select>';
        break;
      case "template":
        var templateId = element.type.substring(9);
        content += '<select data-id="' + element.id + '" data-type="' + element.type + '" data-template="' + templateId + '"></select>';
        populateContentDropdown(element.id, templateId);
        break;
      default:
        content += '<input class="form-control" data-id="' + element.id + '" data-type="' + element.type + '">';
    }

    content += "</div>"

    elementPanelContent.html(content);
    return elementPanel.html();
  }

  populateContentDropdown = function(id, templateId) {
    return getContentItems().then(function(contentItems) {

      var filteredContentItems = contentItems.filter(function(item) {
        return item.type === templateId || item.type === "all";
      })

      filteredContentItems.forEach(function (item) {
        $('select[data-id="' + id + '"]').append($("<option></option>")
            .attr("value", item.id)
            .text(item.title)
          );
      });
    })
  }

  populateImageList = function(element, templateId, selectedItemsJSON) {
    return $.getJSON("http://localhost:8888/images/" + templateId, function(images) {
      images.forEach(function(image) {
        element.append($("<option></option>")
            .attr("data-img-src", "/sample_content/images/" + templateId + "/" + image)
            .attr("value", image)
            .text(image)
          );
      });

      var selectedItems = isJson(selectedItemsJSON) ? JSON.parse(selectedItemsJSON) : selectedItemsJSON;
      if (selectedItems) element.val(selectedItems);
      $(element).imagepicker();
    })
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

  function isJson(str) {
      try {
          JSON.parse(str);
      } catch (e) {
          return false;
      }
      return true;
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

  getURLParameter = function(targetParameter) {
    var pageURL = window.location.search.substring(1);
    var urlVariables = pageURL.split('&');
    for (var i = 0; i < urlVariables.length; i++) {
      var parameter = urlVariables[i].split('=');
      if (parameter[0] == targetParameter) {
        return parameter[1];
      }
    }
  }

  setURLParameter = function(targetParameter, targetValue) {
    var pageURL = window.location.search.substring(1);
    var urlVariables = pageURL.split('&');
    var parameterFound = false;
    var parameterChanged = false;

    for (var i = 0; i < urlVariables.length; i++) {
      var parameter = urlVariables[i].split('=');
      if (parameter[0] == targetParameter) {
        if (parameter[0] != targetValue) {
          urlVariables[i] = parameter[0] + "=" + targetValue;
          parameterChanged = true;
        }
        parameterFound = true;
      }
    }

    if (!parameterFound) {
      urlVariables.push(targetParameter + "=" + targetValue);
      parameterChanged = true;
    }

    if (parameterChanged) {
      var parameterString = urlVariables.join("&");
      var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + parameterString;
      window.history.pushState({path:newurl},'',newurl);
    }
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
