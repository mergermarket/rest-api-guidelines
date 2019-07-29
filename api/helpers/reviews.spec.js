const ReviewsService = require("./reviews");

describe("get reviews by attributes", () => {
  let service;
  beforeEach(() => {
    service = ReviewsService([
      { id: 1, country: "England" },
      { id: 2, country: "England" },
      { id: 3, country: "Wales" },
      { id: 4, country: "Scotland" }
    ]);
  });
  test("get reviews by single attribute", () => {
    const reviews = service.reviewsByAttributes("country", ["England"]);
    expect(reviews.length).toEqual(2);
  });
  test("get reviews by single attribute", () => {
    const reviews = service.reviewsByAttributes("country", [
      "England",
      "Wales"
    ]);
    expect(reviews.length).toEqual(3);
  });
});

describe("filter reviews by string", () => {
  let service;
  beforeEach(() => {
    service = ReviewsService();
  });
  test("return reviews matching a string", () => {
    expect(
      service.reviewsByQuery(
        [
          { id: 1, country: "the quick brown fox" },
          { id: 2, country: "the quick brown bear" },
          { id: 3, country: "the quick brown owl" }
        ],
        "fox"
      ).length
    ).toEqual(1);

    expect(
      service.reviewsByQuery(
        [
          { id: 1, country: "the quick brown fox" },
          { id: 2, country: "the quick brown bear" },
          { id: 3, country: "the quick brown owl" }
        ],
        "the quick brown"
      ).length
    ).toEqual(3);
  });
});

describe("get slices of results by offset", () => {
  let service;
  beforeEach(() => {
    service = ReviewsService([]);
  });
  test("gets a slice of the results forwards", () => {
    const start = 0;
    const size = 4;
    const reviews = service.getOffsetResults({
      start,
      size,
      list: [1, 2, 3, 4, 5]
    });
    expect(reviews.results.length).toEqual(4);
    expect(reviews.results).toEqual([1, 2, 3, 4]);
  });
  test("gets a slice of the results backwards", () => {
    const start = 4;
    const size = 4;
    const reverse = true;
    const reviews = service.getOffsetResults({
      start,
      size,
      list: [1, 2, 3, 4, 5],
      reverse
    });
    expect(reviews.results.length).toEqual(4);
    expect(reviews.results).toEqual([2, 3, 4, 5]);
  });
  test("if start and size are not provided then return all results", () => {
    const reviews = service.getOffsetResults({
      list: [1, 2, 3, 4, 5]
    });
    expect(reviews.results.length).toEqual(5);
    expect(reviews.results).toEqual([1, 2, 3, 4, 5]);
  });
  test("if size is larger than the array slice then only return the maxium number of items", () => {
    const start = 4;
    const size = 4;
    const reviews = service.getOffsetResults({
      start,
      size,
      list: [1, 2, 3, 4, 5]
    });
    expect(reviews.results.length).toEqual(1);
    expect(reviews.results).toEqual([5]);
  });
  test("if size is goes beyond the start of the array then only return up to the start", () => {
    const start = 1;
    const size = 4;
    const reverse = true;
    const reviews = service.getOffsetResults({
      start,
      size,
      reverse,
      list: [1, 2, 3, 4, 5]
    });
    expect(reviews.results.length).toEqual(2);
    expect(reviews.results).toEqual([1, 2]);
  });
  test("return a valid after cursor", () => {
    const start = 0;
    const size = 2;
    const reviews = service.getOffsetResults({
      start,
      size,
      list: [1, 2, 3, 4, 5]
    });
    expect(reviews.results.length).toEqual(2);
    expect(reviews.results).toEqual([1, 2]);
    expect(reviews.after).toEqual(2);
  });
  test("doesn't return an after cursor if the last item in the list", () => {
    const start = 0;
    const reviews = service.getOffsetResults({
      start,
      list: [1, 2, 3, 4, 5]
    });
    expect(reviews.results.length).toEqual(5);
    expect(reviews.after).toEqual(null);
  });
  test("return a before after cursor", () => {
    const start = 3;
    const size = 2;
    const reverse = true;
    const reviews = service.getOffsetResults({
      start,
      size,
      list: [1, 2, 3, 4, 5],
      reverse
    });
    expect(reviews.results.length).toEqual(2);
    expect(reviews.results).toEqual([3, 4]);
    expect(reviews.before).toEqual(3);
  });
  test("doesn't return a before cursor if the first item in the list", () => {
    const start = 2;
    const reverse = true;
    const reviews = service.getOffsetResults({
      start,
      list: [1, 2, 3, 4, 5],
      reverse
    });
    expect(reviews.results.length).toEqual(3);
    expect(reviews.before).toEqual(null);
  });
  // test("if start and end positions are -1 then return all results", () => {
  //   const after = -1;
  //   const before = -1;
  //   const reviews = service.getOffsetResults(after, before, [1, 2, 3, 4, 5]);
  //   expect(reviews.results.length).toEqual(5);
  // });
  // test("if end position is -1 then return from the start position to the end", () => {
  //   const after = 2;
  //   const before = -1;
  //   const reviews = service.getOffsetResults(after, before, [1, 2, 3, 4, 5]);
  //   expect(reviews.results).toEqual([4, 5]);
  // });
  // test("if start position is -1 then return from the first item to the end position", () => {
  //   const after = -1;
  //   const before = 3;
  //   const reviews = service.getOffsetResults(after, before, [1, 2, 3, 4, 5]);
  //   expect(reviews.results).toEqual([1, 2, 3, 4]);
  // });
  // test("provides after cursor", () => {
  //   const after = 0;
  //   const before = 3;
  //   const size = 2;
  //   const reviews = service.getOffsetResults(
  //     after,
  //     before,
  //     ["a", "b", "c", "d", "e", "f", "g"],
  //     size
  //   );
  //   expect(reviews.results).toEqual(["b", "c"]);
  //   expect(reviews.after).toEqual("c");
  // });
  // test("does not provide after cursor if at the end of results", () => {
  //   const after = 6;
  //   const size = 2;
  //   const reviews = service.getOffsetResults(
  //     after,
  //     before,
  //     ["a", "b", "c", "d", "e", "f", "g"],
  //     size
  //   );
  //   expect(reviews.results).toEqual(["b", "c"]);
  //   expect(reviews.after).toEqual("c");
  // });
  // test.skip("doesn't provide a before cursor if at the end of the results set", () => {
  //   const after = 5;
  //   const size = 3;
  //   const reviews = service.getOffsetResults(
  //     after,
  //     before,
  //     ["a", "b", "c", "d", "e", "f", "g"],
  //     size
  //   );
  //   expect(reviews.results).toEqual(["f", "g"]);
  //   expect(reviews.after).toEqual("d");
  //   expect(reviews.before).toEqual(null);
  // });
});
