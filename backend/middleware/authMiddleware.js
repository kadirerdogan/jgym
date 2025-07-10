const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as necessary

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourDefaultJwtSecret');

      // Get user from the token (select everything except password)
      // The decoded token should have the user id in payload as specified in auth.js when signing
      req.user = await User.findById(decoded.user.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Not authorized, token failed (invalid signature)' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Not authorized, token expired' });
      }
      return res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ msg: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route. Required roles: ${roles.join(', ')}` });
    }
    next();
  };
};

module.exports = { protect, authorize };
