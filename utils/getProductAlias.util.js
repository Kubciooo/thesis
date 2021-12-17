const PRODUCT_ALIASES = require('../constants/productAliases');

/**
 * Funkcja pobierająca alias produktu
 * @param {String} productName - nazwa produktu
 * @returns {String} alias produktu
 */
const getProductAlias = (productName) =>
  PRODUCT_ALIASES[productName] ? PRODUCT_ALIASES[productName] : productName;

module.exports = getProductAlias;
