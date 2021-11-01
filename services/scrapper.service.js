/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const puppeteer = require('puppeteer');
const slugify = require('slugify');
const getItemTextFromHTMLElement = require('../utils/getItemTextFromHTMLElement.util');
const SITES_CONFIG = require('../constants/sites');
const PRODUCT_ALIASES = require('../constants/productAliases');
const AppError = require('./error.service');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');

const Scrapper = (() => {
  const getSlug = (name, separator) =>
    slugify(name, { replacement: separator, lower: true });

  const stripWhitespaces = (text) => text.replace(/(\r\n|\n|\r|\t)/gm, '');

  const formatString = (unformatted, tagFormatter) => {
    let formatted = unformatted;
    for (const [key, value] of Object.entries(tagFormatter)) {
      formatted = formatted.replace(key, value);
    }

    return formatted;
  };
  const getPromotionsListForSingleItem = async (
    page,
    item,
    promotionListSelector,
    promotionSelector
  ) => {
    const promotionsList = [];

    const promotionListElement = await item.$(promotionListSelector);

    if (promotionListElement) {
      const promotionElements = await promotionListElement.$$(
        promotionSelector
      );

      for (const promotionElement of promotionElements) {
        const promotion = await page.evaluate(
          (el) => ({ name: el.innerText, url: el.href }),
          promotionElement
        );

        if (promotion.name) {
          promotion.name = stripWhitespaces(promotion.name);
        }
        if (promotion.name || promotion.url) {
          promotionsList.push(promotion);
        }
      }
    }

    return promotionsList;
  };

  const getProductAlias = (productName) =>
    PRODUCT_ALIASES[productName] ? PRODUCT_ALIASES[productName] : productName;

  const isProductSlugIncluded = (productSlug, candidateProduct, separator) => {
    const productSlugList = productSlug.split(separator);
    const candidateProductList = candidateProduct.split(separator);

    for (const slug of productSlugList) {
      const slugAlias = getSlug(getProductAlias(slug), separator);

      if (
        !candidateProductList.includes(slug) &&
        !candidateProductList.includes(slugAlias)
      ) {
        if (!(+slug).isNan() || !candidateProductList.join('').includes(slug)) {
          let isItemIncludedAsString = false;
          for (const product of candidateProductList) {
            if (product.includes(slug) || product.includes(slugAlias)) {
              isItemIncludedAsString = true;
            }
          }
          if (!isItemIncludedAsString) return false;
        }
      }
    }
    return true;
  };

  const checkProductCoupon = async (product) => {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=1200,800'],
    });
    const page = await browser.newPage();
    const shopOptions = SITES_CONFIG[product.shop].productSelectors;
    const {
      addToBasketButtonSelector,
      additionalBasketSelectors,
      couponInputSelector,
      couponActivateSelector,
      priceTagSelector,
    } = shopOptions;

    page.setDefaultNavigationTimeout(60000);
    await page.setViewport({
      width: 1200,
      height: 800,
    });
    await page.goto(product.url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('body');
    console.log('before button selection');
    await page.waitForSelector(addToBasketButtonSelector);
    await new Promise((r) => setTimeout(r, 3000));

    const btn = await page.$(addToBasketButtonSelector);
    console.log(btn);

    await btn.evaluate((el) => el.click());
    console.log('after button selector');

    for (const basketSelector of additionalBasketSelectors) {
      await new Promise((r) => setTimeout(r, 7000));
      await page.waitForSelector(basketSelector);
      console.log(basketSelector);
      await page.$eval(basketSelector, (el) => el.click());
    }
    console.log('test');
    await page.waitForSelector(couponInputSelector);
    // const couponInput = await page.$eval(couponInputSelector, el => el.value = coupon);
    // await page.$eval(couponInputSelector, el => el.type(product.coupon))
    await new Promise((r) => setTimeout(r, 3000));
    console.log('pressing!');
    const couponInput = await page.$(couponInputSelector);
    await couponInput.click();
    await couponInput.press('Backspace');
    await couponInput.type(product.coupon);
    await new Promise((r) => setTimeout(r, 5000));

    const priceTag = await page.$(priceTagSelector);
    const priceTagBefore = await priceTag.evaluate((price) => price.innerText);
    await new Promise((r) => setTimeout(r, 5000));

    console.log('clicking!');
    await page.$eval(couponActivateSelector, (el) => el.click(), {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('body');
    await page.waitForSelector(priceTagSelector);

    await new Promise((r) => setTimeout(r, 5000));
    await page.waitForSelector(priceTagSelector);

    const priceTagAfter = await page.$eval(
      priceTagSelector,
      (price) => price.innerText
    );

    console.log(`before: ${priceTagBefore}, after: ${priceTagAfter}`);

    await browser.close();
  };

  const scrapPages = async (shops, priceMin, priceMax, productName) => {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const scrapSinglePage = async (shopName) => {
      const candidateProducts = [];
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(60000);

      const shopOptions = SITES_CONFIG[shopName].shopSelectors;
      const { separator } = SITES_CONFIG[shopName];
      const { priceTagFormatter } = SITES_CONFIG[shopName];
      const productSlug = getSlug(productName, separator);
      let { itemNameSelector } = shopOptions; // some webpages redirect to the item page if no other items exist
      let { itemPriceSelector } = shopOptions; // some webpages redirect to the item page if no other items exist
      let isSinglePage = false;
      const pageURL = shopOptions.pageUrl(productSlug, priceMin, priceMax);

      try {
        await page.goto(pageURL, { waitUntil: 'networkidle2' });

        await page.waitForSelector('body');
        isSinglePage =
          page.url() !== pageURL &&
          shopOptions.itemSinglePageNameSelector !== undefined;

        if (isSinglePage) {
          if (await page.$(shopOptions.itemSinglePageNameSelector)) {
            itemNameSelector = shopOptions.itemSinglePageNameSelector;

            if (shopOptions.itemSinglePagePriceSelector) {
              itemPriceSelector = shopOptions.itemSinglePagePriceSelector;
            }
          } else {
            isSinglePage = false;
          }
        }

        const itemBoxes = isSinglePage
          ? [page]
          : await page.$$(shopOptions.itemBoxesSelector);

        for (const item of itemBoxes) {
          let name = await getItemTextFromHTMLElement(item, itemNameSelector);
          name = stripWhitespaces(name);

          const priceTag = await getItemTextFromHTMLElement(
            item,
            itemPriceSelector
          );
          const nameSlug = getSlug(name, separator);

          if (
            priceTag &&
            isProductSlugIncluded(productSlug, nameSlug, separator)
          ) {
            const price = parseFloat(formatString(priceTag, priceTagFormatter));

            const url = isSinglePage
              ? page.url()
              : await item.$eval(itemNameSelector, (el) => el.href);
            const promotions = shopOptions.promotionListSelector
              ? await getPromotionsListForSingleItem(
                  page,
                  item,
                  shopOptions.promotionListSelector,
                  shopOptions.promotionSelector
                )
              : [];

            candidateProducts.push({
              shopName: shopOptions.name,
              name,
              price,
              url,
              promotions,
            });
          }
        }

        return candidateProducts;
      } catch (err) {
        return new AppError(
          'ScrapperError',
          HTTP_STATUS_CODES.INTERNAL_SERVER,
          'The scrapper got some issues!'
        );
      }
    };

    const shopsPromisesArray = shops.map(
      (shop) => new Promise((resolve) => resolve(scrapSinglePage(shop)))
    );
    const arrayOfShopsArrays = await Promise.all(shopsPromisesArray);

    const concatenatedProductsArray = [];
    for (const array of arrayOfShopsArrays) {
      concatenatedProductsArray.push(...array);
    }

    const sortedProducts = concatenatedProductsArray.sort(
      (a, b) => a.price - b.price
    );
    // console.dir(sortedProducts, { depth: null });
    await browser.close();

    return sortedProducts;
  };

  return { scrapPages, checkProductCoupon };
})();

module.exports = Scrapper;
// const { scrapPages } = Scrapper;

const { checkProductCoupon } = Scrapper;

// const product = {
//   url: 'https://mediamarkt.pl/telefony-i-smartfony/smartfon-samsung-galaxy-a52s-5g-6gb-128gb-czarny-sm-a528bzkdeue',
//   coupon: '50za500KLUB',
//   shop: 'mediamarkt'
// }

// const prod2 = {
//   url: 'https://www.x-kom.pl/p/654050-telewizor-60-69-samsung-qe65qn90a.html',
//   shop: 'xkom',
//   coupon: 'prezent'
// }

// const prod3 = {
//   url: 'https://www.mediaexpert.pl/agd-do-zabudowy/piekarniki-do-zabudowy/piekarnik-amica-ed37219x-x-type',
//   shop: 'mediaexpert',
//   coupon: 'HALLOWEEN'
// }
// const prod4 = {
//   url: 'https://www.euro.com.pl/telewizory-led-lcd-plazmowe/panasonic-tx-55hz1000e-tv-oled.bhtml',
//   shop: 'rtveuroagd',
//   coupon: 'HD011121'
// }
const prod5 = {
  url: 'https://www.morele.net/klawiatura-corsair-k70-rgb-mk-2-low-profile-ch-9109018-na-5615766/?_gl=1*1eioavc*_ga*NDMyNzg3MDAzLjE2MzU2MTE0OTI.*_ga_Z6RQKBMET4*MTYzNTc2MTUzMC40LjEuMTYzNTc2MTU1MS4zOQ..&_ga=2.15483702.1420137474.1635611492-432787003.1635611492',
  shop: 'morele',
  coupon: 'CORS21',
};

checkProductCoupon(prod5);
// scrapPages(SITES_CONFIG.names, 3000, 20000, "macbook air M1 16gb");
