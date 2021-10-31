const SITES_CONFIG = {
  names: [
    'mediamarkt',
    'xkom',
    'mediaexpert',
    'rtveuroagd',
    'morele',
  ],

  mediamarkt: {
    name: 'mediamarkt',
    separator: '+',
    priceTagFormatter: {
      ',-': '',
    },
    itemBoxesSelector: '.m-offerBox_content',
    itemNameSelector: '.b-ofr_headDataTitle',
    itemPriceSelector: '.m-priceBox_price',
    promotionListSelector: '.b-ofr_promoList',
    promotionSelector: '.b-ofr_promoListItem',
    pageUrl: (productSlug, priceMin, priceMax) => `https://mediamarkt.pl/search?sort=price_asc&limit=100&page=1&query%5Bmenu_item%5D=&query%5Bquerystring%5D=${productSlug}&priceFilter%5Bmin%5D=${priceMin}&priceFilter%5Bmax%5D=${priceMax}`
  },

  xkom: {
    name: 'xkom',
    separator: '%20',
    priceTagFormatter: {
      ' ': '',
      'zł': '',
      ',': '.',
    },
    itemBoxesSelector: '.sc-1yu46qn-4',
    itemNameSelector: '.irSQpN',
    itemPriceSelector: '.sc-6n68ef-3',
  
    pageUrl: (productSlug, priceMin, priceMax) => `https://www.x-kom.pl/szukaj?per_page=90&sort_by=price_asc&f%5Bprice%5D%5Bfrom%5D=${priceMin}&f%5Bprice%5D%5Bto%5D=${priceMax}&q=${productSlug}`
  },

  mediaexpert: {
    name: 'mediaexpert',
    separator: '%20',
    priceTagFormatter: {
      ' ': '',
      '\nzł': '',
      '\n': '.',
    },
    itemBoxesSelector: '#section_search-list-items .offers-list .offer-box',
    itemNameSelector: '.name > a',
    itemSinglePageNameSelector: '.name.is-title',
    itemPriceSelector: '.main-price',
    itemSinglePagePriceSelector: '.main-price',
    promotionListSelector: '.emblems.is-desktop',
    promotionSelector: '.emblem .content',
    pageUrl: (productSlug, priceMin, priceMax) => `https://www.mediaexpert.pl/search/?query%5Bmenu_item%5D=&query%5Bquerystring%5D=${productSlug}&priceFilter%5Bmin%5D=${priceMin}&priceFilter%5Bmax%5D=${priceMax}&limit=50&page=1&sort=price_asc`
  },

  rtveuroagd: {
    name: 'rtveuroagd',
    separator: '%20',
    priceTagFormatter: {
      ' ': '',
      'zł': '',
    },
    // cookieConsentSelector: '#onetrust-accept-btn-handler',
    itemBoxesSelector: '.product-main',
    itemNameSelector: '.product-name > a',
    itemPriceSelector: '.price-normal.selenium-price-normal',
    promotionListSelector: '.advertising-placement-listing',
    promotionSelector: '.promotion-block',
    pageUrl: (productSlug, priceMin, priceMax) => `https://www.euro.com.pl/search,d3,od${priceMin}do${priceMax}.bhtml?keyword=${productSlug}`
  },

  morele: {
    name: 'morele',
    separator: '%20',
    itemSinglePageNameSelector: '.prod-name',
    priceTagFormatter: {
      ' ': '',
      'zł': '',
      ',': '.',
    },
    itemBoxesSelector: '.cat-product-inside',
    itemNameSelector: '.cat-product-content .productLink',
    itemPriceSelector: '.price-new',
    itemSinglePagePriceSelector: '#product_price_brutto',
    pageUrl: (productSlug, priceMin, priceMax) => `https://www.morele.net/wyszukiwarka/0/0/${priceMin}.00,${priceMax}.00,,,,,,p,0,,,,/1/?q=${productSlug}`
  },
}

module.exports = SITES_CONFIG;