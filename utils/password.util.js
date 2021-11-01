const bcrypt = require('bcrypt');
const crypto = require('crypto');

const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePasswords = async (candidatePassword, hashedPassword) =>
  bcrypt.compare(candidatePassword, hashedPassword);

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
