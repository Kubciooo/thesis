const puppeteer = require('puppeteer');
const slugify = require('slugify');
const getItemTextFromHTMLElement = require('./utils/getItemTextFromHTMLElement.util');

const xkom = async (priceMin, priceMax, productName) => {
  const separator = '%20';
  const priceTagFormatter = {
    ' ': '',
    'zł': '',
    ',': '.',
  }
  const itemBoxesSelector = '.sc-1yu46qn-4';
  const itemNameSelector = '.irSQpN';
  const itemPriceSelector = '.sc-6n68ef-3';
  const promotionListSelector = '.b-ofr_promoList';
  const promotionSelector = '.b-ofr_promoListItem';
  const candidateProducts = [];

  const getSlug = name => slugify(name, { replacement: separator, lower: true });
  const getPriceNumber = price => {
    let finalPrice = price;
    for(const [key, value] of Object.entries(priceTagFormatter)) {
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
 
  const pageURL = `https://www.x-kom.pl/szukaj?per_page=90&sort_by=price_asc&f%5Bprice%5D%5Bfrom%5D=${priceMin}&f%5Bprice%5D%5Bto%5D=${priceMax}&q=${productSlug}`;

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

xkom(3000, 6200, "samsung qe55q80aa");