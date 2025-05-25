/**
 * Example application demonstrating the typo-tolerant router
 * @module example
 */

const express = require("express");
const createTypoTolerantRouter = require("./typo-tolerant-router");

/**
 * Express application instance
 * @type {import('express').Application}
 */
const app = express();

/**
 * Configure the typo-tolerant middleware with the following options:
 * @param {Object} options - Middleware configuration options
 * @param {number} options.tolerance - Maximum number of character differences allowed (default: 2)
 * @param {boolean} options.caseSensitive - Whether to consider case when matching routes (default: false)
 * @param {boolean} options.redirectToCorrect - Whether to redirect to the correct URL (default: false)
 * @param {boolean} options.logCorrections - Whether to log route corrections (default: true)
 * @param {boolean} options.applyToAllMethods - Whether to apply typo tolerance to all HTTP methods (default: true)
 */
app.use(
  createTypoTolerantRouter({
    tolerance: 2,
    caseSensitive: false,
    redirectToCorrect: false,
    logCorrections: true,
    applyToAllMethods: true,
  })
);

/**
 * Home page route
 * @route GET /
 * @returns {string} Home page content
 */
app.get("/", (req, res) => {
  res.send("Home page");
});

/**
 * Products page route
 * @route GET /products
 * @returns {string} Products page content
 */
app.get("/products", (req, res) => {
  res.send("Products page");
});

/**
 * Categories page route
 * @route GET /categories
 * @returns {string} Categories page content
 */
app.get("/categories", (req, res) => {
  res.send("Categories page");
});

/**
 * About page route
 * @route GET /about
 * @returns {string} About page content
 */
app.get("/about", (req, res) => {
  res.send("About page");
});

/**
 * Contact page route
 * @route GET /contact
 * @returns {string} Contact page content
 */
app.get("/contact", (req, res) => {
  res.send("Contact page");
});

/**
 * Get users API endpoint
 * @route GET /api/users
 * @returns {Object} JSON response containing list of users
 */
app.get("/api/users", (req, res) => {
  res.json({ message: "List of users" });
});

/**
 * Create user API endpoint
 * @route POST /api/users
 * @returns {Object} JSON response confirming user creation
 */
app.post("/api/users", (req, res) => {
  res.json({ message: "User created" });
});

/**
 * Start the Express server
 * @type {number}
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Try these URLs with typos:");
  console.log("- http://localhost:3000/produts (instead of /products)");
  console.log("- http://localhost:3000/categores (instead of /categories)");
  console.log("- http://localhost:3000/abot (instead of /about)");
  console.log("- http://localhost:3000/contct (instead of /contact)");
  console.log("- http://localhost:3000/api/usrs (instead of /api/users)");
});
