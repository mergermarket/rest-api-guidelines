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
  test("gets a slice of the results", () => {
    const after = 0;
    const before = 2;
    const reviews = service.getOffsetResults(after, before, [1, 2, 3, 4, 5]);
    expect(reviews.length).toEqual(1);
  });
  test("if start and end positions are -1 then return all results", () => {
    const after = -1;
    const before = -1;
    const reviews = service.getOffsetResults(after, before, [1, 2, 3, 4, 5]);
    expect(reviews.length).toEqual(5);
  });
  test("if end position is -1 then return from the start position to the end", () => {
    const after = 2;
    const before = -1;
    const reviews = service.getOffsetResults(after, before, [1, 2, 3, 4, 5]);
    expect(reviews).toEqual([4, 5]);
  });
  test("if start position is -1 then return from the first item to the end position", () => {
    const after = -1;
    const before = 3;
    const reviews = service.getOffsetResults(after, before, [1, 2, 3, 4, 5]);
    expect(reviews).toEqual([1, 2, 3, 4]);
  });
});
