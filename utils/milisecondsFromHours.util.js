/**
 * Funkcja zamieniająca godziny na milisekundy
 * @param {Integer} hours - godziny
 * @returns {Integer} milisekundy
 */
const milisecondsFromHours = (hours) => hours * 60 * 60 * 1000;

module.exports = milisecondsFromHours;
