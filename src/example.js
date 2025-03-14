/**
 * Example application demonstrating the typo-tolerant router
 */

const express = require("express");
const createTypoTolerantRouter = require("./typo-tolerant-router");

// Create Express app
const app = express();

// Configure the typo-tolerant middleware
app.use(
  createTypoTolerantRouter({
    tolerance: 2,
    caseSensitive: false,
    redirectToCorrect: false,
    logCorrections: true,
    applyToAllMethods: true,
  })
);

// Define some routes
app.get("/", (req, res) => {
  res.send("Home page");
});

app.get("/products", (req, res) => {
  res.send("Products page");
});

app.get("/categories", (req, res) => {
  res.send("Categories page");
});

app.get("/about", (req, res) => {
  res.send("About page");
});

app.get("/contact", (req, res) => {
  res.send("Contact page");
});

// Define some API routes
app.get("/api/users", (req, res) => {
  res.json({ message: "List of users" });
});

app.post("/api/users", (req, res) => {
  res.json({ message: "User created" });
});

// Start the server
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
