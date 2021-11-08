/* eslint-disable no-restricted-globals */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const getItemTextFromHTMLElement = require('../utils/getItemTextFromHTMLElement.util');
const isProductSlugIncluded = require('../utils/isProductSlugIncluded.util');
const getSlug = require('../utils/getSlug.util');
const SITES_CONFIG = require('../constants/sites');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const AppError = require('./error.service');
const Product = require('../models/product.model');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const Scrapper = (() => {
  const waitRandomTime = async (page, time) => {
    const timeFrom = time;
    const timeTo = time * 1.5;
    await page.waitForTimeout(Math.floor(Math.random() * timeTo) + timeFrom);
  };

  const sleep = async (time) => {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };

  const stripWhitespaces = (text) => {
    let replaced = text.replace(/(\r\n|\n|\r|\t)/gm, '');
    replaced = replaced.replace('[  \t]+', '');
    return replaced;
  };

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

  const checkProductPrice = async (product) => {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 0,
      args: [
        '--window-size=1400,900',
        '--remote-debugging-port=9222',
        '--remote-debugging-address=0.0.0.0', // You know what your doing?
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--blink-settings=imagesEnabled=true',
      ],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto(product.url, {
      waitUntil: 'domcontentloaded',
    });
    await waitRandomTime(page, 1000);
    const shopOptions = SITES_CONFIG[product.shop].productSelectors;
    const { priceTagFormatter } = SITES_CONFIG[product.shop];

    const { startingPriceSelector } = shopOptions;
    const startingPrice = await page.$eval(
      startingPriceSelector,
      (el) => el.innerText
    );

    let price = -1;
    if (startingPrice) {
      price = formatString(startingPrice, priceTagFormatter);
    }

    browser.close();
    return price;
  };

  /**
   * @param {Object} product - product object with shop, url and coupon properties
   * @returns [priceBefore, priceAfter] - price before adding the coupon and after adding the coupon
   */
  const checkProductCoupon = async (product, coupon) => {
    const browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      slowMo: 0,
      args: [
        '--window-size=1400,900',
        '--remote-debugging-port=9222',
        '--remote-debugging-address=0.0.0.0', // You know what your doing?
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--blink-settings=imagesEnabled=true',
      ],
    });
    const page = await browser.newPage();
    const shopOptions = SITES_CONFIG[product.shop].productSelectors;
    const actionDelay = SITES_CONFIG[product.shop].actionsDelay;
    const { priceTagFormatter } = SITES_CONFIG[product.shop];

    const {
      addToBasketButtonSelector,
      productOutOfStockSelector,
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

    if (productOutOfStockSelector) {
      const btnProductOutOfStock = await page.$(productOutOfStockSelector);
      if (btnProductOutOfStock) {
        return [-1, -1000];
      }
    }

    await page.waitForSelector(addToBasketButtonSelector);
    await waitRandomTime(page, actionDelay);

    const btn = await page.$(addToBasketButtonSelector);

    await btn.evaluate((el) => el.click());

    for (const basketSelector of additionalBasketSelectors) {
      await waitRandomTime(page, actionDelay);
      await page.waitForSelector(basketSelector);
      await page.$eval(basketSelector, (el) => el.click());
    }

    await page.waitForSelector(couponInputSelector);
    await waitRandomTime(page, actionDelay);

    const couponInput = await page.$(couponInputSelector);

    await couponInput.click();
    await couponInput.press('Backspace');
    await couponInput.type(coupon, { delay: 10 });
    await waitRandomTime(page, actionDelay);

    const priceTag = await page.$(priceTagSelector);
    const priceTagBefore = await priceTag.evaluate((price) => price.innerText);
    await waitRandomTime(page, actionDelay);

    await page.$eval(couponActivateSelector, (el) => el.click(), {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('body');
    await page.waitForSelector(priceTagSelector);
    await page.waitForTimeout(5 * actionDelay);

    const priceTagAfter = await page.$eval(
      priceTagSelector,
      (price) => price.innerText
    );

    const priceBefore = parseFloat(
      formatString(priceTagBefore, priceTagFormatter)
    );
    const priceAfter = parseFloat(
      formatString(priceTagAfter, priceTagFormatter)
    );

    await browser.close();
    return [priceBefore, priceAfter];
  };

  const scrapPages = async (shops, priceMin, priceMax, productName) => {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 0,
      args: [
        '--window-size=1400,900',
        '--remote-debugging-port=9222',
        '--remote-debugging-address=0.0.0.0', // You know what your doing?
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--blink-settings=imagesEnabled=true',
      ],
    });

    const scrapSinglePage = async (shopName, shopId, shopCategory) => {
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
        await page.goto(pageURL, { waitUntil: 'domcontentloaded' });

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
              shop: shopId,
              categories: [shopCategory],
              name,
              price,
              url,
              otherPromotions: promotions,
            });
          }
        }
        await page.close();
        return candidateProducts;
      } catch (err) {
        console.log(err);
        return new AppError(
          'ScrapperError',
          HTTP_STATUS_CODES.INTERNAL_SERVER,
          `The scrapper got some issues while parsing ${shopName} with ${shopName}!`
        );
      }
    };

    const shopsPromisesArray = shops.map(
      (shop) =>
        new Promise((resolve) =>
          resolve(scrapSinglePage(shop.name, shop.id, shop.category))
        )
    );
    const arrayOfShopsArrays = await Promise.all(shopsPromisesArray);
    const concatenatedProductsArray = [];
    for (const array of arrayOfShopsArrays) {
      if (array) {
        concatenatedProductsArray.push(...array);
      }
    }

    const sortedProducts = concatenatedProductsArray.sort(
      (a, b) => a.price - b.price
    );

    // console.dir(sortedProducts, { depth: null });
    await browser.close();

    return sortedProducts;
  };

  const updateAllProductsFromDB = async () => {
    console.log('Starting DB update...');
    const products = await Product.find({}).populate('shop');
    console.log(`Found products: ${products.length}`);

    for (const product of products) {
      console.log(`Scrapping product ${product.url} ...`);
      await sleep(3000);
      let newProductSnapshot;
      const workingCoupons = [];
      let minPrice = 999999999;

      if (product.coupons.length > 0) {
        for (const coupon of product.coupons) {
          await sleep(5000);
          const [priceBefore, priceAfter] = await checkProductCoupon(
            {
              name: product.name,
              url: product.url,
              shop: product.shop.name,
            },
            coupon
          );
          if (priceBefore !== priceAfter && priceAfter < minPrice) {
            minPrice = priceAfter;
            workingCoupons.push(coupon);
          }
        }
        newProductSnapshot = {
          price: minPrice,
          coupons: workingCoupons,
          otherPromotions: [],
          updatedAt: Date.now(),
        };
      } else {
        const price = await checkProductPrice({
          url: product.url,
          name: product.name,
          shop: product.shop.name,
        });

        minPrice = price;

        newProductSnapshot = {
          price,
          coupons: [],
          otherPromotions: [],
          updatedAt: Date.now(),
        };
      }

      await Product.findByIdAndUpdate(product._id, {
        price: minPrice === 999999999 ? product.price : minPrice,
        coupons: workingCoupons,
        $push: { snapshots: newProductSnapshot },
      });

      console.log('Added new snapshot');
    }
  };

  return {
    scrapPages,
    checkProductCoupon,
    checkProductPrice,
    updateAllProductsFromDB,
  };
})();

module.exports = Scrapper;
