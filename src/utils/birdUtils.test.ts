// src\utils\birdUtils.test.ts
import {
  calculateTotalBirds,
  getTrackerTitle,
  parseBirdData,
} from "./birdUtils.ts";
import { assertEquals, assertObjectMatch } from "jsr:@std/assert";
import type { BirdFamily } from "../types/types.tsx"; // Update the import path

// Tests for calculateTotalBirds
Deno.test("calculateTotalBirds: handles empty families array", () => {
  assertEquals(calculateTotalBirds([]), 0);
});

Deno.test("calculateTotalBirds: sums single family species", () => {
  const families: BirdFamily[] = [{
    family: "Raptors",
    species: [
      { index: 1, name: "Golden Eagle", spotted: false },
      { index: 2, name: "Red Kite", spotted: true },
    ],
  }];
  assertEquals(calculateTotalBirds(families), 2);
});

Deno.test("calculateTotalBirds: handles multiple families", () => {
  const families: BirdFamily[] = [
    {
      family: "Songbirds",
      species: [
        { index: 1, name: "Nightingale", spotted: true },
      ],
    },
    {
      family: "Waterfowl",
      species: [
        { index: 2, name: "Mallard", spotted: false },
        { index: 3, name: "Swan", spotted: true },
      ],
    },
  ];
  assertEquals(calculateTotalBirds(families), 3);
});

// Tests for getTrackerTitle
Deno.test("getTrackerTitle: formats numbers correctly", () => {
  assertEquals(getTrackerTitle(3, 10), "Bird Tracker 3/10");
});

Deno.test("getTrackerTitle: handles zero values", () => {
  assertEquals(getTrackerTitle(0, 0), "Bird Tracker 0/0");
  assertEquals(getTrackerTitle(0, 5), "Bird Tracker 0/5");
});

// Tests for parseBirdData
Deno.test("parseBirdData: handles basic structure", () => {
  const input = `
      Accipitridae
      1\tRed-tailed Hawk
      2\tHarris's Hawk,2023-01-15
    `;
  const result = parseBirdData(input);

  assertEquals(result.length, 1);
  assertEquals(result[0].family, "Accipitridae");
  assertEquals(result[0].species.length, 2);

  assertObjectMatch(result[0].species[0], {
    index: 1,
    name: "Red-tailed Hawk",
    spotted: false,
  });

  assertObjectMatch(result[0].species[1], {
    index: 2,
    name: "Harris's Hawk",
    spotted: true,
    spottedDate: "2023-01-15",
  });
});

Deno.test("parseBirdData: trims whitespace", () => {
  const input = "  Falcons  \n  1  \t  Peregrine  ";
  const result = parseBirdData(input);

  assertEquals(result[0].family, "Falcons");
  assertEquals(result[0].species[0].name, "Peregrine");
});

Deno.test("parseBirdData: ignores orphan species", () => {
  const input = "1\tLonely Bird\n2\tAnother Bird";
  const result = parseBirdData(input);
  assertEquals(result.length, 0);
});

Deno.test("parseBirdData: skips malformed lines", () => {
    const input = "Valid Family\nInvalidLine\n2\tValid Species";
    const result = parseBirdData(input);
  
    // If "InvalidLine" were skipped, we’d expect one family ("Valid Family")
    // with one species. Adjust your parser if you need to enforce this behavior.
    assertEquals(result.length, 1, "Expected one valid family");
    assertEquals(result[0].family, "Valid Family", "Expected family to be 'Valid Family'");
    assertEquals(result[0].species.length, 1, "Expected one valid species");
    assertEquals(result[0].species[0].index, 2, "Expected species index to be 2");
    assertEquals(result[0].species[0].name, "Valid Species", "Expected species name to be 'Valid Species'");
  });

Deno.test("parseBirdData: handles multiple families", () => {
  const input = `
      Owls
      1\tBarn Owl
      Parrots
      2\tAfrican Grey
    `;
  const result = parseBirdData(input);

  assertEquals(result.length, 2);
  assertEquals(result[0].family, "Owls");
  assertEquals(result[1].family, "Parrots");
  assertEquals(result[0].species[0].name, "Barn Owl");
  assertEquals(result[1].species[0].name, "African Grey");
});

Deno.test("parseBirdData: handles spotted dates", () => {
  const input = "Birds\n1\tNo Date\n2\tWith Date,2023-05-05";
  const result = parseBirdData(input);

  assertEquals(result[0].species[0].spotted, false);
  assertEquals(result[0].species[1].spotted, true);
  assertEquals(result[0].species[1].spottedDate, "2023-05-05");
});

Deno.test("parseBirdData: ignores empty lines", () => {
  const input = "\n\nFamily\n\t\n1\tSpecies\n";
  const result = parseBirdData(input);
  assertEquals(result.length, 1);
  assertEquals(result[0].species.length, 1);
});
