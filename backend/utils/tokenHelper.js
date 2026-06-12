const jwt = require('jsonwebtoken');
const { TOKEN_EXPIRY_DAYS } = require('./constants');

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
  });
};