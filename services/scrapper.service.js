const puppeteer = require('puppeteer');
const slugify = require('slugify');
const getItemTextFromHTMLElement = require('../utils/getItemTextFromHTMLElement.util');
const SITES_CONFIG = require('../constants/sites');
const e = require('express');

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

        promotion.name = stripWhitespaces(promotion.name);
        promotionsList.push(promotion);
      }
    }

    return promotionsList;
  }

  const isProductSlugIncluded = (productSlug, candidateProduct, separator) => {
    const productSlugList = productSlug.split(separator);
    const candidateProductList = candidateProduct.split(separator);
    for (const slug of productSlugList) {
      if (!candidateProductList.includes(slug)) {
        if (!isNaN(+slug) || !candidateProduct.includes(slug))
          return false;
      }
    }
    return true;
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

      const shopOptions = SITES_CONFIG[shopName];
      const productSlug = getSlug(productName, shopOptions.separator);
      let itemNameSelector = shopOptions.itemNameSelector; // some webpages redirect to the item page if no other items exist
      let isSinglePage = false;
      const pageURL = shopOptions.pageUrl(productSlug, priceMin, priceMax);

      try {
        await page.goto(pageURL, { waitUntil: 'networkidle2' });

        await page.waitForSelector('body');
        isSinglePage = page.url() !== pageURL;

        if (isSinglePage) {
          itemNameSelector = shopOptions.itemSinglePageNameSelector;
        }

        if (shopOptions.cookieConsentSelector) {
          await page.$eval(shopOptions.cookieConsentSelector, btn => btn.click());
          await page.waitForSelector('body');
        }
        const itemBoxes = isSinglePage ? [page] : await page.$$(shopOptions.itemBoxesSelector);

        for (const item of itemBoxes) {
          let name = await getItemTextFromHTMLElement(item, itemNameSelector);
          name = stripWhitespaces(name);

          const priceTag = await getItemTextFromHTMLElement(item, shopOptions.itemPriceSelector);
          const nameSlug = getSlug(name, shopOptions.separator);

          if (priceTag && isProductSlugIncluded(productSlug, nameSlug, shopOptions.separator)) {
            const price = parseFloat(formatString(priceTag, shopOptions.priceTagFormatter));

            const url = isSinglePage ? page.url() : await item.$eval(itemNameSelector, el => el.href);
            const promotions = await getPromotionsListForSingleItem(page, item, shopOptions.promotionListSelector, shopOptions.promotionSelector);

            candidateProducts.push({ shopName: shopOptions.name, name, price, url, promotions })
          }
        }

        const sortedProducts = candidateProducts.sort((a, b) => a.price - b.price);
        return sortedProducts;
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

    console.dir(concatenatedProductsArray, { depth: null });
    await browser.close();
  }

  return { scrapPages };

})();

const { scrapPages } = Scrapper;

scrapPages(SITES_CONFIG.names, 3000, 20000, "macbook air 13 256gb");