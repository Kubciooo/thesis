const slugify = require('slugify');

const getSlug = (name, separator) =>
  slugify(name, { replacement: separator, lower: true });

module.exports = getSlug;
