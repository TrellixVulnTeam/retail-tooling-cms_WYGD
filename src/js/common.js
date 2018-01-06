(function($) {
  saveTemplate = function(templateId, templateTitle, html, templateLink) {
    var template = {title: templateTitle, content: {}, link: templateLink};
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
        var colClasses = $.grep(col.className.split(" "), function(v, i){
          return v.indexOf('col-') === 0;
        }).join(" ");
        elementCount++;

        templateElements[id] = {title: title, type: contentType, class: colClasses, sort: elementCount};
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
            var elementId = $(this).attr('data-id');
            var elementType = $(this).attr('data-type');
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

  loadTemplate = function(formElement, templateId, subElement, sectionTemplates, elementTemplate, contentSelector) {
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
          if (!section.type) section.type = "basic";

          var panel = sectionTemplates ? $(sectionTemplates[section.type]).clone() : $('<div class="row"></div>');
          panel.attr("id", section.id);
          panel.attr("data-id", section.id);
          panel.attr("data-title", section.title);
          panel.attr("data-type", section.type);

          if (sectionTemplates) {
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
          var htmlElement = $("#" + element.id);
          if (htmlElement) {
            formElement += createElement(element.id, element);
          } else {
            console.log(element.id + " not found");
          }
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
              var selector = subElement && subElement!=null ? (rootElementId + ' [data-id="' + elementId + '"] ' + subElement) : (rootElementId + ' [data-id="' + elementId + '"]');
              var htmlElement = $(selector);

              if (htmlElement[0]) {
                var value = getObjectById(content, elementId);
                if (!value) value = placeholder;
                switch (element.type) {
                  case "quote":
                    if (viewType=="live" || viewType=="preview") {
                      // value="<p>" + value + "</p>";
                      var html = convertMarkdownToHtml(value);

                      htmlElement.val(convertMarkdownToHtml(value));
                      htmlElement.html(convertMarkdownToHtml(value));
                    } else {
                      var html = convertMarkdownToHtml(value);

                      var quote = $(html).filter('blockquote').find('p').html();
                      if (!quote) quote = value;
                      htmlElement.find("#" + elementId + "-content").val(quote);
                      htmlElement.find("#" + elementId + "-content").html(quote);

                      var person = $(html).find('person').html();
                      htmlElement.find("#" + elementId + "-person").val(person);
                      htmlElement.find("#" + elementId + "-person").html(person);
                      break;
                    }
                  case "text":
                  case "rich-text":
                    htmlElement.val(convertMarkdownToHtml(value));
                    htmlElement.html(convertMarkdownToHtml(value));
                    break;
                  case "image":
                  case "imagelist":
                    populateImageList(htmlElement, template.id, value);
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
                    if (element.type.substring(0, 9)=="template-") {
                      htmlElement.val(value);
                    } else {
                      htmlElement.val(value);
                      htmlElement.html(value);
                    }
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

  setShopMainTemplate = function() {
    $('#product_title').append('<a id="edit-page-template" href="http://localhost:8000/template.html?template=pdp" class="review__btn-write-review" style="float: right" title="Pas template aan"><i class="fa fa-th"></i> Pas pagina-template aan</a>');
  }

  setShopElementContent = function(elementSelector, templateId, productId) {
    if (getURLParameter("content")) productId = setProductId(getURLParameter("content"));

    var preview = getURLParameter("preview") && getURLParameter("preview")!='undefined' ? true : false;

    var sectionCollapsibleTemplate = `<div class="slot slot--description slot--seperated slot--seperated--has-more-content js_slot-description">
      <h2 data-title-element="true"></h2>
      <div class="js_show-more-description show-more">
        <div class="js_show-more-holder show-more-holder show-more--l product-tracklists-show-more--animate">
          <div class="description row">
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

    var sectionTemplate = `<div class="slot slot--description slot--seperated">
      <h2 data-title-element="true"></h2>
      <div class="description row">
      </div>
    </div>`;

    var elementTemplate = `<span><h3 data-title-element="true"></h3></span>`;

    var element = $(elementSelector);
    var elementContentSlug = ' .description';
    var elementContent = $(elementSelector + " " + elementContentSlug);
    element.html('<div><span id="loader" class="loader glyphicon glyphicon-refresh glyphicon-refresh-animate"></span></div>');

    var contentControls = $('<div class="content-controls slot slot--seperated"></div>');
    element.before(contentControls);
    contentControls.append('<a href="http://localhost:8000/template.html?template=' + templateId + '" class="btn buy-block__btn-wishlist btn--wishlist btn--quaternary btn--lg js_add_to_wishlist_link js_preventable_buy_action" title="Pas template aan"><i class="fa fa-th"></i> Pas template aan</a>');
    contentControls.append('<a href="http://localhost:8000/content.html?content=' + productId + '" class="btn buy-block__btn-wishlist btn--wishlist btn--quaternary btn--lg js_add_to_wishlist_link js_preventable_buy_action" title="Pas content aan"><i class="fa fa-edit"></i> Pas content aan</a>');

    var sectionTemplates = {"basic": sectionTemplate, "collapsible": sectionCollapsibleTemplate};
    loadTemplate(element, templateId, null, sectionTemplates, elementTemplate, elementContentSlug).then(function(template){
      loadContent(productId, elementSelector, 'span', null, preview ? "preview" : "live").then(function(content) {
        // var replaceList = ["blockquote"];
        // wrapWithParagraph(elementSelector, replaceList);

        $(elementSelector + ' .show-more__button').click(function(event) {
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

  populateTemplateItems = function() {
    return getTemplateItems().then(function(templateItems){
      templateItems.forEach(function (item) {
        $('#template-items').append($("<option></option>")
            .attr("value", item.id)
            .text(item.title)
          );
      });

      $("#template-items").val(getTemplateId());
    })
  }

  addTemplateToSectionDropdowns = function() {
    return getTemplateItems().then(function(templateItems){
      if (templateItems.length>0) {
        var mainTemplateId = $("#grid-editor").attr("data-template-id");
        var dropdown = $('.content-type.dropdown-toggle');
        dropdown.append($("<option disabled>___________________________</option>"));
        templateItems.forEach(function (item) {
          var disabled = (item.id == mainTemplateId) ? ' disabled="true"' : "";
          var title = item.parent ? "- " + item.title : item.title;
          dropdown.append($("<option" + disabled + "></option>")
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
    var label = '<h4>' + element.title + '</h4>';
    // var content = '<div class="form-group" data-id="' + element.id + '">';
    var content = '<div class="form-group">';
    var type = element.type.substring(0, 9)=="template-" ? "template" : element.type;

    switch (type) {
      case "text":
        content += label;
        content += '<textarea class="form-control text" data-id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "rich-text":
        content += label;
        content += '<textarea class="form-control rich-text" data-id="' + id + '"data-type="' + element.type + '"></textarea>';
        break;
      case "list":
        content += label;
        content += '<textarea class="form-control list" data-id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "quote":
        content += '<div class="quote" data-id="' + id + '" data-type="' + element.type + '">';
        content += '<div class="row">';
        content += '<div class="col-md-12"><h4>' + element.title + '</h4></div>'
        content += '</div>';
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
        content += label;
        content += '<select data-id="' + id + '" data-type="' + element.type + '"></select>';
        // content += '<input class="form-control" data-id="' + id + '" data-type="' + element.type + '">';
        break;
      case "imagelist":
        content += label;
        content += '<select data-id="' + id + '" data-type="' + element.type + '" multiple="multiple"></select>';
        // populateImageList(id, templateId);
        // content += '<textarea class="form-control imagelist" data-id="' + id + '" data-type="' + element.type + '"></textarea>';
        // content += '<div data-id="' + id + '" data-type="' + element.type + '"></div>';
        break;
      case "template":
        var templateId = element.type.substring(9);
        content += label;
        content += '<select data-id="' + id + '" data-type="' + element.type + '" data-template="' + templateId + '"></select>';
        populateContentDropdown(id, templateId);
        break;
      default:
        content += label;
        content += '<input class="form-control" data-id="' + id + '" data-type="' + element.type + '">';
        // content += '<div data-id="' + id + '" data-type="' + element.type + '"></div>';
    }

    content += "</div>"
    return content;
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
