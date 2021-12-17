/**
 * Funkcja owijająca funkcje z parametrem w blok try-catch
 * @param {Function} fn - funkcja do wykonania
 * @returns {Function} funkcja z parametrem w bloku try-catch
 */
const tryCatch = (fn) => (req, res, next) =>
  fn(req, res, next).catch((error) => next(error));

module.exports = tryCatch;
