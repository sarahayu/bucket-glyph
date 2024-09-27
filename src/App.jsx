import React, {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Scrollama, Step } from "react-scrollama";
import * as d3 from "d3";

import {
  bucketGlyph,
  bucketShape,
  drawBucketMask,
  drawBucketOutline,
  drawDroplet,
  transitionSway,
} from "lib/bucket-glyph";
import { quantileBins } from "lib/quantile-bins";
import {
  interpolateWatercolorBlue,
  levelToDropletLevel,
  WATERDROP_ICON,
} from "lib/utils";

import { exampleData, MAX_VALUE } from "data/example-data";

import { invLerp, collideOffsetter, ticksExact } from "./utils";

const DEFAULT_GRAPH_DATA = exampleData[0].delivs.map(() => 0);
const DATA_RANGE = [0, MAX_VALUE];

export default function Main() {
  const [graphData, setGraphData] = useState(
    exampleData.map(() => DEFAULT_GRAPH_DATA)
  );
  const [sortedGraphData, setSortedGraphData] = useState(
    exampleData.map(() => DEFAULT_GRAPH_DATA)
  );

  const onStepEnter = useCallback(async function ({
    data: idx,
    direction,
    element,
  }) {
    d3.select(element).classed("focused", true);

    if (direction === "up" || idx === null) return;

    graphData[idx] = exampleData[idx].delivs;
    setGraphData([...graphData]);

    sortedGraphData[idx] = Array.from(graphData[idx]).sort((a, b) => a - b);
    setSortedGraphData([...sortedGraphData]);
  },
  []);

  const onStepExit = useCallback(async function ({
    data: idx,
    direction,
    element,
  }) {
    d3.select(element).classed("focused", false);

    if (direction === "down" || idx === null) return;

    graphData[idx] = DEFAULT_GRAPH_DATA;
    setGraphData([...graphData]);

    sortedGraphData[idx] = DEFAULT_GRAPH_DATA;
    setSortedGraphData([...sortedGraphData]);
  },
  []);

  return (
    <div className="main-scrolly">
      <Scrollama offset={0.5} onStepEnter={onStepEnter} onStepExit={onStepExit}>
        <Step data={null}>
          <IntroCard />
        </Step>
        {exampleData.map((_, i) => (
          <Step key={i} data={i}>
            <div className="example-vizes-card">
              <span>{exampleData[i].name}</span>
              <div className="vizes">
                <BarGraph data={graphData[i]} width={300} height={200} />
                <BucketGlyph
                  sortedData={sortedGraphData[i]}
                  width={150}
                  height={200}
                />
                <DropletGlyph
                  sortedData={sortedGraphData[i]}
                  width={200}
                  height={200}
                />
                <DotHistogramVert
                  data={graphData[i]}
                  width={160}
                  height={200}
                />
              </div>
            </div>
          </Step>
        ))}
        <Step data={null}>
          <div className="scroll-card">Scroll back up!</div>
        </Step>
      </Scrollama>
    </div>
  );
}

