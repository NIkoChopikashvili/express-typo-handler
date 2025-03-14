# Typo-Tolerant Router for Express.js

A middleware for Express.js that allows your API to handle requests with minor typos in the URL paths. This library uses Levenshtein distance to find the closest matching route when a request doesn't match any registered route exactly.

## Features

- Handles typos in URL paths (e.g., `/produts` instead of `/products`)
- Configurable tolerance level for typo matching
- Support for route parameters (e.g., `/users/:userId`)
- Option to redirect to the correct URL or silently handle the typo
- Case-sensitive or case-insensitive matching
- Logging of typo corrections
- Works with all HTTP methods

## Installation

```bash
npm install typo-tolerant-express
```

## Basic Usage

```javascript
const express = require("express");
const createTypoTolerantRouter = require("typo-tolerant-express");

const app = express();

// Apply the typo-tolerant middleware
app.use(createTypoTolerantRouter());

// Define your routes as usual
app.get("/products", (req, res) => {
  res.send("Products page");
});

app.get("/categories", (req, res) => {
  res.send("Categories page");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

With this setup, requests to `/produts` (typo) will be handled by the `/products` route.

## Advanced Usage

```javascript
const express = require("express");
const { createAdvancedTypoTolerantRouter } = require("typo-tolerant-express");

const app = express();

// Apply the advanced typo-tolerant middleware with custom options
app.use(
  createAdvancedTypoTolerantRouter({
    tolerance: 2, // Maximum edit distance to consider a match
    caseSensitive: false, // Whether to perform case-sensitive matching
    redirectToCorrect: true, // Whether to redirect to the correct URL
    logCorrections: true, // Whether to log corrections to console
    applyToAllMethods: true, // Whether to apply to all HTTP methods
    handleParams: true, // Whether to handle route parameters
  })
);

// Define routes with parameters
app.get("/users/:userId", (req, res) => {
  res.send(`User details for user ID: ${req.params.userId}`);
});

app.get("/products/:productId", (req, res) => {
  res.send(`Product details for product ID: ${req.params.productId}`);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## Configuration Options

| Option              | Type    | Default | Description                                         |
| ------------------- | ------- | ------- | --------------------------------------------------- |
| `tolerance`         | number  | 2       | Maximum edit distance to consider a match           |
| `caseSensitive`     | boolean | false   | Whether to perform case-sensitive matching          |
| `redirectToCorrect` | boolean | false   | Whether to redirect to the correct URL              |
| `logCorrections`    | boolean | false   | Whether to log corrections to console               |
| `applyToAllMethods` | boolean | false   | Whether to apply to all HTTP methods (not just GET) |
| `handleParams`      | boolean | true    | Whether to handle route parameters                  |

## How It Works

1. The middleware intercepts all incoming requests.
2. It extracts all registered routes from the Express app.
3. It calculates the Levenshtein distance between the requested URL and each registered route.
4. If it finds a route with a distance less than or equal to the tolerance, it either:
   - Redirects to the correct URL (if `redirectToCorrect` is true)
   - Rewrites the URL and passes control to the correct route handler

## Examples

### Basic Example

```javascript
// Request to /produts will be handled by the /products route
app.get("/products", (req, res) => {
  res.send("Products page");
});
```

### Route Parameters Example

```javascript
// Request to /usrs/123 will be handled by the /users/:userId route
app.get("/users/:userId", (req, res) => {
  res.send(`User details for user ID: ${req.params.userId}`);
});
```

### Nested Routes Example

```javascript
// Request to /categries/789/products will be handled by the /categories/:categoryId/products route
app.get("/categories/:categoryId/products", (req, res) => {
  res.send(`Products in category ID: ${req.params.categoryId}`);
});
```

## Limitations

- The middleware may have a performance impact on high-traffic APIs.
- It may not work correctly with complex regular expression routes.
- It doesn't handle query parameters in the typo correction process.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
