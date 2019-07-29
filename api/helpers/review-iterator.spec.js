const ReviewIterator = require("./review-iterator");

describe("iterator", () => {
  test("can iterate forwards", () => {
    const iterator = ReviewIterator(["a", "b", "c", "d", "e", "f", "g"]);
    expect(iterator.current()).toEqual("a");
    expect(iterator.next()).toEqual("b");
    expect(iterator.next()).toEqual("c");
    expect(iterator.previous()).toEqual("b");
  });
  test("cant iterate beyond the end of the array", () => {
    const iterator = ReviewIterator(["a", "b", "c", "d"]);
    expect(iterator.next()).toEqual("b"); //b
    expect(iterator.next()).toEqual("c");
    expect(iterator.next()).toEqual("d");
    expect(iterator.next()).toEqual(null);
  });
  test("cant iterate beyond the start of the array", () => {
    const iterator = ReviewIterator(["a", "b", "c", "d"]);
    expect(iterator.next()).toEqual("b"); //b
    expect(iterator.next()).toEqual("c");
    expect(iterator.next()).toEqual("d");
    expect(iterator.next()).toEqual(null);
    expect(iterator.previous()).toEqual("c");
    expect(iterator.previous()).toEqual("b");
    expect(iterator.previous()).toEqual("a");
    expect(iterator.previous()).toEqual(null);
  });
  //   test("can iterate forwards multiple times", () => {
  //     const iterator = ReviewIterator(["a", "b", "c", "d", "e", "f", "g"]);
  //     expect(iterator.next()).toEqual(1);
  //     expect(iterator.next()).toEqual(2);
  //     expect(iterator.next()).toEqual(3);
  //   });
  //   test("can iterate backwards", () => {
  //     const iterator = ReviewIterator(["a", "b", "c", "d", "e", "f", "g"]);
  //     expect(iterator.next()).toEqual(1);
  //     expect(iterator.next()).toEqual(2);
  //     expect(iterator.previous()).toEqual(1);
  //   });
});
