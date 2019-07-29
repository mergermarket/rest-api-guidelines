const ReviewIterator = (iterable = []) => {
  const items = iterable;
  let index = 0;

  const current = () => {
    return items[index];
  };

  const setCursor = newCursor => {
    index = newCursor;
  };

  const next = () => {
    if (hasNext()) {
      const idx = ++index;
      return items[idx];
    } else {
      return null;
    }
  };
  const previous = () => {
    if (hasPrev()) {
      let idx = --index;
      return items[idx];
    } else {
      return null;
    }
  };

  const hasNext = () => index + 1 < items.length;
  const hasPrev = () => index > 0;

  return {
    next,
    previous,
    current,
    setCursor,
    hasNext,
    hasPrev
  };
};

module.exports = ReviewIterator;
