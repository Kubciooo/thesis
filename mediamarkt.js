const puppeteer = require('puppeteer');
const slugify = require('slugify');
const getItemTextFromHTMLElement = require('./utils/getItemTextFromHTMLElement.util');

const mediamarkt = async (priceMin, priceMax, productName) => {
  const separator = '+';
  const priceTagFormatter = {
    ',-': '',
  }
  const itemBoxesSelector = '.m-offerBox_content';
  const itemNameSelector = '.b-ofr_headDataTitle';
  const itemPriceSelector = '.m-priceBox_price';
  const promotionListSelector = '.b-ofr_promoList';
  const promotionSelector = '.b-ofr_promoListItem';
  const candidateProducts = [];

  const getSlug = name => slugify(name, { replacement: separator, lower: true });

  const getPriceNumber = price => {
    let finalPrice = price;
    for (const [key, value] of Object.entries(priceTagFormatter)) {
      finalPrice = finalPrice.replace(key, value);
    }

    return parseFloat(finalPrice);
  }
  const getPromotionsListForSingleItem = async (item) => {
    const promotionsList = [];

    const promotionListElement = await item.$(promotionListSelector);

    if (promotionListElement) {
      const promotionElements = await promotionListElement.$$(promotionSelector);

      for (const promotionElement of promotionElements) {
        const promotion = await page.evaluate(el => ({ name: el.innerText, url: el.href }), promotionElement);
        promotionsList.push(promotion);
      }
    }

    return promotionsList;
  }

  const isProductSlugIncluded = (productSlug, candidateProduct) => {
    const productSlugList = productSlug.split(separator);
    const candidateProductList = candidateProduct.split(separator);
    for (const slug of productSlugList) {
      if (!candidateProductList.includes(slug)) {
        if(!isNaN(+slug) || !candidateProduct.includes(slug)) 
          return false;
      }
    }
    return true;
  }

  const productSlug = getSlug(productName);
  const pageURL = `https://mediamarkt.pl/search?sort=price_asc&limit=100&page=1&query%5Bmenu_item%5D=&query%5Bquerystring%5D=${productSlug}&priceFilter%5Bmin%5D=${priceMin}&priceFilter%5Bmax%5D=${priceMax}`;


  const browser = await puppeteer.launch(
    {
      headless: false
    }
  );
  const page = await browser.newPage();
  try {
    await page.goto(pageURL, { waitUntil: 'networkidle2' });

    await page.waitForSelector('body');
    const itemBoxes = await page.$$(itemBoxesSelector);

    for (const item of itemBoxes) {
      const name = await getItemTextFromHTMLElement(item, itemNameSelector);

      const nameSlug = getSlug(name);

      if (isProductSlugIncluded(productSlug, nameSlug)) {
        const priceTag = await getItemTextFromHTMLElement(item, itemPriceSelector);
        const price = getPriceNumber(priceTag);

        const url = await item.$eval(itemNameSelector, el => el.href);
        const promotions = await getPromotionsListForSingleItem(item);

        candidateProducts.push({ name, price, url, promotions })
      }
    }

    const sortedProducts = candidateProducts.sort((a, b) => a.price - b.price);
    console.dir(sortedProducts, { depth: null });

    await browser.close();
  } catch (err) {
    await browser.close();
    throw err;
  }
};

mediamarkt(3000, 6200, "samsung qe55q80a");