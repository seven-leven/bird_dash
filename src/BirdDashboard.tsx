// BirdDashboard.tsx
import React, { useCallback, useState } from "react";
import {
  BirdFamily,
  BirdSpecies,
  ExpandedSpeciesState,
  INITIAL_EXPANDED_STATE,
} from "./types/types.tsx";
import { getTrackerTitle } from "./utils/birdUtils.ts";
import useBirdData from "./utils/useBirdData.ts";
import { FamilyCard, SpeciesCard } from "./components/BirdCard.tsx";
import ExpandedImage from "./components/ExpandedImage.tsx";
import { FamilySkeleton, SpeciesSkeleton } from "./components/Skeleton.tsx";
import styles from "./BirdDashboard.module.css";

const BirdDashboard: React.FC = () => {
  // Retrieve bird data from the custom hook
  const { families, totalBirds, spottedBirds } = useBirdData();

  // Determine a loading state based on the data provided by the hook
  const isLoading = families.length === 0 && totalBirds === 0 &&
    spottedBirds === 0;

  // Expanded species state (using a shared type so ExpandedImage can consume it)
  const [expandedSpecies, setExpandedSpecies] = useState<ExpandedSpeciesState>(
    INITIAL_EXPANDED_STATE,
  );

  // Handler for when a card is clicked. It figures out the index within the spotted species list.
  const handleCardClick = useCallback(
    (species: BirdSpecies, familyName: string) => {
      const allSpotted = families.flatMap((f) =>
        f.species.filter((s) => s.spotted)
      );
      const currentIndex = allSpotted.findIndex((s) =>
        s.index === species.index
      );
      setExpandedSpecies({
        species,
        family: familyName,
        allSpotted,
        currentIndex,
      });
    },
    [families],
  );

  // Navigation handler for the expanded image view
  const handleNavigation = useCallback((direction: "prev" | "next") => {
    setExpandedSpecies((prev) => {
      const newIndex = direction === "prev"
        ? prev.currentIndex - 1
        : prev.currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.allSpotted.length) return prev;

      const species = prev.allSpotted[newIndex];
      const family = families.find((f) =>
        f.species.some((s) => s.index === species.index)
      )?.family || "";

      return { ...prev, species, family, currentIndex: newIndex };
    });
  }, [families]);

  const handleClose = useCallback(
    () => setExpandedSpecies(INITIAL_EXPANDED_STATE),
    [],
  );
  const handlePrev = useCallback(() => handleNavigation("prev"), [
    handleNavigation,
  ]);
  const handleNext = useCallback(() => handleNavigation("next"), [
    handleNavigation,
  ]);

  // Render each family section, which includes the FamilyCard and its SpeciesCards
  const renderFamilySection = useCallback(
    (family: BirdFamily) => (
      <React.Fragment key={family.family}>
        <FamilyCard
          family={family}
          onImageClick={() => handleCardClick(family.species[0], family.family)}
        />
        {family.species.map((species) => (
          <SpeciesCard
            key={species.index}
            species={species}
            onImageClick={() => handleCardClick(species, family.family)}
          />
        ))}
      </React.Fragment>
    ),
    [handleCardClick],
  );

  // If still loading, show skeleton loaders.
  if (isLoading) {
    return (
      <div className={styles.birdContainer}>
        <h1 className={styles.birdTrackerTitle}>Loading...</h1>
        <div className={styles.speciesGrid}>
          {Array.from({ length: 3 }).map((_, familyIndex) => (
            <React.Fragment key={familyIndex}>
              <FamilySkeleton />
              {Array.from({ length: 3 }).map((_, speciesIndex) => (
                <SpeciesSkeleton key={speciesIndex} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.birdContainer}>
      <h1 className={styles.birdTrackerTitle}>
        {getTrackerTitle(spottedBirds, totalBirds)}
      </h1>
      <div className={styles.speciesGrid}>
        {families.map(renderFamilySection)}
      </div>
      {expandedSpecies.species && (
        <ExpandedImage
          {...expandedSpecies}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  );
};

export default React.memo(BirdDashboard);
