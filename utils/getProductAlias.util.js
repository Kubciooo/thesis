const PRODUCT_ALIASES = require('../constants/productAliases');

const getProductAlias = (productName) =>
  PRODUCT_ALIASES[productName] ? PRODUCT_ALIASES[productName] : productName;

module.exports = getProductAlias;
