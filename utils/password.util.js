const bcrypt = require("bcrypt");
const saltRounds = 10;

const encryptPassword = (password) => {
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
};

const comparePasswords = (candidatePassword, hashedPassword) =>
  bcrypt.compareSync(candidatePassword, hashedPassword);

module.exports = { encryptPassword, comparePasswords };
