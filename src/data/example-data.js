import * as d3 from "d3";
import callite_data from "./callite.json";

const MAX_VALUE = 10000;
const NUM_YEARS = 50;

function initializeExampleData() {
  console.log("DATA: loading example data");

  const yearData = [
    {
      name: "random",
      delivs: d3.range(NUM_YEARS).map((_, i) => Math.random() * MAX_VALUE),
    },
    {
      name: "always_100_perc",
      delivs: d3.range(NUM_YEARS).map(() => MAX_VALUE),
    },
    {
      name: "always_0_perc",
      delivs: d3.range(NUM_YEARS).map(() => 0),
    },
    {
      name: "always_50_perc",
      delivs: d3.range(NUM_YEARS).map(() => MAX_VALUE / 2),
    },
    {
      name: "uniform_50_perc",
      delivs: d3.range(NUM_YEARS).map((_, i) => (i / NUM_YEARS) * MAX_VALUE),
    },
    {
      name: "random_likes_small",
      delivs: d3.range(NUM_YEARS).map((_, i) => Math.random() ** 4 * MAX_VALUE),
    },
    {
      name: "random_likes_big",
      delivs: d3
        .range(NUM_YEARS)
        .map((_, i) => (1 - Math.random() ** 4) * MAX_VALUE),
    },
    {
      name: "random_but_consistent",
      delivs: d3
        .range(NUM_YEARS)
        .map((_, i) => (Math.random() / 10) * MAX_VALUE + MAX_VALUE / 3),
    },
    {
      name: "callite_0570",
      delivs: callite_data.callite_0570,
    },
    {
      name: "callite_0221",
      delivs: callite_data.callite_0221,
    },
    {
      name: "callite_0023",
      delivs: callite_data.callite_0023,
    },
  ];

  return yearData;
}

const exampleData = initializeExampleData();

export { MAX_VALUE, exampleData };
