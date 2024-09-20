import * as d3 from "d3";

// inclusive
function ticksExact(start, stop, count) {
  return d3.range(count).map((i) => (i / (count - 1)) * (stop - start) + start);
}
function invLerp(x, a, b) {
  return (x - a) / (b - a);
}

export { ticksExact, invLerp };
