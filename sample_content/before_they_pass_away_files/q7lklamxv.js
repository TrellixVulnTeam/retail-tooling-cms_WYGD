



/* ControlTag Loader for bol.com 9b1146f5-d41b-414a-8be8-209cad212d3c */
(function(w, cs) {
  
  if (/Twitter for iPhone/.test(w.navigator.userAgent || '')) {
    return;
  }

  var debugging = /kxdebug/.test(w.location);
  var log = function() {
    
    debugging && w.console && w.console.log([].slice.call(arguments).join(' '));
  };

  var load = function(url, callback) {
    log('Loading script from:', url);
    var node = w.document.createElement('script');
    node.async = true;  
    node.src = url;

    
    node.onload = node.onreadystatechange = function () {
      var state = node.readyState;
      if (!callback.done && (!state || /loaded|complete/.test(state))) {
        log('Script loaded from:', url);
        callback.done = true;  
        callback();
      }
    };

    
    var sibling = w.document.getElementsByTagName('script')[0];
    sibling.parentNode.insertBefore(node, sibling);
  };

  var config = {"app":{"name":"krux-scala-config-webservice","version":"3.32.4","schema_version":3},"confid":"q7lklamxv","context_terms":[],"publisher":{"name":"bol.com","active":true,"uuid":"9b1146f5-d41b-414a-8be8-209cad212d3c","version_bucket":"stable","id":2016},"params":{"link_header_bidder":false,"site_level_supertag_config":"site","recommend":false,"control_tag_pixel_throttle":100,"fingerprint":false,"optout_button_optout_text":"Browser Opt Out","user_data_timing":"load","use_central_usermatch":true,"store_realtime_segments":false,"tag_source":false,"link_hb_start_event":"ready","optout_button_optin_text":"Browser Opt In","first_party_uid":false,"link_hb_timeout":2000,"link_hb_adserver_subordinate":true,"optimize_realtime_segments":false,"link_hb_adserver":"dfp","target_fingerprint":false,"prioritized_segments":false,"context_terms":false,"optout_button_id":"kx-optout-button","dfp_premium":false,"control_tag_namespace":"bolcom","controltag_use_proxy":false},"prioritized_segments":[],"realtime_segments":[{"id":"r7ulxdwq6","test":["and",["and",["or",["intersects","$page_attr_pageInfo.pageType",["mhp"]]]]]},{"id":"rxqc9rboj","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_4:,",["smartphones"]]]]]},{"id":"rxqdhjrvu","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_2:,",["studie & management"]]]]]},{"id":"rl9zydva5","test":["and",["and",["or",["intersects","$page_attr_pageInfo.pageType",["lp","pdp"]]],["and",["contains","$page_attr_productInfo.categoryTreeList:|",["boeken"]]]]]},{"id":"rxqmspds5","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_4:,",["smartphones"]]],["and",["intersects","$page_attr_productInfo.brand:,",["apple","apple iphone"]]]]]},{"id":"scmq737by","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_2:,",["verschonen & verzorgen"]]]]]},{"id":"rrkb7v66t","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_1:,",["mooi & gezond"]]]]]},{"id":"ryimn7koq","test":["and",["and",["or",["intersects","$page_attr_pageInfo.pageType",["lp","pdp"]]],["and",["intersects","$page_attr_productInfo.category_level_4:,",["smartphones"]]]]]},{"id":"rxqm5dv04","test":["and",["and",["or",["intersects","$user_attr_",[]]]]]},{"id":"rzhctgcg3","test":["and",["and",["or",["intersects","$page_attr_pageInfo.pageType",["zakelijk-zakelijkverkopen"]]]]]},{"id":"scmqdmkvo","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_2:,",["spellen"]],["intersects","$user_segments",["rhi1iqywf"]]]]]},{"id":"rxqnp6tnl","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_4:,",["smartphones"]]],["and",["intersects","$page_attr_productInfo.brand:,",["apple","apple iphone","samsung","samsung galaxy s7"]]]]]},{"id":"r2dg95tvy","test":["or",["and",["or",["intersects","$page_attr_productInfo.category_level_3:,",["koelen & vriezen","koeling","koelkasten","vriezers"]]]],["and",["or",["intersects","$page_attr_productInfo.category_level_4:,",["amerikaanse koelkasten","inbouw koel/vriescombinaties","inbouw koelkasten","kastmodel koelkasten","koel/vriescombinaties","koelkasten","koelkastonderdelen & accessoires","mini koelkasten","tafelmodel koelkasten"]]]]]},{"id":"rzc8nu2z2","test":["and",["and",["or",["intersects","$page_attr_productInfo.category_level_3:,",["zonbescherming"]]]]]}],"services":{"userdata":"//cdn.krxd.net/userdata/get","contentConnector":"//connector.krxd.net/content_connector","stats":"//apiservices.krxd.net/stats","optout":"//cdn.krxd.net/userdata/optout/status","event":"//beacon.krxd.net/event.gif","set_optout":"https://consumer.krxd.net/consumer/optout","data":"//beacon.krxd.net/data.gif","link_hb_stats":"//beacon.krxd.net/link_bidder_stats.gif","userData":"//cdn.krxd.net/userdata/get","link_hb_mas":"//link.krxd.net/hb","config":"//cdn.krxd.net/controltag/{{ confid }}.js","social":"//beacon.krxd.net/social.gif","addSegment":"//cdn.krxd.net/userdata/add","pixel":"//beacon.krxd.net/pixel.gif","um":"https://usermatch.krxd.net/um/v2","controltag":"//cdn.krxd.net/ctjs/controltag.js.{hash}","click":"//apiservices.krxd.net/click_tracker/track","stats_export":"//beacon.krxd.net/controltag_stats.gif","userdataApi":"//cdn.krxd.net/userdata/v1/segments/get","cookie":"//beacon.krxd.net/cookie2json","proxy":"//cdn.krxd.net/partnerjs/xdi","is_optout":"//beacon.krxd.net/optout_check","impression":"//beacon.krxd.net/ad_impression.gif","transaction":"//beacon.krxd.net/transaction.gif","log":"//jslog.krxd.net/jslog.gif","set_optin":"https://consumer.krxd.net/consumer/optin","usermatch":"//beacon.krxd.net/usermatch.gif"},"experiments":[],"site":{"name":"Bol.com","cap":255,"id":1643292,"organization_id":2016,"uid":"q7lklamxv"},"tags":[{"id":21768,"name":"Technographic Data provider tag","content":null,"target":null,"target_action":"append","timing":"onload","method":"apply","priority":null,"template_replacement":true,"internal":true,"criteria":["and",["and",["and",["<=","$frequency",3]]]]},{"id":21769,"name":"Krux Geographic Data provider tag","content":null,"target":null,"target_action":"append","timing":"onload","method":"apply","priority":null,"template_replacement":true,"internal":true,"criteria":["and",["and",["and",["<=","$frequency",3]]]]},{"id":29418,"name":"Custom DataLayer Ingester","content":null,"target":null,"target_action":"append","timing":"onload","method":"apply","priority":null,"template_replacement":true,"internal":true,"criteria":[]},{"id":22091,"name":"Standard DTC","content":null,"target":null,"target_action":"append","timing":"onready","method":"apply","priority":null,"template_replacement":true,"internal":true,"criteria":[]}],"usermatch_tags":[{"id":6,"name":"Google User Match","content":"<script>\n(function() {\n  if (Krux('get', 'user') != null) {\n      new Image().src = 'https://usermatch.krxd.net/um/v2?partner=google';\n  }\n})();\n</script>","target":null,"target_action":"append","timing":"onload","method":"document","priority":1,"template_replacement":false,"internal":true,"criteria":[]}],"link":{"adslots":{},"bidders":{}}};
  
  for (var i = 0, tags = config.tags, len = tags.length, tag; (tag = tags[i]); ++i) {
    if (String(tag.id) in cs) {
      tag.content = cs[tag.id];
    }
  }

  
  var esiGeo = String(function(){/*
   <esi:include src="/geoip_esi"/>
  */}).replace(/^.*\/\*[^{]+|[^}]+\*\/.*$/g, '');

  if (esiGeo) {
    log('Got a request for:', esiGeo, 'adding geo to config.');
    try {
      config.geo = w.JSON.parse(esiGeo);
    } catch (__) {
      
      log('Unable to parse geo from:', config.geo);
      config.geo = {};
    }
  }



  var proxy = (window.Krux && window.Krux.q && window.Krux.q[0] && window.Krux.q[0][0] === 'proxy');

  if (!proxy || true) {
    

  load('//cdn.krxd.net/ctjs/controltag.js.c3e8e6311e44dfc4f051e4a261784fa1', function() {
    log('Loaded stable controltag resource');
    Krux('config', config);
  });

  }

})(window, (function() {
  var obj = {};
  
    
    obj['21768'] = function() {
      // this tag is intentionally blank

    };
  
    
    obj['21769'] = function() {
      
    };
  
    
    obj['29418'] = function() {
      (function() {
    var _kx = window.Krux,
        pixelFired = false,
        currency = '€';
    _kx('onOnce:pixel', function() { pixelFired = true; });

    function scrapeDL() {
        if (window.Krux && window.Krux.taxonomy) {
            if (window.Krux.taxonomy.productInfo && window.Krux.taxonomy.productInfo.length > 0) {
                for (var i = 0; i < window.Krux.taxonomy.productInfo.length; i++) {
                    var tmp_cat = [];
                    window.Krux.taxonomy.productInfo[i].category_level_1 = [];
                    window.Krux.taxonomy.productInfo[i].category_level_2 = [];
                    window.Krux.taxonomy.productInfo[i].category_level_3 = [];
                    window.Krux.taxonomy.productInfo[i].category_level_4 = [];
                    window.Krux.taxonomy.productInfo[i].category_level_5 = [];

                    if (window.Krux.taxonomy.productInfo[i].categoryTreeList && window.Krux.taxonomy.productInfo[i].categoryTreeList.length > 0) {
                        for (var j = 0; j < window.Krux.taxonomy.productInfo[i].categoryTreeList.length; j++) {
                            window.Krux.taxonomy.productInfo[i].category_level_1.push(Krux.taxonomy.productInfo[i].categoryTreeList[j][0]);
                            window.Krux.taxonomy.productInfo[i].category_level_2.push(Krux.taxonomy.productInfo[i].categoryTreeList[j][1]);
                            window.Krux.taxonomy.productInfo[i].category_level_3.push(Krux.taxonomy.productInfo[i].categoryTreeList[j][2]);
                            window.Krux.taxonomy.productInfo[i].category_level_4.push(Krux.taxonomy.productInfo[i].categoryTreeList[j][3]);
                            window.Krux.taxonomy.productInfo[i].category_level_5.push(Krux.taxonomy.productInfo[i].categoryTreeList[j][4]);
                            tmp_cat.push(window.Krux.taxonomy.productInfo[i].categoryTreeList[j].join());
                        }
                    }
                    window.Krux.taxonomy.productInfo[i].categoryTreeList = tmp_cat.join('|');
                }
            }

            var dataObj = _kx('scrape.js_global', 'Krux.taxonomy'),
                userKeys = 'userInfo',
                omitKeys = 'price$,hashedOrderId,categoryTotalsList.total,totalPrice,categoryTreeListDELIM',
                custDelimit = 'categoryTreeList',
                prefix = 'undefined_',
                config = {
                    'userKeys': userKeys ? userKeys.split(',') : undefined,
                    'omitKeys': omitKeys ? omitKeys.split(',') : [],
                    'customDelimited': custDelimit ? custDelimit.split(',') : undefined,
                    'caseSensitive': 'true' === 'true',
                    'useFullPath': 'true' === 'true',
                    'useLastValue': 'false' === 'true',
                    'convertAttrNames': []
                };
            if (!prefix.match(/^$|null|undefined|false/)) {
                config.convertAttrNames.push({
                    pattern: /((?:page|user)_attr_)/,
                    replacement: '$1' + prefix
                });
            }
            if (_kx('scrape.js_global', 'Krux.taxonomy.orderInfo.hashedOrderId')) {
                config.convertAttrNames.push({
                    pattern: /productInfo/,
                    replacement: 'orderProductInfo'
                });
            }

            config.omitKeys.push(/gtm\./);
            _kx('ingestDataLayer', dataObj, config);

            /* ########################################### */
            /* Start - Setting four different price ranges */
            /* ########################################### */
            var rangeTool = _kx('require:util').numberToRangeBucket;
            var putItInABucket = function(p) {
                var range = '';

                if (p <= 10) {
                    range = rangeTool(p, 1);
                } else if (p <= 50) {
                    range = rangeTool(p, 5);
                } else if (p <= 100) {
                    range = rangeTool(p, 10);
                } else if (p <= 200) {
                    range = rangeTool(p, 25);
                } else if (p <= 500) {
                    range = rangeTool(p, 50);
                } else if (p <= 1000) {
                    range = rangeTool(p, 100);
                } else if (p <= 2000) {
                    range = rangeTool(p, 250);
                } else if (p <= 5000) {
                    range = rangeTool(p, 500);
                } else if (p <= 10000) {
                    range = rangeTool(p, 1000);
                } else if (p > 10000) {
                    range = '10000-999999';
                }
                return range;
            };
            if (window.Krux.taxonomy.productInfo) {
                window.Krux.taxonomy.productInfo.forEach(function(p) {
                    var range = putItInABucket(p.price),
                        attribute_name = (_kx('scrape.js_global', 'Krux.taxonomy.orderInfo.hashedOrderId') ? 'ord_price' : 'price');

                    _kx('append', 'page_attr_' + attribute_name + '_range_all', currency + range);
                    _kx('append', 'page_attr_' + attribute_name + '_range_500', currency + rangeTool(p.price, 10, 0, 500));
                    _kx('append', 'page_attr_' + attribute_name + '_range_1000', currency + rangeTool(p.price, 50, 0, 1000));
                    _kx('append', 'page_attr_' + attribute_name + '_range_5000', currency + rangeTool(p.price, 100, 0, 5000));
                });
            }
            if (window.Krux.taxonomy.orderInfo && window.Krux.taxonomy.orderInfo.totalPrice) {
                var totalPrice = window.Krux.taxonomy.orderInfo.totalPrice,
                    range = putItInABucket(totalPrice);
                _kx('set', 'page_attr_totalPrice_range_all', currency + range);
                _kx('set', 'page_attr_totalPrice_range_500', currency + rangeTool(totalPrice, 10, 0, 500));
                _kx('set', 'page_attr_totalPrice_range_1000', currency + rangeTool(totalPrice, 50, 0, 1000));
                _kx('set', 'page_attr_totalPrice_range_5000', currency + rangeTool(totalPrice, 100, 0, 5000));
            }
            if (window.Krux.taxonomy.orderInfo && window.Krux.taxonomy.orderInfo.categoryTotalsList) {
                window.Krux.taxonomy.orderInfo.categoryTotalsList.forEach(function(p) {
                    var range = currency + putItInABucket(p.total),
                        range_500 = currency + rangeTool(p.total, 10, 0, 500),
                        range_1000 = currency + rangeTool(p.total, 50, 0, 1000),
                        range_5000 = currency + rangeTool(p.total, 100, 0, 5000);
                    _kx('append', 'page_attr_total_range_all', range);
                    _kx('append', 'page_attr_total_range_500', range_500);
                    _kx('append', 'page_attr_total_range_1000', range_1000);
                    _kx('append', 'page_attr_total_range_5000', range_5000);
                    _kx('append', 'page_attr_category_total_all', p.categoryName + ' - ' + range);
                    _kx('append', 'page_attr_category_total_500', p.categoryName + ' - ' + range_500);
                    _kx('append', 'page_attr_category_total_1000', p.categoryName + ' - ' + range_1000);
                    _kx('append', 'page_attr_category_total_5000', p.categoryName + ' - ' + range_5000);
                });
            }
            /* ########################################### */
            /* End - Setting four different price ranges   */
            /* ########################################### */

            if (pixelFired) {
                _kx('require:pixel').send('', false);
            }
            clearInterval(interval);
        }
    }

    var interval = setInterval(scrapeDL, 100);
})();
    };
  
    
    obj['22091'] = function() {
      (function(){
    
    Krux('scrape',{'page_attr_url_path_1':{'url_path':'1'}});
    Krux('scrape',{'page_attr_url_path_2':{'url_path':'2'}});
    Krux('scrape',{'page_attr_url_path_3':{'url_path':'3'}});
    Krux('scrape',{'page_attr_meta_keywords':{meta_name:'keywords'}});
    var domain = Krux('scrape',{'page_attr_domain':{url_domain: '2'}}).page_attr_domain;
    if(domain.match(/^com?\./)){
         Krux('scrape',{'page_attr_domain':{url_domain: '3'}});
    }
})();
    };
  
  return obj;
})());
