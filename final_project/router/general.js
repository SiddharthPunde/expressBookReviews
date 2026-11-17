const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');

const public_users = express.Router();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Register a new user.
public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (isValid(username)) {
    return res.status(409).json({ message: 'Username already exists.' });
  }

  users.push({ username, password });
  return res.status(201).json({ message: 'User successfully registered. Now you can login.' });
});

// Retrieve all books.
public_users.get('/', (req, res) => res.status(200).json(books));

// Retrieve a book by ISBN.
public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  return res.status(200).json(book);
});

// Retrieve books by author (case-insensitive partial match).
public_users.get('/author/:author', (req, res) => {
  const author = decodeURIComponent(req.params.author).toLowerCase();
  const matches = Object.entries(books)
    .filter(([, book]) => book.author.toLowerCase().includes(author))
    .map(([isbn, book]) => ({ isbn, ...book }));
  return res.status(200).json(matches);
});

// Retrieve books by title (case-insensitive partial match).
public_users.get('/title/:title', (req, res) => {
  const title = decodeURIComponent(req.params.title).toLowerCase();
  const matches = Object.entries(books)
    .filter(([, book]) => book.title.toLowerCase().includes(title))
    .map(([isbn, book]) => ({ isbn, ...book }));
  return res.status(200).json(matches);
});

// Retrieve reviews for a book.
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  return res.status(200).json(book.reviews);
});

// Axios-based asynchronous retrieval helpers (Q11).
async function getAllBooks() {
  const response = await axios.get(API_BASE_URL);
  return response.data;
}

async function getBookByISBN(isbn) {
  const response = await axios.get(`${API_BASE_URL}/isbn/${encodeURIComponent(isbn)}`);
  return response.data;
}

async function getBooksByAuthor(author) {
  const response = await axios.get(`${API_BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
}

async function getBooksByTitle(title) {
  const response = await axios.get(`${API_BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
}

// Expose the Axios implementations as testable asynchronous endpoints too.
public_users.get('/asyncbooks', async (req, res) => {
  try { return res.status(200).json(await getAllBooks()); }
  catch (error) { return res.status(502).json({ message: 'Unable to retrieve books.', error: error.message }); }
});
public_users.get('/asyncisbn/:isbn', async (req, res) => {
  try { return res.status(200).json(await getBookByISBN(req.params.isbn)); }
  catch (error) { return res.status(error.response?.status || 502).json(error.response?.data || { message: error.message }); }
});
public_users.get('/asyncauthor/:author', async (req, res) => {
  try { return res.status(200).json(await getBooksByAuthor(req.params.author)); }
  catch (error) { return res.status(502).json({ message: 'Unable to retrieve books by author.', error: error.message }); }
});
public_users.get('/asynctitle/:title', async (req, res) => {
  try { return res.status(200).json(await getBooksByTitle(req.params.title)); }
  catch (error) { return res.status(502).json({ message: 'Unable to retrieve books by title.', error: error.message }); }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
