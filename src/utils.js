import * as d3 from "d3";

// inclusive
function ticksExact(start, stop, count) {
  return d3.range(count).map((i) => (i / (count - 1)) * (stop - start) + start);
}

function invLerp(x, a, b) {
  return (x - a) / (b - a);
}

function collideOffsetter(data, size) {
  const isTooClose = (i) => {
    if (i == 0) return false;
    return Math.abs(data[i - 1].y - data[i].y) < size;
  };

  let curXOffset = 0;

  const xOffset = (i) => {
    if (isTooClose(i)) return ++curXOffset * -3;
    return (curXOffset = 0);
  };

  return xOffset;
}

export { ticksExact, invLerp, collideOffsetter };
