setContent = function(templateType, productId) {
  $('#product_title').append('<a id="edit-page-template" href="http://localhost:8000/template.html?template=pdp" class="review__btn-write-review" style="float: right" title="Pas template aan">Pas pagina-template aan</a>');
  $('#product_title').append('<a id="switch-layout" href="#" class="btn buy-block__btn-wishlist btn--wishlist btn--quaternary btn--lg js_add_to_wishlist_link js_preventable_buy_action" style="float: right; margin-right: 10px" title="Switch template"><i class="fa fa-refresh"></i></a>');

  var productSpecificaties = $('.slot--main-specs');

  var productDescriptionSlug = '.slot--description';
  var productDescription = $(productDescriptionSlug);
  var productDescriptionContentSlug = ' .product-description';
  var productDescriptionContentSelector = productDescriptionSlug + ' ' + productDescriptionContentSlug;
  var productDescriptionContent = productDescription.find(productDescriptionContentSlug);
  productDescriptionContent.before('<span id="loader" class="loader glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>');

  if (getURLParameter("content")) productId = setProductId(getURLParameter("content"));

  if (productId) {
    var preview = getURLParameter("preview") && getURLParameter("preview")!='undefined' ? true : false;

    productDescriptionContent.hide();
    loadTemplate(productDescriptionContent, templateType, 'productbeschrijving').then(function(template){
      loadContent(productId, productDescriptionContentSelector, '> span', '', preview ? "preview" : "live").then(function(content) {
        var replaceList = ["blockquote"];
        wrapWithParagraph(productDescriptionContentSelector, replaceList);

        productDescription.find('h2').before('<a href="http://localhost:8000/template.html?template=' + templateType + '" class="review__btn-write-review" style="float: right; margin-top: -5px" title="Pas template aan">Pas template aan</a>');
        productDescription.find('h2').before('<a href="http://localhost:8000/content.html?content=' + productId + '" class="review__btn-write-review" style="float: right; margin-right: 10px; margin-top: -5px" title="Pas content aan">Pas content aan</a>');

        productDescriptionContent.show();
        productDescription.find(".loader").hide();
      })
    });

    var sectionTemplate = `<div class="slot slot--brandinfo js_slot-brandinfo slot--seperated">
      <h2 data-title-element="true"></h2>
      <div class="product-description row">
      </div>
    </div>`;

    var elementTemplate = `<span><h3 data-title-element="true"></h3></span>`;

    var otherContentId = 'other-content';
    var otherContentSelector = "#" + otherContentId;
    var otherContent = $('<div id="' + otherContentId + '" style="display: none"></div>').insertAfter(productDescription);
    loadTemplate(otherContent, templateType, null, sectionTemplate, elementTemplate, '.product-description').then(function(template){
      loadContent(productId, otherContentSelector, 'span', null, preview ? "preview" : "live").then(function(content) {
        var replaceList = ["blockquote"];
        wrapWithParagraph(productDescriptionContentSelector, replaceList);

        $('#other-content div[data-id="productbeschrijving"]').remove();
        if (otherContent.children().length==0) $('#other-content').remove();
        otherContent.show();
      })
    });
  } else {
    $(".loader").hide();
  }

  $('.js_show-more-description.show-more .show-more__button').click(function(event) {
    var parent = $(this).parent().parent().parent();
    if (parent.hasClass('active')) {
      parent.removeClass('active');
      event.preventDefault();
      parent.find('.product-tracklists-show-more--animate').height('210px');
      parent.find('.js_link-less').hide();
      parent.find('.js_link-more').show();
    } else {
      parent.addClass('active');
      event.preventDefault();
      parent.find('.product-tracklists-show-more--animate').height(parent.find('.product-description').height());
      parent.find('.js_link-less').show();
      parent.find('.js_link-more').hide();
    }

    $('html, body').animate({
        scrollTop: $(parent).offset().top
    }, 500);
  })
}
