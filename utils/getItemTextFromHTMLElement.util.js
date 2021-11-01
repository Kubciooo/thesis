// eslint-disable-next-line no-unused-vars
const puppeteer = require('puppeteer');

const getItemTextFromHTMLElement = async (productElement, nameClass) => {
  const productChildElement = await productElement.$(nameClass);

  if (!productChildElement) return '';
  return productElement.$eval(nameClass, (el) => el.innerText);
};

module.exports = getItemTextFromHTMLElement;
