import * as d3 from "d3";
import callite_data from "./callite.json";

function initializeExampleData() {
  console.log("DATA: loading example data");

  const MAX_VALUE = 1000;
  const NUM_YEARS = 50;

  const yearData = [
    {
      name: "random",
      delivs: d3.range(NUM_YEARS).map((_, i) => Math.random() * MAX_VALUE),
      range: [0, MAX_VALUE],
    },
    {
      name: "always_100_perc",
      delivs: d3.range(NUM_YEARS).map(() => MAX_VALUE),
      range: [0, MAX_VALUE],
    },
    {
      name: "always_0_perc",
      delivs: d3.range(NUM_YEARS).map(() => 0),
      range: [0, MAX_VALUE],
    },
    {
      name: "always_50_perc",
      delivs: d3.range(NUM_YEARS).map(() => MAX_VALUE / 2),
      range: [0, MAX_VALUE],
    },
    {
      name: "uniform_50_perc",
      delivs: d3.range(NUM_YEARS).map((_, i) => (i / NUM_YEARS) * MAX_VALUE),
      range: [0, MAX_VALUE],
    },
    {
      name: "random_likes_small",
      delivs: d3.range(NUM_YEARS).map((_, i) => Math.random() ** 4 * MAX_VALUE),
      range: [0, MAX_VALUE],
    },
    {
      name: "random_likes_big",
      delivs: d3
        .range(NUM_YEARS)
        .map((_, i) => (1 - Math.random() ** 4) * MAX_VALUE),
      range: [0, MAX_VALUE],
    },
    {
      name: "random_but_consistent",
      delivs: d3
        .range(NUM_YEARS)
        .map((_, i) => (Math.random() / 10) * MAX_VALUE + MAX_VALUE / 3),
      range: [0, MAX_VALUE],
    },
    // start real data
    {
      name: "callite_0570",
      delivs: callite_data.callite_0570,
      range: [0, 7000],
    },
    {
      name: "callite_0221",
      delivs: callite_data.callite_0221,
      range: [0, 7000],
    },
    {
      name: "callite_0023",
      delivs: callite_data.callite_0023,
      range: [0, 7000],
    },
  ];

  return yearData;
}

const exampleData = initializeExampleData();

export { exampleData };
