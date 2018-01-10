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
