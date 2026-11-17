const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'book_review_project_secret';

app.use(express.json());
app.use('/customer', session({
  secret: process.env.SESSION_SECRET || 'fingerprint_customer',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// Protect every /customer/auth route with the JWT stored at login.
app.use('/customer/auth/*', (req, res, next) => {
  const sessionAuth = req.session && req.session.authorization;
  if (!sessionAuth || !sessionAuth.accessToken) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(sessionAuth.accessToken, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
});

app.use('/customer', customer_routes);
app.use('/', genl_routes);

app.listen(PORT, () => console.log(`Book review server is running on port ${PORT}`));

module.exports = app;
