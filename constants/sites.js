const SITES_CONFIG = {
  names: ['mediamarkt', 'xkom', 'mediaexpert', 'rtveuroagd', 'morele'],

  mediamarkt: {
    name: 'mediamarkt',
    actionsDelay: 7000,
    separator: '+',
    priceTagFormatter: {
      ',-': '',
    },
    shopSelectors: {
      itemBoxesSelector: '.m-offerBox_content',
      itemNameSelector: '.b-ofr_headDataTitle',
      itemPriceSelector: '.m-priceBox_price',
      promotionListSelector: '.b-ofr_promoList',
      promotionSelector: '.b-ofr_promoListItem',
      pageUrl: (productSlug, priceMin, priceMax) =>
        `https://mediamarkt.pl/search?sort=price_asc&limit=100&page=1&query%5Bmenu_item%5D=&query%5Bquerystring%5D=${productSlug}&priceFilter%5Bmin%5D=${priceMin}&priceFilter%5Bmax%5D=${priceMax}`,
    },
    productSelectors: {
      startingPriceSelector: '.main-price.is-big',
      addToBasketButtonSelector:
        '.spark-button.add-button.is-primary.is-medium.icon-left.show-price-button',
      additionalBasketSelectors: [
        '.select .ui-radio .inner',
        'label.js-discountCode_toggleTrigger',
      ],
      couponInputSelector: '#cart_flow_type_promo_coupon',
      couponActivateSelector: '#js-promo-submit',
      priceTagSelector: '#js-cartTotal',
    },
  },

  xkom: {
    name: 'xkom',
    actionsDelay: 2000,
    separator: '%20',
    priceTagFormatter: {
      ' ': '',
      zł: '',
      ',': '.',
    },
    shopSelectors: {
      itemBoxesSelector: '.sc-1yu46qn-4',
      itemNameSelector: '.irSQpN',
      itemPriceSelector: '.sc-6n68ef-3',
      pageUrl: (productSlug, priceMin, priceMax) =>
        `https://www.x-kom.pl/szukaj?per_page=90&sort_by=price_asc&f%5Bprice%5D%5Bfrom%5D=${priceMin}&f%5Bprice%5D%5Bto%5D=${priceMax}&q=${productSlug}`,
    },
    productSelectors: {
      startingPriceSelector: '.n4n86h-4.edNVst',
      productOutOfStockSelector: '.sc-12cu01r-5.cjNyNK',
      addToBasketButtonSelector: 'button[title="Dodaj do koszyka"]',
      additionalBasketSelectors: [
        'a.sc-1h16fat-0.sc-1v4lzt5-11.emnmDG.sc-153gokr-0.jRbixD',
        'button.sc-15ih3hi-0.h0yxm6-2.gamchB',
      ],
      couponInputSelector: 'input.sc-67avig-1',
      couponActivateSelector: 'button.sc-15ih3hi-0.sc-67avig-2.fdviAh',
      priceTagSelector: '.pvj85d-3',
    },
  },

  mediaexpert: {
    name: 'mediaexpert',
    actionsDelay: 2000,
    separator: '%20',
    priceTagFormatter: {
      ' ': '',
      '\nzł': '',
      '\n': '.',
    },
    shopSelectors: {
      itemBoxesSelector: '#section_search-list-items .offers-list .offer-box',
      itemNameSelector: '.name > a',
      itemSinglePageNameSelector: '.name.is-title',
      itemPriceSelector: '.main-price',
      itemSinglePagePriceSelector: '.main-price',
      promotionListSelector: '.emblems.is-desktop',
      promotionSelector: '.emblem .content',
      pageUrl: (productSlug, priceMin, priceMax) =>
        `https://www.mediaexpert.pl/search/?query%5Bmenu_item%5D=&query%5Bquerystring%5D=${productSlug}&priceFilter%5Bmin%5D=${priceMin}&priceFilter%5Bmax%5D=${priceMax}&limit=50&page=1&sort=price_asc`,
    },
    productSelectors: {
      startingPriceSelector: '.main-price',
      productOutOfStockSelector: '.check-and-buy',
      addToBasketButtonSelector: '.add-to-cart',
      additionalBasketSelectors: [
        '.precart-main.has-background .close .icon.icon-x02',
      ],
      couponInputSelector: 'input[placeholder="Kod rabatowy"]',
      couponActivateSelector:
        '.spark-button.submit.is-secondary.is-default.icon-left',
      priceTagSelector: '.price.is-little',
    },
  },

  rtveuroagd: {
    name: 'rtveuroagd',
    separator: '%20',
    actionsDelay: 2000,
    priceTagFormatter: {
      ' ': '',
      zł: '',
    },
    // cookieConsentSelector: '#onetrust-accept-btn-handler',
    shopSelectors: {
      itemBoxesSelector: '.product-main',
      itemNameSelector: '.product-name > a',
      itemPriceSelector: '.price-normal.selenium-price-normal',
      promotionListSelector: '.advertising-placement-listing',
      promotionSelector: '.promotion-block',
      pageUrl: (productSlug, priceMin, priceMax) =>
        `https://www.euro.com.pl/search,d3,od${priceMin}do${priceMax}.bhtml?keyword=${productSlug}`,
    },
    productSelectors: {
      startingPriceSelector: '.product-price',
      addToBasketButtonSelector: '.add-product-to-cart',
      additionalBasketSelectors: [
        '#onetrust-accept-btn-handler',
        '#warranty-encouragement > button',
        '.go-to-basket',
        'button[title="Usuń kod rabatowy"]',
      ],
      couponInputSelector: '#voucherInput',
      couponActivateSelector: 'button[title="Zastosuj kod rabatowy"]',
      priceTagSelector: '.summary-value.selenium-O-total-price',
    },
  },

  morele: {
    name: 'morele',
    actionsDelay: 1000,
    separator: '%20',
    priceTagFormatter: {
      ' ': '',
      zł: '',
      ',': '.',
    },
    shopSelectors: {
      itemSinglePageNameSelector: '.prod-name',
      itemBoxesSelector: '.cat-product-inside',
      itemNameSelector: '.cat-product-content .productLink',
      itemPriceSelector: '.price-new',
      itemSinglePagePriceSelector: '#product_price_brutto',
      pageUrl: (productSlug, priceMin, priceMax) =>
        `https://www.morele.net/wyszukiwarka/0/0/${priceMin}.00,${priceMax}.00,,,,,,p,0,,,,/1/?q=${productSlug}`,
    },
    productSelectors: {
      startingPriceSelector: '.product-price',
      addToBasketButtonSelector: '.add-to-cart__btn',
      additionalBasketSelectors: [
        '.js_no-warrant-btn',
        '.show-basket',
        '.discount.change-to-input',
      ],
      couponInputSelector: 'input[name="discount"]',
      couponActivateSelector: '#promoCodeBtn',
      priceTagSelector: '.summary-box-price b',
    },
  },
};

module.exports = SITES_CONFIG;
