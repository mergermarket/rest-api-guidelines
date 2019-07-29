const alphabetically = (direction, key) => (a, b) =>
  direction === "+"
    ? a[key].localeCompare(b[key])
    : b[key].localeCompare(a[key]);

const numeric = (direction, key) => (a, b) =>
  direction === "+"
    ? parseInt(b[key]) - parseInt(a[key])
    : parseInt(a[key]) - parseInt(b[key]);

module.exports = {
  alphabetically,
  numeric
};
