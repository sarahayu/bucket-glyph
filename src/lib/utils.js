import * as d3 from "d3";

function distributeQuantiles(numericBins, unitsPerQuantile, maxQuantiles) {
  let quantileBins = numericBins.map((bin) =>
    Math.round(bin.length / unitsPerQuantile)
  );
  let sum = d3.sum(quantileBins);

  while (sum > maxQuantiles) {
    quantileBins[
      d3.minIndex(numericBins, (d, i) =>
        d.length !== 0
          ? d.length / unitsPerQuantile - quantileBins[i]
          : Infinity
      )
    ] -= 1;

    sum = d3.sum(quantileBins);
  }

  while (sum < maxQuantiles) {
    quantileBins[
      d3.maxIndex(numericBins, (d, i) =>
        d.length !== 0
          ? d.length / unitsPerQuantile - quantileBins[i]
          : -Infinity
      )
    ] += 1;

    sum = d3.sum(quantileBins);
  }

  return quantileBins;
}

const interpolateWatercolorBlue = (i) =>
  d3.interpolateBlues(d3.scaleLinear([0.2, 1.0])(i));

function levelToDropletLevel(p) {
  p -= 0.0088;
  return Math.max(
    0,
    (3.1304 * p ** 3 - 4.2384 * p ** 2 + 3.3471 * p + 0.0298) / 2.2326
  );
}

const WATERDROP_ICON = {
  draw: function (context, size) {
    context.moveTo(0, -size / 2);
    context.lineTo(size / 4, -size / 4);

    context.arc(0, 0, size / Math.SQRT2 / 2, -Math.PI / 4, (Math.PI * 5) / 4);
    context.lineTo(0, -size / 2);
    context.closePath();
  },
};

export {
  distributeQuantiles,
  interpolateWatercolorBlue,
  levelToDropletLevel,
  WATERDROP_ICON,
};
