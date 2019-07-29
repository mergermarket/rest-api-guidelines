const ReviewIterator = require("./review-iterator");
const { numeric, alphabetically } = require("./sort");

const ReviewsService = (reviewData = require("../../data/wine-reviews")) => {
  const reviewsByAttributes = (attrName, attrs) =>
    reviewData
      .reduce((acc, review) => {
        const matching = (Array.isArray(attrs) ? attrs : [attrs]).map(attr => {
          if (attr.toLowerCase() === review[attrName].toLowerCase()) {
            return review;
          }
        });
        if (matching.length > 0) {
          return [...acc, ...matching];
        }
      }, [])
      .filter(Boolean);

  const byQuery = q => review =>
    Object.keys(review).filter(
      k =>
        typeof review[k] === "string" &&
        review[k].toLowerCase().search(q.toLowerCase()) > -1
    ).length > 0;

  const reviewsByQuery = (reviews, query) => reviews.filter(byQuery(query));

  const buildCursor = key =>
    Buffer.from(JSON.stringify(key)).toString("base64");

  const getOffsetResults = ({
    start = 0,
    list = [],
    size = list.length,
    reverse = false
  }) => {
    let offsetResults = [];
    let beforeCursor;
    let afterCursor;

    const iterator = ReviewIterator(list);
    iterator.setCursor(start);
    offsetResults.push(iterator.current());

    const direction = !reverse ? "next" : "previous";

    if (!reverse) {
      beforeCursor = iterator.hasPrev() ? iterator.current() : null;
    }

    for (i = 0; i < size - 1; i++) {
      offsetResults.push(iterator[direction]());
    }

    if (reverse) {
      beforeCursor = iterator.hasPrev() ? iterator.current() : null;
    }

    afterCursor = iterator.hasNext() ? iterator.current() : null;

    return {
      results: (!reverse ? offsetResults : offsetResults.reverse()).filter(
        Boolean
      ),
      ...(beforeCursor ? { before: beforeCursor } : {}),
      ...(afterCursor ? { after: afterCursor } : {}),
      total: list.length
    };
  };

  const returnOnlyFields = (list = [], fields = []) =>
    list.map(item =>
      Object.keys(item)
        .filter(k => fields.indexOf(k) !== -1)
        .reduce((acc, field) => ({ ...acc, [field]: item[field] }), {})
    );

  const getReviewsByIds = ({
    ids = [],
    size = 10,
    after = null,
    before = null,
    fields = null,
    sort = null
  }) => {};

  const getReviews = ({
    countries = [],
    size = 10,
    after = null,
    before = null,
    q = "",
    fields = null,
    sort = null
  }) => {
    let allResults =
      countries.length > 0
        ? reviewsByAttributes("country", countries)
        : reviewData;

    if (q !== "") {
      allResults = reviewsByQuery(allResults, q);
    }

    if (fields && fields.length > 0) {
      allResults = returnOnlyFields(allResults, [
        ...(Array.isArray(fields) ? fields : [fields]),
        "id"
      ]);
    }

    if (sort) {
      const direction = sort.startsWith("-") ? "-" : "+";
      const key =
        sort.startsWith("-") || sort.startsWith("+") ? sort.slice(1) : sort;

      switch (key) {
        case "points":
        case "id":
        case "price":
          allResults.sort(numeric(direction, key));
          break;
        case "winery":
        case "region":
        case "province":
        case "geography":
        case "country":
        case "variety":
          allResults.sort(alphabetically(direction, key));
          break;
        default:
          break;
      }
    }

    const reverse = before;
    return getOffsetResults({
      start: after
        ? allResults.findIndex(el => el.id === after) + 1 // after meaning after the element we found
        : before
        ? allResults.findIndex(el => el.id === before) - 1 // before meaning before the element we found
        : 0,
      list: allResults,
      size,
      reverse
    });
  };

  const getReviewById = (id = null, params) => {
    if (!id) {
      throw new Error("id not specified");
    }

    return reviewData.filter(r => r.id === id);
  };

  return {
    reviewsByAttributes,
    reviewsByQuery,
    getOffsetResults,
    getReviews,
    getReviewById
  };
};

module.exports = ReviewsService;
