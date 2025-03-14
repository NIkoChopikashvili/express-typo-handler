/**
 * Advanced Typo-Tolerant Router for Express.js
 *
 * This middleware allows Express routes to match URLs with minor typos,
 * using Levenshtein distance to find the closest matching route.
 * This version also handles route parameters.
 */

const Levenshtein = require("levenshtein");
const pathToRegexp = require("path-to-regexp");

/**
 * Creates a middleware that provides typo tolerance for Express routes
 *
 * @param {Object} options Configuration options
 * @param {number} options.tolerance Maximum edit distance to consider a match (default: 2)
 * @param {boolean} options.caseSensitive Whether to perform case-sensitive matching (default: false)
 * @param {boolean} options.redirectToCorrect Whether to redirect to the correct URL (default: false)
 * @param {boolean} options.logCorrections Whether to log corrections to console (default: false)
 * @param {boolean} options.applyToAllMethods Whether to apply to all HTTP methods (default: false)
 * @param {boolean} options.handleParams Whether to handle route parameters (default: true)
 * @returns {Function} Express middleware function
 */
function createAdvancedTypoTolerantRouter(options = {}) {
  // Default options
  const config = {
    tolerance: 2,
    caseSensitive: false,
    redirectToCorrect: false,
    logCorrections: false,
    applyToAllMethods: false,
    handleParams: true,
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

      if (config.redirectToCorrect && !bestMatch.hasParams) {
        // Only redirect for static routes (not for routes with parameters)
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

        // If the route has parameters, extract them and add to req.params
        if (bestMatch.params) {
          Object.assign(req.params, bestMatch.params);
        }

        // Rewrite the URL and let Express handle it
        if (bestMatch.hasParams) {
          // For parameterized routes, we need to use the matched URL with parameters
          req.url =
            bestMatch.matchedUrl +
            (req.url.includes("?")
              ? req.url.substring(req.url.indexOf("?"))
              : "");
        } else {
          req.url =
            bestMatch.path +
            (req.url.includes("?")
              ? req.url.substring(req.url.indexOf("?"))
              : "");
        }

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
              hasParams: path.includes(":"),
              keys: [], // Will be populated for parameterized routes
              regexp: null, // Will be populated for parameterized routes
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

  // Prepare routes with parameters for matching
  routes.forEach((route) => {
    if (route.hasParams) {
      route.keys = [];
      route.regexp = pathToRegexp(route.path, route.keys);
    }
  });

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

  // First, try to find exact matches for parameterized routes
  if (config.handleParams) {
    for (const route of filteredRoutes) {
      if (route.hasParams && route.regexp) {
        const match = route.regexp.exec(originalPath);
        if (match) {
          // Extract parameters
          const params = {};
          for (let i = 1; i < match.length; i++) {
            if (route.keys[i - 1]) {
              params[route.keys[i - 1].name] = match[i];
            }
          }

          // This is an exact match with parameters
          return {
            path: route.path,
            method: route.method,
            distance: 0,
            hasParams: true,
            matchedUrl: originalPath,
            params,
          };
        }
      }
    }
  }

  // Process static routes first
  for (const route of filteredRoutes) {
    if (!route.hasParams) {
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
          hasParams: false,
        };
      }
    }
  }

  // If we should handle parameterized routes and no good static match was found
  if (
    config.handleParams &&
    (!bestMatch || bestMatch.distance > config.tolerance)
  ) {
    for (const route of filteredRoutes) {
      if (route.hasParams) {
        // Split the paths into segments
        const originalSegments = originalPath.split("/").filter(Boolean);
        const routeSegments = route.path.split("/").filter(Boolean);

        // Skip if segment count is too different
        if (
          Math.abs(originalSegments.length - routeSegments.length) >
          config.tolerance
        ) {
          continue;
        }

        let totalDistance = 0;
        let isGoodMatch = true;
        const params = {};

        // Compare each segment
        for (
          let i = 0;
          i < Math.max(originalSegments.length, routeSegments.length);
          i++
        ) {
          if (i >= originalSegments.length || i >= routeSegments.length) {
            // Missing segment
            totalDistance += 1;
            continue;
          }

          const origSegment = originalSegments[i];
          const routeSegment = routeSegments[i];

          if (routeSegment.startsWith(":")) {
            // This is a parameter segment, store it
            const paramName = routeSegment.substring(1);
            params[paramName] = origSegment;
          } else {
            // This is a static segment, compare with Levenshtein
            const segmentDistance = new Levenshtein(
              config.caseSensitive ? origSegment : origSegment.toLowerCase(),
              config.caseSensitive ? routeSegment : routeSegment.toLowerCase()
            ).distance;

            totalDistance += segmentDistance;

            // If any segment is too different, this is not a good match
            if (segmentDistance > config.tolerance) {
              isGoodMatch = false;
              break;
            }
          }
        }

        if (isGoodMatch && totalDistance < minDistance) {
          minDistance = totalDistance;

          // Reconstruct the matched URL with parameters
          const matchedSegments = [];
          for (let i = 0; i < routeSegments.length; i++) {
            if (routeSegments[i].startsWith(":")) {
              const paramName = routeSegments[i].substring(1);
              matchedSegments.push(params[paramName] || "");
            } else {
              matchedSegments.push(routeSegments[i]);
            }
          }

          bestMatch = {
            path: route.path,
            method: route.method,
            distance: totalDistance,
            hasParams: true,
            matchedUrl: "/" + matchedSegments.join("/"),
            params,
          };
        }
      }
    }
  }

  // Return the best match if it's within tolerance
  return bestMatch && bestMatch.distance <= config.tolerance ? bestMatch : null;
}

module.exports = createAdvancedTypoTolerantRouter;