function BarGraph({ data, width, height }) {
  const CHART_MARGIN = { top: 40, right: 40, bottom: 40, left: 50 };

  const svgElement = useRef();

  useLayoutEffect(function initialize() {
    const svgContainer = svgElement.current
      .attr("width", width + CHART_MARGIN.left + CHART_MARGIN.right)
      .attr("height", height + CHART_MARGIN.top + CHART_MARGIN.bottom)
      .append("g")
      .attr("class", "svg-container")
      .attr("transform", `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);

    svgContainer.append("g").attr("class", "axis-x");
    svgContainer
      .append("g")
      .attr("class", "axis-y")
      .append("text")
      .attr("class", "axis-y-label")
      .text("Deliveries")
      .attr(
        "transform",
        `translate(${-CHART_MARGIN.left + 5}, ${height / 2}) rotate(-90)`
      );
  }, []);

  useLayoutEffect(
    function onDataChange() {
      const svgContainer = svgElement.current.select(".svg-container");

      const x = d3
        .scaleBand()
        .domain(data.map((_, i) => i))
        .range([0, width])
        .padding(0.4);
      const y = d3.scaleLinear().domain(DATA_RANGE).range([height, 0]);

      const xaxis = d3
        .axisBottom(x)
        .tickSize(0)
        .tickFormat((d) => `year ${d + 1}`)
        .tickValues(x.domain().filter((_, i) => i === 0 || (i + 1) % 10 === 0));

      svgContainer
        .select(".axis-x")
        .attr("opacity", 1)
        .attr("transform", `translate(0, ${height})`)
        .call(xaxis);
      svgContainer
        .select(".axis-y")
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

      svgContainer
        .selectAll(".bars")
        .data(data)
        .join("rect")
        .attr("class", "bars")
        .attr("x", (d, i) => x(i))
        .attr("width", x.bandwidth())
        .transition()
        .duration(500)
        .delay((d, i) => i * 10)
        .attr("y", (d) => y(d))
        .attr("height", (d) => height - y(d));
    },
    [data]
  );
  return (
    <svg
      className="bar-graph"
      ref={(e) => void (svgElement.current = d3.select(e))}
    ></svg>
  );
}

const PERCENTILE_LABELS = [
  "Maximum",
  "75th Percentile",
  "50th Percentile",
  "25th Percentile",
  "Minimum",
];

export function BucketGlyph({ sortedData, width, height, resolution = 4 }) {
  const LINE_WIDTH = 3;
  const GLYPH_MARGIN = {
    top: 30,
    right: LINE_WIDTH / 2,
    bottom: 30,
    left: 120,
  };

  const svgElement = useRef();

  useLayoutEffect(function initialize() {
    const svgContainer = svgElement.current
      .attr("width", width + GLYPH_MARGIN.left + GLYPH_MARGIN.right)
      .attr("height", height + GLYPH_MARGIN.top + GLYPH_MARGIN.bottom)
      .append("g")
      .attr("class", "graph-area")
      .attr("transform", `translate(${GLYPH_MARGIN.left},${GLYPH_MARGIN.top})`);

    svgContainer.call(
      bucketShape(width, height, drawBucketMask, drawBucketOutline)
    );
  }, []);

  useLayoutEffect(
    function onDataChange() {
      // liquid levels
      const liquidLevels = ticksExact(1, 0, resolution + 1).map(
        (p) => d3.quantile(sortedData, p) / MAX_VALUE
      );

      const glyph = bucketGlyph(width, height);
      const data = glyph(liquidLevels);

      const liquids = svgElement.current
        .select(".masked-area")
        .selectAll(".bucket-box")
        .data(data)
        .join("rect")
        .attr("class", "bucket-box")
        .attr("width", (d) => d.width)
        .attr("height", (d) => d.height)
        .attr("x", (d) => d.x)
        .attr("fill", (_, i) => interpolateWatercolorBlue(i / resolution));

      transitionSway(liquids).attr("y", (d) => d.y);

      // percentile labels that appear on the side
      const reverseData = data.reverse();

      const labelWidth = 80,
        labelHeight = 15;

      const xOffset = collideOffsetter(reverseData, labelHeight);

      const tagElem = (s) =>
        s.append("g").call((s) => {
          s.append("rect");
          s.append("text");
        });

      const labels = svgElement.current
        .select(".graph-area")
        .selectAll(".bucket-label")
        .data(reverseData)
        .join(tagElem)
        .attr("class", "bucket-label")
        .transition()
        .attr(
          "transform",
          (d, i) =>
            `translate(${-labelWidth / 2 - 3 + xOffset(i)}, ${
              d.y + height / 2
            })`
        );

      labels
        .select("text")
        .text((_, i) => PERCENTILE_LABELS[data.length - 1 - i])
        .style("fill", (_, i) => (i > data.length / 2 ? "black" : "white"));

      labels
        .select("rect")
        .attr("width", labelWidth)
        .attr("height", labelHeight)
        .attr("x", -labelWidth / 2)
        .attr("y", -labelHeight / 2)
        .attr("rx", 3)
        .style("fill", (_, i) =>
          interpolateWatercolorBlue((data.length - 1 - i) / resolution)
        );
    },
    [sortedData]
  );

  return <svg ref={(e) => void (svgElement.current = d3.select(e))}></svg>;
}

export function DropletGlyph({ sortedData, width, height, resolution = 4 }) {
  const LINE_WIDTH = 3;
  const GLYPH_MARGIN = {
    top: 30,
    right: LINE_WIDTH / 2,
    bottom: 30,
    left: 100,
  };

  const svgElement = useRef();

  useLayoutEffect(function initialize() {
    const svgContainer = svgElement.current
      .attr("width", width + GLYPH_MARGIN.left + GLYPH_MARGIN.right)
      .attr("height", height + GLYPH_MARGIN.top + GLYPH_MARGIN.bottom)
      .append("g")
      .attr("class", "graph-area")
      .attr("transform", `translate(${GLYPH_MARGIN.left},${GLYPH_MARGIN.top})`);

    svgContainer.call(bucketShape(height, width, drawDroplet));
  }, []);

  useLayoutEffect(
    function onDataChange() {
      // liquid levels
      const liquidLevels = ticksExact(1, 0, resolution + 1).map((p) =>
        invLerp(d3.quantile(sortedData, p), ...DATA_RANGE)
      );

      const glyph = bucketGlyph(height, width, levelToDropletLevel);
      const data = glyph(liquidLevels);

      const liquids = svgElement.current
        .select(".masked-area")
        .selectAll(".bucket-box")
        .data(data)
        .join("rect")
        .attr("class", "bucket-box")
        .attr("width", (d) => d.width)
        .attr("height", (d) => d.height)
        .attr("x", (d) => d.x)
        .attr("fill", (_, i) => interpolateWatercolorBlue(i / resolution));

      transitionSway(liquids).attr("y", (d) => d.y);

      // percentile labels that appear on the side
      const reverseData = data.reverse();

      const labelWidth = 80,
        labelHeight = 15;

      const xOffset = collideOffsetter(reverseData, labelHeight);

      const tagElem = (s) =>
        s.append("g").call((s) => {
          s.append("rect");
          s.append("text");
        });

      const labels = svgElement.current
        .select(".graph-area")
        .selectAll(".bucket-label")
        .data(reverseData)
        .join(tagElem)
        .attr("class", "bucket-label")
        .transition()
        .attr(
          "transform",
          (d, i) =>
            `translate(${-labelWidth / 2 + xOffset(i)}, ${d.y + height / 2})`
        );

      labels
        .select("text")
        .text((_, i) => PERCENTILE_LABELS[data.length - 1 - i])
        .style("fill", (_, i) => (i > data.length / 2 ? "black" : "white"));

      labels
        .select("rect")
        .attr("width", labelWidth)
        .attr("height", labelHeight)
        .attr("x", -labelWidth / 2)
        .attr("y", -labelHeight / 2)
        .attr("rx", 3)
        .style("fill", (_, i) =>
          interpolateWatercolorBlue((data.length - 1 - i) / resolution)
        );
    },
    [sortedData]
  );

  return <svg ref={(e) => void (svgElement.current = d3.select(e))}></svg>;
}

function DotHistogramHoriz({ data, width, height, numCircles = 25 }) {
  const CHART_MARGIN = { top: 40, right: 10, bottom: 40, left: 10 };

  const svgElement = useRef();

  useLayoutEffect(function initialize() {
    const svgContainer = svgElement.current
      .attr("width", width + CHART_MARGIN.left + CHART_MARGIN.right)
      .attr("height", height + CHART_MARGIN.top + CHART_MARGIN.bottom)
      .append("g")
      .attr("class", "graph-area")
      .attr("transform", `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);

    svgContainer
      .append("g")
      .attr("class", "axis-x")
      .append("text")
      .attr("transform", `translate(${width / 2}, ${30})`)
      .text("Deliveries");
  }, []);

  useLayoutEffect(
    function onDataChange() {
      const domain = [0, data.length];
      const x = d3.scaleLinear().domain(DATA_RANGE).range([0, width]);
      const y = d3.scaleLinear().domain(domain).range([height, 0]);

      const svgContainer = svgElement.current
        .select(".graph-area")
        .attr(
          "transform",
          `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`
        );

      svgContainer
        .select(".axis-x")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom().scale(x).tickFormat(d3.format(".2s")));

      const qbins = quantileBins(
        width,
        height,
        data.length / numCircles,
        DATA_RANGE
      );

      const svgCircles = svgElement.current
        .select(".graph-area")
        .selectAll(".icons")
        .data(qbins(data))
        .join((enter) => enter.append("g").call((s) => s.append("path")))
        .attr("class", "icons")
        .call((s) => {
          s.selectAll("path").attr(
            "d",
            d3.symbol(WATERDROP_ICON, height / numCircles)
          );
        });

      svgCircles
        .transition()
        .delay((_, i) => i * 10)
        .attr("transform", (d) => `translate(${x(d[0])},${y(d[1])})`);

      svgCircles.attr("fill", "steelblue");
    },
    [data]
  );

  return <svg ref={(e) => void (svgElement.current = d3.select(e))}></svg>;
}

