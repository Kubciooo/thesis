// eslint-disable-next-line no-unused-vars
const puppeteer = require('puppeteer');

/**
 * Funkcja pobierająca tekst z HTML elementu
 * @param {HTMLElement} productElement - element HTML
 * @param {String} nameClass - klasa elementu
 * @returns {String} tekst z elementu
 */
const getItemTextFromHTMLElement = async (productElement, nameClass) => {
  const productChildElement = await productElement.$(nameClass);

  if (!productChildElement) return '';
  return productElement.$eval(nameClass, (el) => el.innerText);
};

module.exports = getItemTextFromHTMLElement;
