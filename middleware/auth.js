// dependecies
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

module.exports = async (req, res, next) => {
  // get token from request header
  const token = req.header('x-auth-token');

  // if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    // init next function
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
