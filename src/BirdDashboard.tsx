// BirdDashboard.tsx
import React, { useState, useCallback } from 'react';
import { BirdFamily, BirdSpecies, INITIAL_EXPANDED_STATE, ExpandedSpeciesState } from './types/types.tsx';
import { getTrackerTitle } from './utils/birdUtils.ts';
import useBirdData from './utils/useBirdData.ts';
import { SpeciesCard, FamilyCard } from './components/BirdCard.tsx';
import ExpandedImage from './components/ExpandedImage.tsx';
import styles from './BirdDashboard.module.css';

const BirdDashboard = () => {
  const { families, totalBirds, spottedBirds } = useBirdData();
  const [expandedSpecies, setExpandedSpecies] = useState<ExpandedSpeciesState>(INITIAL_EXPANDED_STATE);

  const handleCardClick = useCallback((species: BirdSpecies, familyName: string) => {
    const allSpotted = families.flatMap(f => 
      f.species.filter(s => s.spotted)
    );
    
    setExpandedSpecies({
      species,
      family: familyName,
      allSpotted,
      currentIndex: allSpotted.findIndex(s => s.index === species.index)
    });
  }, [families]);

  const handleNavigation = useCallback((direction: 'prev' | 'next') => {
    setExpandedSpecies(prev => {
      const newIndex = direction === 'prev' ? prev.currentIndex - 1 : prev.currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.allSpotted.length) return prev;
      
      const species = prev.allSpotted[newIndex];
      const family = families.find(f => 
        f.species.some(s => s.index === species.index)
      )?.family || '';
      
      return { ...prev, species, family, currentIndex: newIndex };
    });
  }, [families]);

  const handleClose = useCallback(() => setExpandedSpecies(INITIAL_EXPANDED_STATE), []);
  const handlePrev = useCallback(() => handleNavigation('prev'), [handleNavigation]);
  const handleNext = useCallback(() => handleNavigation('next'), [handleNavigation]);

  const renderFamilySection = (family: BirdFamily) => (
    <React.Fragment key={family.family}>
      <FamilyCard 
        family={family} 
        onImageClick={() => handleCardClick(family.species[0], family.family)} 
      />
      {family.species.map(species => (
        <SpeciesCard
          key={species.index}
          species={species}
          onImageClick={() => handleCardClick(species, family.family)}
        />
      ))}
    </React.Fragment>
  );

  return (   
     <div className={styles.birdContainer}>
  <h1 className={styles.birdTrackerTitle}>
    {getTrackerTitle(spottedBirds, totalBirds)}
  </h1>
  <div className={styles.speciesGrid}>
    {families.map(renderFamilySection)}
  </div>
      <ExpandedImage 
        {...expandedSpecies}
        onClose={handleClose}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
};

export default React.memo(BirdDashboard);