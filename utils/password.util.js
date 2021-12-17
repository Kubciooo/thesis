const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Funkcja haszująca hasło za pomocą biblioteki bcrypt i zwracająca hasz
 * @param {String} password - hasło
 * @returns  {String} hasz - hasz hasła
 */
const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Funkcja porównująca dwa hasła za pomocą biblioteki bcrypt
 * @param {String} candidatePassword - hasło do porównania
 * @param {String} hashedPassword - hasło w bazie
 * @returns
 */
const comparePasswords = async (candidatePassword, hashedPassword) =>
  bcrypt.compare(candidatePassword, hashedPassword);

/**
 * Funkcja generująca token przypomnienia hasła za pomocą biblioteki crypto
 * @returns {String} token - token przypomnienia hasła
 */
const generatePasswordForgotToken = async () => {
  const randomToken = crypto.randomBytes(32).toString('hex');
  const randomTokenEncrypted = crypto
    .createHash('sha512')
    .update(randomToken)
    .digest('hex');
  return { randomToken, randomTokenEncrypted };
};

module.exports = {
  encryptPassword,
  comparePasswords,
  generatePasswordForgotToken,
};
