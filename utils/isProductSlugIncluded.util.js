/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-syntax */
const getProductAlias = require('./getProductAlias.util');
const getSlug = require('./getSlug.util');

/**
 * Funckja sprawdzająca, czy slug produktu powinien być dodany do listy produktów
 * @param {String} productSlug
 * @param {String} candidateProduct
 * @param {String} separator
 * @returns {Boolean} czy slug powinien być dodany do listy produktów
 */
const isProductSlugIncluded = (productSlug, candidateProduct, separator) => {
  const productSlugList = productSlug.split(separator);
  const candidateProductList = candidateProduct.split(separator);

  for (const slug of productSlugList) {
    const slugAlias = getSlug(getProductAlias(slug), separator);

    if (
      !candidateProductList.includes(slug) &&
      !candidateProductList.includes(slugAlias)
    ) {
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
};

module.exports = isProductSlugIncluded;
