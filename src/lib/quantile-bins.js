import * as d3 from "d3";
import { distributeQuantiles } from "./utils";

// inclusive
function ticksExact(start, stop, count) {
  return d3.range(count).map((i) => (i / (count - 1)) * (stop - start) + start);
}

function quantileBins(
  width,
  height,
  unitsPerQuantile = undefined,
  range = undefined
) {
  return function (data) {
    unitsPerQuantile = unitsPerQuantile || 1;
    range = range || d3.extent(data);

    const numQuantiles = data.length / unitsPerQuantile;
    const histBins = d3
      .bin()
      .value((d) => d)
      .domain(range)
      .thresholds(
        ticksExact(...range, Math.ceil(width / (height / numQuantiles)))
      )(data);

    const binnedQuantiles = distributeQuantiles(
      histBins,
      unitsPerQuantile,
      numQuantiles
    );

    const quantiles = [];

    for (let b = 0; b < binnedQuantiles.length; b++) {
      for (let y = 0; y < binnedQuantiles[b]; y++) {
        quantiles.push([
          (histBins[b].x1 + histBins[b].x0) / 2,
          ((y + 0.5) / numQuantiles) * data.length,
        ]);
      }
    }

    return quantiles;
  };
}

export { quantileBins };
