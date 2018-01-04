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
