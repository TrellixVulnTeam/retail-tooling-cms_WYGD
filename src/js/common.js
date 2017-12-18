(function($) {
  saveTemplate = function(html) {
    var template = {};
    var elementCount = 0;

    $(html).filter('.row').each(function() {
      var row = this;
      var templateElements = {};
      var rowTitle = $(row).attr("data-title") ? $(row).attr("data-title") : "";
      var rowId = rowTitle.toLowerCase().replace(" ", "-");

      $(row).find('.column').each(function() {
        elementCount++;
        var col = this;
        var id = col.id;
        var title = $(col).attr("data-title") ? $(col).attr("data-title") : "";
        var contentType = $(col).attr("data-type") ? $(col).attr("data-type") : "";//getContentTypeFromClass(col);
        var colClasses = $.grep(col.className.split(" "), function(v, i){
          return v.indexOf('col-') === 0;
        }).join(" ");
        templateElements[id] = {title: title, type: contentType, class: colClasses};
      })

      template[rowId] = {title: $(row).attr("data-title"), elements: templateElements};
    })

    // console.log(template);
    return setTemplates(template);
    // return template;
  }

  resetSampleTemplate = function() {
    return $.getJSON("sample-template.json", function(data) {
      console.log("Template reset completed");
      setTemplates(data);
    });
  }

  resetSampleContent = function() {
    return $.getJSON("sample-content.json", function(data) {
      console.log("Content reset completed");
      setContent(data);
    });
  }

  // saveSampleContent = function(contentElement, reset, configOptions) {
  //   if (reset) setContent({});
  //   var content = getContent();
  //   if (!configOptions) configOptions = {};
  //   configOptions.contentFormat = "html";
  //
  //   $(contentElement).children().each(function() {
  //     content[this.id] = {};
  //     content[this.id].title = $(this).attr("data-title");
  //     content[this.id].content = parseContent($(this), configOptions);
  //   })
  //
  //   // console.log(content);
  //   setContent(content);
  //   return content;
  // }
  //
  saveContent = function(contentElement, configOptions) {
    return getContent(configOptions.isPreview).then(function(allContent){
      var content = parseContent(contentElement, configOptions);
      var contentId = getContentId();

      if (!allContent[contentId]) allContent[contentId] = {};
      allContent[contentId].content = content;
      // console.log(allContent);

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
          elementCount++;
          var id = this.id ? this.id : contentType + "-" + elementCount;
          var content = (contentFormat=="object") ? $(this).val() : $(this).html();
          // if (typeof content != "string" && $(content)[0].hasAttribute("data-ge-content-type")) {
          //   // content = $(content).val();
          //   content = $(content).html();
          // }
          content = content.replace(/\r?\n|\r/g,"").trim();
          templateElements[id] = {content: content};
        });
      })
      sectionElements[row.id] = {elements: templateElements};
    })

    return sectionElements;
  }

  loadTemplate = function(formElement) {
    return getTemplates().then(function(templates) {
      $(formElement).html("");

      $.each(templates, function(sectionId, section) {
        var panel = $('<div class="row"></div>');
        panel.attr("id", sectionId);
        panel.attr("data-title", section.title);

        $.each(section.elements, function(elementId, element) {
          var elementHtml = $('<div></div>');
          elementHtml.attr("id", elementId);
          elementHtml.attr("data-title", element.title);
          elementHtml.attr("data-type", element.type);
          elementHtml.addClass(element.class);
          elementHtml.addClass("column");
          elementHtml.addClass("content-" + element.type);
          elementHtml.append("<span></span>");
          panel.append(elementHtml);
        })
        $(formElement).append(panel);
        // console.log($(formElement));
      })
    });
  }

  loadTemplateInContentEditor = function(form, panelTemplate) {
    return getTemplates().then(function(templates){
      $.each(templates, function(sectionId, section) {
        var panel = panelTemplate.clone();
        var panelTitle = $(panel).find(".panel-title")[0];
        var panelContent = $(panel).find(".panel-body")[0];
        var formElement = '';

        panel.attr("id", sectionId);
        panel.addClass("section");
        panelTitle.innerHTML = section.title;

        $.each(section.elements, function(elementId, element) {
          formElement += '<div class="form-group" data-id="' + elementId + '">';
          var htmlElement = $("#" + elementId);
          if (htmlElement) {
            formElement += '<label for="' + elementId + '">' + element.title + '</label>';
            formElement += createElement(elementId, element);
          } else {
            console.log(elementId + " not found");
          }
          formElement += '</div>';
        })

        panelContent.innerHTML = formElement;
        form.append(panel);
      })
    })
  }

  loadContent = function(rootElementId, subElement, placeholder, isPreview) {
    var contentId = getContentId();
    return getContent(isPreview).then(function(allContent){
      return getTemplates().then(function(templates){
        var content = allContent[contentId];
        if (placeholder==undefined) placeholder = ""
        $(rootElementId).attr("data-title", content.title);

        $.each(templates, function(sectionId, section) {
          $.each(section.elements, function(elementId, element) {
            var htmlElement = subElement && subElement!=null ? $(rootElementId + " #" + elementId + " > " + subElement) : $(rootElementId + " #" + elementId);
            if (htmlElement[0]) {
              var contentElement = getObjectById(content, elementId);
              var value = contentElement ? contentElement.content : placeholder;
              switch (element.type) {
                case "image":
                  htmlElement.html(value);
                  break;
                case "quote":
                case "text":
                case "rich-text":
                  htmlElement.val(value);
                  htmlElement.html(value);
                  break;
                default:
                  htmlElement.html(value);
              }
            }
          })
        })
      })
      // return setContentId(contentId);
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
    var content = isPreview ? localStorage.getItem("previewContent") : localStorage.getItem("content");
    var contentItems = {};

    return db.collection("content").get().then(function(querySnapshot) {
        querySnapshot.forEach(function(content) {
            // console.log(content.id, " => ", content.data());
            contentItems[content.id] = content.data();
        });
        return contentItems;
    });
  }

  setContent = function(content, isPreview) {
    var jsonOutput = JSON.stringify(content);

    if (isPreview) {
      localStorage.setItem("previewContent", jsonOutput);
    } else {
      localStorage.setItem("content", jsonOutput);

      var batch = db.batch();
      $.each(content, function(contentKey, contentObject) {
        var contentRef = db.collection("content").doc(contentKey);
        batch.set(contentRef, contentObject);
      })

      return batch.commit()
      .then(function() {
          // console.log("Document successfully updated!");
      })
      .catch(function(error) {
          console.error("Error updating document: ", error);
      });
    }
  }

  getTemplates = function(isPreview) {
    var templates = isPreview ? localStorage.getItem("previewTemplates") : localStorage.getItem("templates");

    var templateRef = db.collection("templates").doc("description");
    return templateRef.get().then(function(template) {
        if (template.exists) {
            // console.log("Document data:", template.data());
            return template.data()
        } else {
            console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });

    return templates ? JSON.parse(templates) : {};
  }

  setTemplates = function(templates, isPreview) {
    var jsonOutput = JSON.stringify(templates);
    if (isPreview) {
      localStorage.setItem("previewTemplates", jsonOutput);
    } else {
      localStorage.setItem("templates", jsonOutput);

      var templateRef = db.collection("templates").doc("description");

      return templateRef.set(templates)
      // db.collection("templates").add(templates)
      .then(function() {
          console.log("Document successfully updated!");
          return templates;
      })
      .catch(function(error) {
          // The document probably doesn't exist.
          console.error("Error updating document: ", error);
      });
    }
  }

  getContentId = function() {
    var contentId = localStorage.getItem("selectedContentId");
    if (!contentId) contentId = setContentId();
    return contentId;
  }

  setContentId = function(contentId) {
    // console.log("setContentId");
    // console.log(contentId);
    // if (contentId=="empty") {
    //   localStorage.removeItem("selectedContentId");
    // } else {
      localStorage.setItem("selectedContentId", contentId);
    // }
    return localStorage.getItem("selectedContentId");
  }

  getContentName = function() {
    var contentId = getContentId();
    return getContent().then(function(allContent){
      var contentItem = allContent[contentId];
      return contentItem.title;
    });
  }

  getContentItems = function(showEmptyItem) {
    if (showEmptyItem==undefined) showEmptyItem = false;
    return getContent().then(function(content){
      var templateArray = [];
      $.each(content, function(key, object) {
        if (showEmptyItem || key!="empty") templateArray.push({id: key, title: object.title});
      })

      templateArray.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });

      return templateArray;
    })
  }

  populateContentItems = function(showEmptyItem) {
    return getContentItems(showEmptyItem).then(function(contentItems){
      contentItems.forEach(function (item) {
        $('#content-items').append($("<option></option>")
                    .attr("value", item.id)
                    .text(item.title)
                  );
        $('#preview-content ul.dropdown-menu').append($('<li><a data-width="auto" title="' + item.id + '"><span>' + item.title + '</span></li>'));
      });

      $("#content-items").val(getContentId());
    })
  }

  createElement = function(id, element) {
    var content = "";

    switch (element.type) {
      case "text":
      // htmlElement[0].innerHTML = '<div class="ge-content ge-content-type-tinymce" data-ge-content-type="tinymce">' + element.content + '</div>';
        content = '<textarea class="form-control text" id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "rich-text":
      // htmlElement[0].innerHTML = '<div class="ge-content ge-content-type-tinymce" data-ge-content-type="tinymce">' + element.content + '</div>';
        content = '<textarea class="form-control rich-text" id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      case "quote":
        content = '<textarea class="form-control blockquote" id="' + id + '" data-type="' + element.type + '"></textarea>';
        break;
      // case "blockquote":
      //   content = '<textarea class="form-control blockquote" id="' + id + '" data-type="' + element.type + '"></textarea>';
      //   break;
      case "image":
        // content = '<textarea class="form-control blockquote" id="' + id + '"></textarea>';
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
    // return $(element).attr("data-type") ? $(element).attr("data-type") : "";
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

  function getObjectById(obj, key) {
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (i==key) {
          return obj[i];
        } else if (typeof obj[i] == 'object') {
          var resultObject = getObjectById(obj[i], key);
          if (resultObject && typeof resultObject=="object") {
            return resultObject;
          }
        }
    }
  }

  function getUrlParams( prop ) {
    var params = {};
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );

    definitions.forEach( function( val, key ) {
        var parts = val.split( '=', 2 );
        params[ parts[ 0 ] ] = parts[ 1 ];
    } );

    return ( prop && prop in params ) ? params[ prop ] : params;
  }

})(jQuery);
