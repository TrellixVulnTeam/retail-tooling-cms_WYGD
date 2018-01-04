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
    var sectionShowMoreTemplate = `<div class="slot slot--description slot--seperated slot--seperated--has-more-content js_slot-description">
      <h2></h2>
      <div class="js_show-more-description show-more">
        <div class="js_show-more-holder show-more-holder show-more--l product-tracklists-show-more--animate">
          <div class="js_description_content js_show-more-content">
            <span id="loader" class="loader glyphicon glyphicon-refresh glyphicon-refresh-animate" style="display: none;"></span>
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
      <div class="product-description row">
      </div>
    </div>`;
    var elementTemplate = `<span><h3 data-title-element="true"></h3></span>`;
    
    productDescriptionContent.hide();
    loadTemplate(productDescriptionContent, templateType, 'productbeschrijving').then(function(template){
      loadContent(productId, productDescriptionContentSelector, '> span', '', preview ? "preview" : "live").then(function(content) {
        var replaceList = ["blockquote"];
        wrapWithParagraph(productDescriptionContentSelector, replaceList);

        productDescription.find('h3').before('<a href="http://localhost:8000/template.html?template=' + templateType + '" class="btn buy-block__btn-wishlist btn--wishlist btn--quaternary btn--lg js_add_to_wishlist_link js_preventable_buy_action" style="float: right; margin-top: -5px" title="Pas template aan"><i class="fa fa-th"></i></a>');
        productDescription.find('h3').before('<a href="http://localhost:8000/content.html?content=' + productId + '" class="btn buy-block__btn-wishlist btn--wishlist btn--quaternary btn--lg js_add_to_wishlist_link js_preventable_buy_action" style="float: right; margin-right: 10px; margin-top: -5px" title="Pas content aan"><i class="fa fa-edit"></i></a>');

        productDescriptionContent.show();
        productDescription.find(".loader").hide();
      })
    });

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
