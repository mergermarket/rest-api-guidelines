const reviews = require("../../data/wine-reviews");

const buildCursor = key => Buffer.from(JSON.stringify(key)).toString("base64");

const reviewsByAttributes = (attrName, attrs) =>
  reviews
    .reduce((acc, review) => {
      const matching = (Array.isArray(attrs) ? attrs : [attrs]).map(attr => {
        if (attr === review[attrName]) {
          return review;
        }
      });
      if (matching.length > 0) {
        return [...acc, ...matching];
      }
    }, [])
    .filter(Boolean);

const reviewsByIds = (ids = []) => reviewsByAttributes("id", ids);

const reviewsByCountries = ({ countries, size }) =>
  reviewsByAttributes("country", countries);

const getOffsetResults = (beforePos, afterPos, allResults) => {
  let offsetResults = [];

  if (beforePos !== -1 && afterPos !== -1) {
    offsetResults = allResults.filter(
      (r, idx) => idx > afterPos && idx < beforePos
    );
  } else if (beforePos === -1 && afterPos !== -1) {
    offsetResults = allResults.filter((r, idx) => idx > afterPos);
  } else if (beforePos !== -1 && afterPos === -1) {
    offsetResults = allResults.filter((r, idx) => idx < beforePos);
  } else {
    offsetResults = allResults.filter((r, idx) => idx >= afterPos);
  }

  return offsetResults;
};

const reviewsByGeography = (
  { countries = [], size = 10, after = 0, before = 0 },
  buildUrl
) => {
  const allResults = reviewsByCountries({ countries, size });

  // find
  const afterPos = allResults.findIndex(el => el.id === after);
  const beforePos = allResults.findIndex(el => el.id === before);

  const offsetResults = getOffsetResults(beforePos, afterPos, allResults);

  const sizedResults =
    beforePos !== -1 && afterPos !== -1 && offsetResults.length > size
      ? offsetResults
      : beforePos !== -1
      ? offsetResults.reverse()
      : offsetResults.slice(0, size);

  return {
    results: sizedResults,
    ...(sizedResults.length > 0 && allResults.length !== afterPos
      ? {
          after: buildUrl({
            countries,
            size,
            after: sizedResults[sizedResults.length - 1].id
          })
        }
      : {}),
    ...(sizedResults.length > 0 && allResults[0].id !== sizedResults[0].id
      ? { before: buildUrl({ countries, size, before: sizedResults[0].id }) }
      : {})
  };
};

module.exports = {
  reviewsByIds,
  reviewsByGeography
};
