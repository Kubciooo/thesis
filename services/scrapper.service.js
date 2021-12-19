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

/**
 * Scrapper Service
 */
const Scrapper = (() => {
  /**
   * Funkcja, która zatrzymuje wykonywanie skryptów przez Puppeteer na określony czas
   * @param {Page} page - Obiekt Page zawierający stronę, na której ma zostać wykonany skrypt
   * @param {Double} time - czas w milisekundach
   */
  const waitRandomTime = async (page, time) => {
    const timeFrom = time;
    const timeTo = time * 1.5;
    await page.waitForTimeout(Math.floor(Math.random() * timeTo) + timeFrom);
  };

  /**
   * Funkcja usuwająca spacje z początku i końca stringa
   * @param {String} text - string, z którego mają zostać usunięte spacje
   * @returns text - string bez spacji na początku i końcu
   */
  const stripWhitespaces = (text) => {
    let replaced = text.replace(/(\r\n|\n|\r|\t)/gm, '');
    replaced = replaced.replace('[  \t]+', '');
    return replaced;
  };

  /**
   * Funkcja podmieniające wszystkie tagi w teksćie na podane w argumencie
   * @param {*} unformatted - tekst do zmiany
   * @param {*} tagFormatter - tag do podmiany
   * @returns formatted - tekst z podmienionym tagiem
   */
  const formatString = (unformatted, tagFormatter) => {
    let formatted = unformatted;
    for (const [key, value] of Object.entries(tagFormatter)) {
      formatted = formatted.replace(key, value);
    }

    return formatted;
  };

  /**
   * Funkcja zwracająca listę promocji dla danego produktu
   * @param {Page} page - instancja Page zawierająca stronę do przeglądania
   * @param {HTMLElement} item - element HTML zawierający informacje o produkcie
   * @param {String} promotionListSelector - selektor listy promocji
   * @param {String} promotionSelector - selektor elementu promocji
   * @returns {Array} - lista promocji
   */
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

  /**
   * Funkcja sprawdzająca i zwracająca cenę produktu
   * @param {Product} product - produkt, którego cena ma zostać zwrócona
   * @returns {Number} - cena produktu
   */
  const checkProductPrice = async (product) => {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV !== 'testing',
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
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 900 });
      await page.goto(product.url, {
        waitUntil: 'domcontentloaded',
      });
      await waitRandomTime(page, 1000);
      const shopOptions = SITES_CONFIG[product.shop].productSelectors;
      const { priceTagFormatter } = SITES_CONFIG[product.shop];

      const { startingPriceSelector, productOutOfStockSelector } = shopOptions;

      if (productOutOfStockSelector) {
        const btnProductOutOfStock = await page.$(productOutOfStockSelector);
        if (btnProductOutOfStock) {
          await page.close();
          await browser.close();
          return 0;
        }
      }
      const startingPrice = await page.$eval(
        startingPriceSelector,
        (el) => el.innerText
      );

      let price = 0;
      if (startingPrice) {
        price = formatString(startingPrice, priceTagFormatter);
      }
      await page.close();
      await browser.close();
      return price;
    } catch (err) {
      console.log(err);
      await browser.close();
      return 0;
    }
  };

  /**
   * Funkcja sprawdzająca czy kupon jest prawidłowy
   * @param {Object} product - obiekt produktu zawierający informacje o produkcie
   * @returns [priceBefore, priceAfter] - ceny przed i po zastosowaniu kuponu
   */
  const checkProductCoupon = async (product, coupon) => {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV !== 'testing',
      ignoreHTTPSErrors: true,
      slowMo: 0,
      args: [
        '--window-size=1400,900',
        '--remote-debugging-port=9222',
        '--remote-debugging-address=0.0.0.0',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--blink-settings=imagesEnabled=true',
      ],
    });
    try {
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
        width: 1400,
        height: 900,
      });
      await page.goto(product.url, { waitUntil: 'networkidle2' });

      await page.waitForSelector('body');

      if (productOutOfStockSelector) {
        const btnProductOutOfStock = await page.$(productOutOfStockSelector);
        if (btnProductOutOfStock) {
          await page.close();
          await browser.close();
          return [0, 0];
        }
      }

      await page.waitForSelector(addToBasketButtonSelector);
      await waitRandomTime(page, actionDelay);

      const btn = await page.$(addToBasketButtonSelector);

      await btn.evaluate((el) => el.click());

      for (const basketSelector of additionalBasketSelectors) {
        try {
          await waitRandomTime(page, actionDelay);
          await page.waitForSelector(basketSelector);
          await page.$eval(basketSelector, (el) => el.click());
        } catch(e) {
          console.log('Skipping additional basket selector');
        }
      }

      await page.waitForSelector(couponInputSelector);
      await waitRandomTime(page, actionDelay);

      const couponInput = await page.$(couponInputSelector);

      await couponInput.click();
      await couponInput.press('Backspace');
      await couponInput.type(coupon, { delay: 10 });
      await waitRandomTime(page, actionDelay);

      const priceTag = await page.$(priceTagSelector);
      const priceTagBefore = await priceTag.evaluate(
        (price) => price.innerText
      );
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
    } catch (err) {
      console.log(err);
      await browser.close();
      // zwróć ceny 0,0 jeśli wystąpił błąd
      return [0, 0];
    }
  };

  /**
   * Funkcja wyciągająca ze stron sklepów informacje o produktach
   * @param {*} shops - lista sklepów
   * @param {*} priceMin - minimalna cena produktu
   * @param {*} priceMax - maksymalna cena produktu
   * @param {*} productName - nazwa produktu
   * @returns {Array} - array of products - lista produktów
   */
  const scrapPages = async (shops, priceMin, priceMax, productName) => {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      slowMo: 0,
      args: [
        '--window-size=1400,900',
        '--remote-debugging-port=9222',
        '--remote-debugging-address=0.0.0.0',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--blink-settings=imagesEnabled=true',
      ],
    });

    /**
     * Funkcja wyciągająca informacje o produktach z podanej strony
     * @param {Browser} bw - instancja przeglądarki
     * @param {*} shopName - nazwa sklepu
     * @param {*} shopId - id sklepu
     * @param {*} shopCategory - kategoria sklepu
     * @returns
     */
    const scrapSinglePage = async (bw, shopName, shopId, shopCategory) => {
      const candidateProducts = [];
      const page = await bw.newPage();

      page.setDefaultNavigationTimeout(60000);
      await page.setViewport({
        width: 1400,
        height: 900,
      });

      const shopOptions = SITES_CONFIG[shopName].shopSelectors;
      const { separator } = SITES_CONFIG[shopName];
      const { priceTagFormatter } = SITES_CONFIG[shopName];
      const productSlug = getSlug(productName, separator);
      // niektóre sklepy wymagają dodatkowego kliknięcia na różne elementy
      let { itemNameSelector } = shopOptions;
      let { itemPriceSelector } = shopOptions;
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

            if (url) {
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
        }
        await page.close();
        return candidateProducts;
      } catch (err) {
        console.log(err);
        await page.close();
        return new AppError(
          'ScrapperError',
          HTTP_STATUS_CODES.INTERNAL_SERVER,
          `The scrapper got some issues while parsing ${shopName} with ${shopName}!`
        );
      }
    };

    const shopsPromisesArray = shops.map(
      (shop) =>
        new Promise(
          (resolve) =>
            resolve(
              scrapSinglePage(browser, shop.name, shop.id, shop.category)
            ),
          (reject) =>
            reject(
              new AppError(
                'ScrapperError',
                HTTP_STATUS_CODES.INTERNAL_SERVER,
                `The scrapper got some issues while parsing ${shop.name} with ${shop.name}!`
              )
            )
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
    await browser.close();

    return sortedProducts;
  };

  /**
   * Funkcja, która wyciąga informacje o produktach z podanych sklepów
   * i aktualizuje bazę danych z utworzonymi snapshotami produktów
   */
  const updateAllProductsFromDB = async () => {
    console.log('Starting DB update...');
    const products = await Product.find().populate('shop');
    console.log(`Found products: ${products.length}`);
    let i = 0;
    for (const product of products) {
      i += 1;
      console.log(
        `Scrapping product ${i}/${products.length}: ${product.url} ...`
      );
      let newProductSnapshot;
      const workingCoupons = [];
      let minPrice = 999999999;

      if (product.coupons.length > 0) {
        for (const coupon of product.coupons) {
          try {
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
          } catch (error) {
            console.log('Coupon error: ', error);
          }
        }
        newProductSnapshot = {
          price: minPrice === 999999999 ? 0 : minPrice,
          coupons: workingCoupons,
          otherPromotions: [],
          updatedAt: Date.now(),
        };
      } else {
        try {
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
        } catch (err) {
          console.log(err);
          newProductSnapshot = {
            price: 0,
            coupons: [],
            otherPromotions: [],
            updatedAt: Date.now(),
          };
        }
      }
      if (newProductSnapshot.price !== 0) {
        try {
          await Product.findByIdAndUpdate(product._id, {
            price: minPrice === 999999999 ? product.price : minPrice,
            coupons: workingCoupons,
            $push: { snapshots: newProductSnapshot },
          });
          console.log('Added new snapshot');
        } catch (err) {
          console.log(
            '_________________________________________________________________'
          );
          console.log('There was a problem during creating a snapshot...');
          console.log(err);
          console.log('\nsnapshot:');
          console.log(newProductSnapshot);
          console.log(
            '_________________________________________________________________'
          );
        }
      } else {
        console.log('No snapshot added - product unavailable');
      }
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
