/**
 * Typo-Tolerant Router for Express.js
 *
 * A middleware for Express.js that allows your API to handle requests with minor typos in the URL paths.
 * This library uses Levenshtein distance to find the closest matching route when a request doesn't match
 * any registered route exactly.
 */

const createTypoTolerantRouter = require("./src/typo-tolerant-router");
const createAdvancedTypoTolerantRouter = require("./src/typo-tolerant-router-advanced");

module.exports = createTypoTolerantRouter;
module.exports.createTypoTolerantRouter = createTypoTolerantRouter;
module.exports.createAdvancedTypoTolerantRouter =
  createAdvancedTypoTolerantRouter;
