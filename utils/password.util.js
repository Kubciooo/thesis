const bcrypt = require("bcrypt");

const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePasswords = async (candidatePassword, hashedPassword) =>
  bcrypt.compare(candidatePassword, hashedPassword);

module.exports = { encryptPassword, comparePasswords };