function DotHistogramVert({ data, width, height, numCircles = 25 }) {
  const CHART_MARGIN = { top: 40, right: 10, bottom: 40, left: 45 };

  const svgElement = useRef();

  useLayoutEffect(function initialize() {
    const svgContainer = svgElement.current
      .attr("width", width + CHART_MARGIN.left + CHART_MARGIN.right)
      .attr("height", height + CHART_MARGIN.top + CHART_MARGIN.bottom)
      .append("g")
      .attr("class", "graph-area")
      .attr("transform", `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);

    svgContainer
      .append("g")
      .attr("class", "axis-y")
      .append("text")
      .attr("class", "axis-y-label")
      .attr(
        "transform",
        `translate(${-CHART_MARGIN.left + 5}, ${height / 2}) rotate(-90)`
      )
      .text("Deliveries");
  }, []);

  useLayoutEffect(
    function onDataChange() {
      const domain = [0, data.length];
      const x = d3.scaleLinear().domain(domain).range([0, width]);
      const y = d3.scaleLinear().domain(DATA_RANGE).range([height, 0]);

      const svgContainer = svgElement.current
        .select(".graph-area")
        .attr(
          "transform",
          `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`
        );

      svgContainer
        .select(".axis-y")
        .call(d3.axisLeft().scale(y).tickFormat(d3.format(".2s")));

      const qbins = quantileBins(
        height,
        width,
        data.length / numCircles,
        DATA_RANGE
      );

      const svgCircles = svgElement.current
        .select(".graph-area")
        .selectAll(".icons")
        .data(qbins(data))
        .join((enter) => enter.append("g").call((s) => s.append("path")))
        .attr("class", "icons")
        .call((s) => {
          s.selectAll("path").attr(
            "d",
            d3.symbol(WATERDROP_ICON, width / numCircles)
          );
        });

      svgCircles
        .transition()
        .delay((_, i) => i * 10)
        .attr("transform", (d) => `translate(${x(d[1])},${y(d[0])})`);

      svgCircles.attr("fill", "steelblue");
    },
    [data]
  );

  return <svg ref={(e) => void (svgElement.current = d3.select(e))}></svg>;
}

const IntroCard = forwardRef(function IntroCard(props, ref) {
  return (
    <div ref={ref} className="scroll-card">
      <p>
        <a target="_blank" href="https://github.com/sarahayu/bucket-glyph">
          Bucket Glyph
        </a>{" "}
        is a library of utility functions for rendering bucket glyphs, a
        heatmap-like visualization for numerical data, as well as quantile
        histograms, a variation of a classic histogram as explored by{" "}
        <a
          target="_blank"
          href="https://dl.acm.org/doi/10.1145/2858036.2858558"
        >
          Matthew Kay
        </a>
        .
      </p>
      <p>Scroll to view some example visualizations!</p>
    </div>
  );
});
