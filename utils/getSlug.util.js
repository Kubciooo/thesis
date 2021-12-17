const slugify = require('slugify');

/**
 * Funkcja tworząca slug z nazwy produktu
 * @param {String} name - nazwa produktu
 * @param {String} separator - separator
 * @returns {String} slug
 */
const getSlug = (name, separator) =>
  slugify(name, { replacement: separator, lower: true });

module.exports = getSlug;
