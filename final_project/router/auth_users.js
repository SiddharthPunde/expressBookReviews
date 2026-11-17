const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');

const regd_users = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'book_review_project_secret';
const users = [];

const isValid = (username) => users.some((user) => user.username === username);

const authenticatedUser = (username, password) =>
  users.some((user) => user.username === username && user.password === password);

// Only registered users can log in.
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || !authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  req.session.authorization = { accessToken: token, username };
  return res.status(200).json({ message: 'User successfully logged in.', token });
});

// Add or update the logged-in user's review for a book.
regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];
  const review = req.body && req.body.review;
  const username = req.user?.username || req.session.authorization?.username;

  if (!book) return res.status(404).json({ message: 'Book not found.' });
  if (!review || !String(review).trim()) {
    return res.status(400).json({ message: 'A non-empty review is required.' });
  }

  book.reviews[username] = String(review).trim();
  return res.status(200).json({
    message: 'Review successfully added/updated.',
    reviews: book.reviews
  });
});

// Delete only the authenticated user's review.
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  const username = req.user?.username || req.session.authorization?.username;

  if (!book) return res.status(404).json({ message: 'Book not found.' });
  if (!Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(404).json({ message: 'No review found for this user.' });
  }

  delete book.reviews[username];
  return res.status(200).json({ message: 'Review successfully deleted.', reviews: book.reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.authenticatedUser = authenticatedUser;
module.exports.users = users;
