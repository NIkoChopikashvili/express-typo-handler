/**
 * Advanced example application demonstrating the typo-tolerant router with route parameters
 */

const express = require("express");
const createAdvancedTypoTolerantRouter = require("./typo-tolerant-router-advanced");

// Create Express app
const app = express();

// Install the path-to-regexp dependency if not already installed
try {
  require.resolve("path-to-regexp");
} catch (e) {
  console.error("Missing dependency: path-to-regexp. Installing...");
  require("child_process").execSync("npm install path-to-regexp");
  console.log("Dependency installed successfully.");
}

// Configure the typo-tolerant middleware
app.use(
  createAdvancedTypoTolerantRouter({
    tolerance: 2,
    caseSensitive: false,
    redirectToCorrect: false,
    logCorrections: true,
    applyToAllMethods: true,
    handleParams: true,
  })
);

// Define some routes with parameters
app.get("/users/:userId", (req, res) => {
  res.send(`User details for user ID: ${req.params.userId}`);
});

app.get("/products/:productId", (req, res) => {
  res.send(`Product details for product ID: ${req.params.productId}`);
});

app.get("/categories/:categoryId/products", (req, res) => {
  res.send(`Products in category ID: ${req.params.categoryId}`);
});

app.get("/blog/:year/:month/:slug", (req, res) => {
  res.send(
    `Blog post: ${req.params.slug} from ${req.params.month}/${req.params.year}`
  );
});

// Define some static routes
app.get("/", (req, res) => {
  res.send("Home page");
});

app.get("/about", (req, res) => {
  res.send("About page");
});

app.get("/contact", (req, res) => {
  res.send("Contact page");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Advanced example server running on port ${PORT}`);
  console.log("Try these URLs with typos:");
  console.log("- http://localhost:3000/abot (instead of /about)");
  console.log("- http://localhost:3000/contct (instead of /contact)");
  console.log("- http://localhost:3000/usrs/123 (instead of /users/123)");
  console.log("- http://localhost:3000/produts/456 (instead of /products/456)");
  console.log(
    "- http://localhost:3000/categries/789/products (instead of /categories/789/products)"
  );
  console.log(
    "- http://localhost:3000/blg/2023/05/hello-world (instead of /blog/2023/05/hello-world)"
  );
});
