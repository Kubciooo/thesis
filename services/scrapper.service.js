const puppeteer = require('puppeteer');
const slugify = require('slugify');
const getItemTextFromHTMLElement = require('../utils/getItemTextFromHTMLElement.util');
const SITES_CONFIG = require('../constants/sites');
const PRODUCT_ALIASES = require('../constants/productAliases');

const Scrapper = (() => {
  const getSlug = (name, separator) => slugify(name, { replacement: separator, lower: true });

  const stripWhitespaces = text => text.replace(/(\r\n|\n|\r|\t)/gm, "");

  const formatString = (unformatted, tagFormatter) => {
    let formatted = unformatted;
    for (const [key, value] of Object.entries(tagFormatter)) {
      formatted = formatted.replace(key, value);
    }

    return formatted;
  }
  const getPromotionsListForSingleItem = async (page, item, promotionListSelector, promotionSelector) => {
    const promotionsList = [];

    const promotionListElement = await item.$(promotionListSelector);

    if (promotionListElement) {
      const promotionElements = await promotionListElement.$$(promotionSelector);

      for (const promotionElement of promotionElements) {
        const promotion = await page.evaluate(el => ({ name: el.innerText, url: el.href }), promotionElement);

        if (promotion.name) {
          promotion.name = stripWhitespaces(promotion.name);
        }
        if (promotion.name || promotion.url) {
          promotionsList.push(promotion);
        }
      }
    }

    return promotionsList;
  }

  const getProductAlias = productName => PRODUCT_ALIASES[productName] ? PRODUCT_ALIASES[productName] : productName;

  const isProductSlugIncluded = (productSlug, candidateProduct, separator) => {
    const productSlugList = productSlug.split(separator);
    const candidateProductList = candidateProduct.split(separator);

    for (const slug of productSlugList) {
      const slugAlias = getSlug(getProductAlias(slug), separator);

      if (!candidateProductList.includes(slug) && !candidateProductList.includes(slugAlias)) {
        if (!isNaN(+slug) || !candidateProductList.join('').includes(slug)) {
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
  }

  const checkProductCoupon = async (product) => {
    const browser = await puppeteer.launch(
      {
        headless: false
      }
    );
    const page = await browser.newPage();
    const shopOptions = SITES_CONFIG[product.shop].productSelectors;
    const {
      addToBasketButtonSelector,
      additionalBasketSelectors,
      couponInputSelector,
      couponActivateSelector,
      priceTagSelector
    } = shopOptions;

    page.setDefaultNavigationTimeout(60000);
    await page.goto(product.url, { waitUntil: 'networkidle2' });

    await page.waitForSelector(addToBasketButtonSelector);
    console.log('before button selection');
    await page.waitForSelector(addToBasketButtonSelector);

    await page.$eval(addToBasketButtonSelector, el => el.click());
    console.log('after button selector');


    for (basketSelector of additionalBasketSelectors) {
      await page.waitForSelector(basketSelector);
      await page.$eval(basketSelector, el => el.click());
    }
    console.log('test');
    await page.waitForSelector(couponInputSelector);
    // const couponInput = await page.$eval(couponInputSelector, el => el.value = coupon);
    // await page.$eval(couponInputSelector, el => el.type(product.coupon))
    await page.type(couponInputSelector, product.coupon)
    // await couponInput.click();
    // await page.keyboard.type(product.coupon);

    const priceTagBefore = await page.$eval(priceTagSelector, el => el.innerText);
    await page.$eval(couponActivateSelector, el => el.click());

    await page.waitForSelector('body');
    await page.waitForSelector(priceTagSelector);
    const priceTagAfter = await page.$eval(priceTagSelector, el => el.innerTxext);

    console.log(`before: ${priceTagBefore}, after: ${priceTagAfter}`);

    // await browser.close();
  }

  const scrapPages = async (shops, priceMin, priceMax, productName) => {
    const browser = await puppeteer.launch(
      {
        headless: false
      }
    );

    const scrapSinglePage = async (shopName) => {
      const candidateProducts = [];
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(60000);

      const shopOptions = SITES_CONFIG[shopName].shopSelectors;
      const separator = SITES_CONFIG[shopName].separator;
      const priceTagFormatter = SITES_CONFIG[shopName].priceTagFormatter;
      const productSlug = getSlug(productName, separator);
      let itemNameSelector = shopOptions.itemNameSelector; // some webpages redirect to the item page if no other items exist
      let itemPriceSelector = shopOptions.itemPriceSelector; // some webpages redirect to the item page if no other items exist
      let isSinglePage = false;
      const pageURL = shopOptions.pageUrl(productSlug, priceMin, priceMax);

      try {
        await page.goto(pageURL, { waitUntil: 'networkidle2' });

        await page.waitForSelector('body');
        isSinglePage = page.url() !== pageURL && shopOptions.itemSinglePageNameSelector !== undefined;

        if (isSinglePage) {
          if ((await page.$(shopOptions.itemSinglePageNameSelector))) {
            itemNameSelector = shopOptions.itemSinglePageNameSelector;

            if (shopOptions.itemSinglePagePriceSelector) {
              itemPriceSelector = shopOptions.itemSinglePagePriceSelector;
            }
          } else {
            isSinglePage = false;
          }
        }

        const itemBoxes = isSinglePage ? [page] : await page.$$(shopOptions.itemBoxesSelector);

        for (const item of itemBoxes) {
          let name = await getItemTextFromHTMLElement(item, itemNameSelector);
          name = stripWhitespaces(name);

          const priceTag = await getItemTextFromHTMLElement(item, itemPriceSelector);
          const nameSlug = getSlug(name, separator);

          if (priceTag && isProductSlugIncluded(productSlug, nameSlug, separator)) {
            const price = parseFloat(formatString(priceTag, priceTagFormatter));

            const url = isSinglePage ? page.url() : await item.$eval(itemNameSelector, el => el.href);
            const promotions = shopOptions.promotionListSelector ? await getPromotionsListForSingleItem(page, item, shopOptions.promotionListSelector, shopOptions.promotionSelector) : [];

            candidateProducts.push({ shopName: shopOptions.name, name, price, url, promotions })
          }
        }

        return candidateProducts;
      } catch (err) {
        throw err;
      }
    }

    const shopsPromisesArray = shops.map(shop => new Promise((resolve, reject) => resolve(scrapSinglePage(shop))));
    const arrayOfShopsArrays = await Promise.all(shopsPromisesArray);

    const concatenatedProductsArray = [];
    for (const array of arrayOfShopsArrays) {
      concatenatedProductsArray.push(...array);
    }

    const sortedProducts = concatenatedProductsArray.sort((a, b) => a.price - b.price);
    // console.dir(sortedProducts, { depth: null });
    await browser.close();

    return sortedProducts;
  }

  return { scrapPages, checkProductCoupon };

})();

module.exports = Scrapper;
// const { scrapPages } = Scrapper;

const { checkProductCoupon } = Scrapper;

const product = {
  url: 'https://mediamarkt.pl/rtv-i-telewizory/telewizor-samsung-ue75au8002k',
  coupon: '50za500KLUB',
  shop: 'mediamarkt'
}

checkProductCoupon(product)
// scrapPages(SITES_CONFIG.names, 3000, 20000, "macbook air M1 16gb");