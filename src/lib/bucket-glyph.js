import * as d3 from "d3";

const DEGREE_SWAY = 40;
const LINE_WIDTH = 3;

let maskCounter = 0;

// ensures every mask id is unique
function getMaskId() {
  return maskCounter++;
}

function bucketGlyph(width, height, valueToLevelFn = d3.scaleLinear()) {
  return function (data) {
    return data.map((d) => ({
      x: -width,
      y: height - valueToLevelFn(d) * height - height / 2,
      width: width * 2,
      height: height * 2,
    }));
  };
}

function transitionSway(rects, multiplier = 1) {
  // save previous value; we'll need it to calculate how much to sway between renders
  rects.each(function (d) {
    const s = d3.select(this);
    const prevLevel = s.attr("cur-level") || 0;

    s.attr("prev-level", prevLevel);
    s.attr("cur-level", d.y);
  });

  rects
    .transition("liquidSway")
    .duration(2000)
    .delay((_, i) => i * 10)
    .ease(d3.easeQuad)
    .attrTween("transform", function (d, i) {
      const s = d3.select(this);
      const prevLiquidLevel = parseFloat(s.attr("prev-level"));
      const diff = (Math.abs(prevLiquidLevel - d.y) / 200) * multiplier;
      return (t) =>
        `rotate(${
          Math.sin(
            Math.min((Math.PI * 4 * t) / (0.5 * diff + 0.5), Math.PI * 4)
          ) *
          diff *
          DEGREE_SWAY *
          (1 - t)
        }, ${0}, ${0})`;
    });

  const levelTransition = rects
    .transition("liquidLevel")
    .ease(d3.easeElasticOut.period(0.6))
    .delay((_, i) => i * (100 / rects.size()))
    .duration(1000);

  return levelTransition;
}

function bucketShape(
  width,
  height,
  shapeFunc = drawBucketMask,
  shapeOutlineFunc = shapeFunc
) {
  return function (s) {
    const id = getMaskId();

    s.append("defs")
      .attr("class", "clip-def")
      .append("clipPath")
      .attr("id", "bucket-mask-" + id)
      .append("path")
      .attr("class", "bucket-mask-path");

    s.append("g")
      .attr("class", "masked-area")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .attr("clip-path", `url(#bucket-mask-${id})`);

    s.append("path")
      .attr("class", "bucket-outline")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)
      .attr("stroke", "lightgray")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", LINE_WIDTH)
      .attr("fill", "none");

    s.call(
      bucketShapeMask({
        drawFunc: shapeFunc,
        drawOutlineFunc: shapeOutlineFunc,
        width,
        height,
      })
    );
  };
}

function bucketShapeMask({
  drawFunc,
  drawOutlineFunc = drawFunc,
  width,
  height,
}) {
  return function (s) {
    const getPath = (fn) => {
      const path = d3.path();
      fn(path, width, height);
      return path.toString();
    };

    s.select(".bucket-mask-path").attr("d", getPath(drawFunc));
    s.select(".bucket-outline").attr("d", getPath(drawOutlineFunc));
  };
}

function drawBucketMask(context, width, height) {
  drawBucket(context, width, height, true);
}

function drawBucketOutline(context, width, height) {
  drawBucket(context, width, height, false);
}

function drawBucket(context, width, height, closed) {
  const taper = 0.8;
  const bottomRight = (width * taper) / 2,
    bottomLeft = -(width * taper) / 2;

  context.moveTo(width / 2, -height / 2);
  context.lineTo(bottomRight, height / 2);
  context.lineTo(bottomLeft, height / 2);
  context.lineTo(-width / 2, -height / 2);

  if (closed) context.closePath();
}

function drawDroplet(context, width, height) {
  const hypToRad = Math.SQRT2;

  // dimensions in "rad" units
  const dropHeight = 1 + 1 * hypToRad;

  const radToHeight = 1 / dropHeight;

  const rad = Math.min(width / 2, height * radToHeight);
  const hyp = rad / (1 / hypToRad);
  const heightActual = rad + hyp;

  context.moveTo(0, -heightActual / 2);
  context.lineTo(hyp / 2, -heightActual / 2 + hyp / 2);
  context.arc(0, -heightActual / 2 + hyp, rad, -Math.PI / 4, (Math.PI * 5) / 4);
  context.closePath();
}

export {
  bucketGlyph,
  transitionSway,
  bucketShape,
  bucketShapeMask,
  drawBucketMask,
  drawBucketOutline,
  drawDroplet,
};
