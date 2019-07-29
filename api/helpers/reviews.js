const ReviewIterator = require("./review-iterator");

const ReviewsService = (reviewData = require("../../data/wine-reviews")) => {
  const reviewsByAttributes = (attrName, attrs) =>
    reviewData
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

  const byQuery = q => review =>
    Object.keys(review).filter(
      k =>
        typeof review[k] === "string" &&
        review[k].toLowerCase().search(q.toLowerCase()) > -1
    ).length > 0;

  const reviewsByQuery = (reviews, query) => reviews.filter(byQuery(query));

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
      ...(afterCursor ? { after: afterCursor } : {})
    };
  };

  const getReviews = ({
    countries = [],
    size = 10,
    after = null,
    before = null,
    q = ""
  }) => {
    if (countries.length > 0) {
      const allResults = reviewsByAttributes("country", countries);
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
    }
  };

  return {
    reviewsByAttributes,
    reviewsByQuery,
    getOffsetResults,
    getReviews
  };
};

module.exports = ReviewsService;

// const reviews = require("../../data/wine-reviews");

// const buildCursor = key => Buffer.from(JSON.stringify(key)).toString("base64");

// const reviewsByAttributes = (attrName, attrs) =>
//   reviews
//     .reduce((acc, review) => {
//       const matching = (Array.isArray(attrs) ? attrs : [attrs]).map(attr => {
//         if (attr === review[attrName]) {
//           return review;
//         }
//       });
//       if (matching.length > 0) {
//         return [...acc, ...matching];
//       }
//     }, [])
//     .filter(Boolean);
// // .map(r => ({ id: r.id }));

// const reviewsByIds = (ids = []) => reviewsByAttributes("id", ids);

// const byQuery = q => review =>
//   Object.keys(review).filter(
//     k => review[k].toLowerCase().search(q.toLowerCase()) > -1
//   ).length > 0;

// const reviewsByCountries = ({ countries, q }) =>
//   q.length > 0
//     ? reviewsByAttributes("country", countries).filter(byQuery(q))
//     : reviewsByAttributes("country", countries);

// const getOffsetResults = (beforePos, afterPos, allResults) => {
//   let offsetResults = [];

//   if (beforePos !== -1 && afterPos !== -1) {
//     offsetResults = allResults.filter(
//       (r, idx) => idx > afterPos && idx < beforePos
//     );
//   } else if (beforePos === -1 && afterPos !== -1) {
//     offsetResults = allResults.filter((r, idx) => idx > afterPos);
//   } else if (beforePos !== -1 && afterPos === -1) {
//     offsetResults = allResults.filter((r, idx) => idx < beforePos);
//   } else {
//     offsetResults = allResults.filter((r, idx) => idx >= afterPos);
//   }

//   return offsetResults;
// };

// const reviewsByGeography = (
//   { countries = [], size = 10, after = 0, before = 0, q = "" },
//   buildUrl
// ) => {
//   const allResults = reviewsByCountries({ countries, size, q });

//   // find
//   const afterPos = allResults.findIndex(el => el.id === after);
//   const beforePos = allResults.findIndex(el => el.id === before);

//   const offsetResults = getOffsetResults(beforePos, afterPos, allResults);

//   const sizedResults =
//     beforePos !== -1 && afterPos !== -1 && offsetResults.length > size
//       ? offsetResults
//       : beforePos !== -1
//       ? offsetResults
//           .reverse()
//           .slice(0, size)
//           .reverse()
//       : offsetResults.slice(0, size);

//   console.log(afterPos);

//   return {
//     results: sizedResults,
//     ...(sizedResults.length > 0 && allResults.length < afterPos
//       ? {
//           after: buildUrl({
//             countries,
//             size,
//             q,
//             after: sizedResults[sizedResults.length - 1].id
//           })
//         }
//       : {}),
//     ...(sizedResults.length > 0 && allResults[0].id !== sizedResults[0].id
//       ? { before: buildUrl({ countries, size, q, before: sizedResults[0].id }) }
//       : {})
//   };
// };

// const allReviews = ({ size = 10, after = 0, before = 0, q = "" }, buildUrl) => {
//   const allResults = q.length > 0 ? reviews.filter(byQuery(q)) : reviews;

//   // find
//   const afterPos = allResults.findIndex(el => el.id === after);
//   const beforePos = allResults.findIndex(el => el.id === before);

//   const offsetResults = getOffsetResults(beforePos, afterPos, allResults);

//   const sizedResults =
//     beforePos !== -1 && afterPos !== -1 && offsetResults.length > size
//       ? offsetResults
//       : beforePos !== -1
//       ? offsetResults
//           .reverse()
//           .slice(0, size)
//           .reverse()
//       : offsetResults.slice(0, size);

//   console.log(allResults.length);
//   console.log(
//     allResults[allResults.length - 1].id === allResults[afterPos + size].id
//   );

//   return {
//     results: sizedResults,
//     ...(sizedResults.length > 0 &&
//     allResults[allResults.length - 1].id !== allResults[afterPos + size].id
//       ? {
//           after: buildUrl({
//             size,
//             q,
//             after: sizedResults[sizedResults.length - 1].id
//           })
//         }
//       : {}),
//     ...(sizedResults.length > 0 && allResults[0].id !== sizedResults[0].id
//       ? { before: buildUrl({ size, q, before: sizedResults[0].id }) }
//       : {})
//   };
// };

// const getReviews = (
//   { countries = [], size = 10, after = 0, before = 0, q = "" },
//   buildUrl
// ) => {
//   if (countries.length > 0) {
//     return reviewsByGeography({ countries, size, after, before, q }, buildUrl);
//   } else {
//     return allReviews({ size, after, before, q }, buildUrl);
//   }
// };

// module.exports = {
//   reviewsByIds,
//   reviewsByGeography,
//   getReviews
// };
