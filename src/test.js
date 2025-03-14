/**
 * Simple test script for the typo-tolerant router
 *
 * This script creates a test server and makes requests to it with typos
 * to demonstrate the typo-tolerant router in action.
 */

const express = require("express");
const http = require("http");
const createTypoTolerantRouter = require("../index").createTypoTolerantRouter;
const createAdvancedTypoTolerantRouter =
  require("../index").createAdvancedTypoTolerantRouter;

// Create Express app
const app = express();

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

// Define some routes
app.get("/products", (req, res) => {
  res.send("Products page");
});

app.get("/users/:userId", (req, res) => {
  res.send(`User details for user ID: ${req.params.userId}`);
});

// Start the server
const server = app.listen(3000, () => {
  console.log("Test server running on port 3000");

  // Run tests
  runTests()
    .then(() => {
      console.log("All tests completed");
      server.close();
    })
    .catch((err) => {
      console.error("Test failed:", err);
      server.close();
    });
});

// Test function
async function runTests() {
  // Test cases: [path, expectedResponse]
  const testCases = [
    ["/products", "Products page"],
    ["/produts", "Products page"], // Typo
    ["/productz", "Products page"], // Typo
    ["/users/123", "User details for user ID: 123"],
    ["/usrs/123", "User details for user ID: 123"], // Typo
    ["/userz/123", "User details for user ID: 123"], // Typo
  ];

  for (const [path, expectedResponse] of testCases) {
    console.log(`Testing path: ${path}`);
    const response = await makeRequest(path);

    if (response === expectedResponse) {
      console.log(`✅ Test passed for ${path}`);
    } else {
      console.error(`❌ Test failed for ${path}`);
      console.error(`  Expected: ${expectedResponse}`);
      console.error(`  Received: ${response}`);
      throw new Error(`Test failed for ${path}`);
    }
  }
}

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:3000${path}`, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
