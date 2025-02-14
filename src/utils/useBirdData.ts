// useBirdData.ts
import { useEffect, useState } from "react";
import { BirdFamily, BirdSpecies } from "../types/types.tsx";
import { calculateTotalBirds, parseBirdData } from "./birdUtils.ts";

const useBirdData = () => {
  const [families, setFamilies] = useState<BirdFamily[]>([]);
  const [totalBirds, setTotalBirds] = useState(0);
  const [spottedBirds, setSpottedBirds] = useState(0);

  useEffect(() => {
    const loadBirdData = async () => {
      try {
        const response = await fetch(`./birds.txt`);
        const textData = await response.text();
        const parsedFamilies = parseBirdData(textData);

        // Add type annotation to the filter callback parameter
        const allSpotted = parsedFamilies.flatMap((f) =>
          f.species.filter((s: BirdSpecies) => s.spotted)
        );

        setFamilies(parsedFamilies);
        setTotalBirds(calculateTotalBirds(parsedFamilies));
        setSpottedBirds(allSpotted.length);
      } catch (error) {
        console.error("Error loading bird data:", error);
      }
    };

    loadBirdData();
  }, []);

  return { families, totalBirds, spottedBirds };
};

export default useBirdData;
