/**
 * Typo-Tolerant Router for Express.js
 *
 * This middleware allows Express routes to match URLs with minor typos,
 * using Levenshtein distance to find the closest matching route.
 */

const Levenshtein = require("levenshtein");

/**
 * Creates a middleware that provides typo tolerance for Express routes
 *
 * @param {Object} options Configuration options
 * @param {number} options.tolerance Maximum edit distance to consider a match (default: 2)
 * @param {boolean} options.caseSensitive Whether to perform case-sensitive matching (default: false)
 * @param {boolean} options.redirectToCorrect Whether to redirect to the correct URL (default: false)
 * @param {boolean} options.logCorrections Whether to log corrections to console (default: false)
 * @returns {Function} Express middleware function
 */
function createTypoTolerantRouter(options = {}) {
  // Default options
  const config = {
    tolerance: 2,
    caseSensitive: false,
    redirectToCorrect: false,
    logCorrections: false,
    ...options,
  };

  return function typoTolerantMiddleware(req, res, next) {
    // Skip if the request has already been handled
    if (req.typoTolerantProcessed) {
      return next();
    }

    // Get the path part of the URL (without query parameters)
    const originalPath = req.path;
    const method = req.method.toLowerCase();

    // Skip for non-GET requests if not explicitly enabled
    if (method !== "get" && !config.applyToAllMethods) {
      return next();
    }

    // Get all registered routes from the Express app
    const routes = getRegisteredRoutes(req.app);

    // Find the best matching route
    const bestMatch = findBestMatch(originalPath, routes, method, config);

    if (bestMatch) {
      if (config.logCorrections) {
        console.log(
          `Typo correction: "${originalPath}" → "${bestMatch.path}" (distance: ${bestMatch.distance})`
        );
      }

      if (config.redirectToCorrect) {
        // Redirect to the correct URL
        return res.redirect(
          301,
          bestMatch.path +
            (req.url.includes("?")
              ? req.url.substring(req.url.indexOf("?"))
              : "")
        );
      } else {
        // Mark as processed to avoid infinite loops
        req.typoTolerantProcessed = true;

        // Rewrite the URL and let Express handle it
        req.url =
          bestMatch.path +
          (req.url.includes("?")
            ? req.url.substring(req.url.indexOf("?"))
            : "");

        // Pass control to the next middleware
        return next("route");
      }
    }

    // No match found or tolerance exceeded, proceed normally
    next();
  };
}

/**
 * Extracts all registered routes from an Express app
 *
 * @param {Object} app Express application
 * @returns {Array} Array of route objects
 */
function getRegisteredRoutes(app) {
  const routes = [];

  // Function to process route stack
  function processStack(stack, basePath = "") {
    stack.forEach((layer) => {
      if (layer.route) {
        // This is a route
        const path =
          basePath + (layer.route.path === "/" ? "" : layer.route.path);
        Object.keys(layer.route.methods).forEach((method) => {
          if (layer.route.methods[method]) {
            routes.push({
              path,
              method: method.toLowerCase(),
            });
          }
        });
      } else if (layer.name === "router" && layer.handle.stack) {
        // This is a sub-router
        const newBasePath =
          basePath +
          (layer.regexp.toString().includes("^\\/")
            ? layer.regexp
                .toString()
                .replace(/^.*\(\?:|\\\/?\\\/\?\)\.\*$/g, "/")
            : "");
        processStack(layer.handle.stack, newBasePath);
      }
    });
  }

  // Process the main app stack
  if (app._router && app._router.stack) {
    processStack(app._router.stack);
  }

  return routes;
}

/**
 * Finds the best matching route based on Levenshtein distance
 *
 * @param {string} originalPath Original request path
 * @param {Array} routes Array of route objects
 * @param {string} method HTTP method
 * @param {Object} config Configuration options
 * @returns {Object|null} Best matching route or null if none found
 */
function findBestMatch(originalPath, routes, method, config) {
  let bestMatch = null;
  let minDistance = Infinity;

  // Normalize the original path for comparison
  const normalizedOriginalPath = config.caseSensitive
    ? originalPath
    : originalPath.toLowerCase();

  // Filter routes by method if needed
  const filteredRoutes = routes.filter(
    (route) => config.applyToAllMethods || route.method === method
  );

  for (const route of filteredRoutes) {
    // Skip routes with parameters for now (they need special handling)
    if (route.path.includes(":")) {
      continue;
    }

    // Normalize the route path for comparison
    const normalizedRoutePath = config.caseSensitive
      ? route.path
      : route.path.toLowerCase();

    // Calculate Levenshtein distance
    const distance = new Levenshtein(
      normalizedOriginalPath,
      normalizedRoutePath
    ).distance;

    // Update best match if this is better
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = {
        path: route.path,
        method: route.method,
        distance,
      };
    }
  }

  // Return the best match if it's within tolerance
  return bestMatch && bestMatch.distance <= config.tolerance ? bestMatch : null;
}

module.exports = createTypoTolerantRouter;
