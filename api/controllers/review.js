"use strict";

const { getById, list, search } = require("./../services/reviews-service");
const ReviewsService = require("../helpers/reviews")();
const querystring = require("query-string");

/*
 'use strict' is not required but helpful for turning syntactical errors into true errors in the program flow
 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
*/

/*
 Modules make it possible to import JavaScript files into your application.  Modules are imported
 using 'require' statements that give you a reference to the module.

  It is a good idea to list the modules that your application depends on in the package.json in the project root
 */
var util = require("util");

/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
  - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
  - Or the operationId associated with the operation in your Swagger document

  In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
  we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */
module.exports = {
  getReviewById,
  listReviews,
  searchReviews
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function getReviewById(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  const result = ReviewsService.getReviewById(
    req.swagger.params.reviewId.value
  );
  res.status(200).send(result);
}

const urlBuilder = (host, path) => params =>
  `http://${host}${path}?${querystring.stringify(params, {
    arrayFormat: "comma"
  })}`;

function validateParams(req) {
  const validParams = Object.keys(req.swagger.params);
  const unknownParams = Object.keys(req.query).filter(
    p => validParams.indexOf(p) === -1
  );
  const params = validParams
    .map(p => ({
      [p]:
        req.swagger.params[p].value &&
        typeof req.swagger.params[p].value === "string" &&
        req.swagger.params[p].value.includes(",")
          ? req.swagger.params[p].value.split(",").map(v => v.trim())
          : typeof req.swagger.params[p].value === "string"
          ? req.swagger.params[p].value.trim()
          : req.swagger.params[p].value
    }))
    .reduce((acc, val) => ({ ...acc, ...val }), {});

  return { unknownParams, params };
}

function getWarnings(unknownParams, { after, before }) {
  const warnings = {};
  if (unknownParams && unknownParams.length > 0) {
    warnings[
      "code-1"
    ] = `There are unrecognised query parameters in the request: ${unknownParams.toString()}, these have been ignored`;
  }
  if (after && before) {
    warnings[
      "code-2"
    ] = `"after" and "before" query parameters cannot be used together, after will take precidence`;
  }
  return warnings;
}

function searchReviews(req, res) {
  const { params, unknownParams } = validateParams(req);
  search(params).then(results => {
    sendSuccessResponse(res, results, getWarnings(unknownParams));
  });
}

function listReviews(req, res) {
  const { params, unknownParams } = validateParams(req);
  const buildUrl = urlBuilder(
    req.headers["host"],
    req.swagger.swaggerObject.basePath + req.swagger.apiPath
  );
  const results = ReviewsService.getReviews(params, buildUrl);
  const { before, after, ...urlParams } = params;

  if (results.before) {
    results.before = buildUrl({ ...urlParams, before: results.before.id });
  }

  if (results.after) {
    results.after = buildUrl({ ...urlParams, after: results.after.id });
  }

  sendSuccessResponse(res, results, getWarnings(unknownParams, params));
}

function sendSuccessResponse(res, results, warnings) {
  const body = {
    ...results,
    ...(Object.keys(warnings).length !== 0 ? { warnings } : {})
  };

  res.status(200).send(body);
}
