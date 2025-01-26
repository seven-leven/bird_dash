// BirdDashboard.tsx
import React, { useState } from 'react';
import { BirdFamily, BirdSpecies, INITIAL_EXPANDED_STATE, ExpandedSpeciesState } from '../types/types.tsx';
import { getTrackerTitle } from '../utils/birdUtils.ts';
import useBirdData from '../utils/useBirdData.ts';
import BirdCard from './BirdCard.tsx';
import ExpandedImage from './ExpandedImage.tsx';
import './BirdDashboard.css';

const BirdDashboard = () => {
  const { families, totalBirds, spottedBirds } = useBirdData();
  const [expandedSpecies, setExpandedSpecies] = useState<ExpandedSpeciesState>(INITIAL_EXPANDED_STATE);

  const handleCardClick = (species: BirdSpecies, familyName: string) => {
    const allSpotted = families.flatMap(f => 
      f.species.filter(s => s.spotted)
    );
    
    setExpandedSpecies({
      species,
      family: familyName,
      allSpotted,
      currentIndex: allSpotted.findIndex(s => s.index === species.index)
    });
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    setExpandedSpecies(prev => {
      const newIndex = direction === 'prev' ? prev.currentIndex - 1 : prev.currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.allSpotted.length) return prev;
      
      const species = prev.allSpotted[newIndex];
      const family = families.find(f => 
        f.species.some(s => s.index === species.index)
      )?.family || '';
      
      return { ...prev, species, family, currentIndex: newIndex };
    });
  };

  const renderFamilySection = (family: BirdFamily) => (
    <React.Fragment key={family.family}>
      <h2 className="family-title" data-text={family.family}>
        {family.family}
      </h2>
      {family.species.map(species => (
        <BirdCard
          key={species.index}
          species={species}
          onImageClick={() => handleCardClick(species, family.family)}
        />
      ))}
    </React.Fragment>
  );

  return (
    <div className="bird-container">
      <h1 className="bird-tracker-title">
        {getTrackerTitle(spottedBirds, totalBirds)}
      </h1>
      
      <div className="species-grid">
        {families.map(renderFamilySection)}
      </div>
      
      <ExpandedImage 
  {...expandedSpecies}
  onClose={() => setExpandedSpecies(INITIAL_EXPANDED_STATE)}
  onPrev={handleNavigation.bind(null, 'prev')}
  onNext={handleNavigation.bind(null, 'next')}
/>
    </div>
  );
};

export default BirdDashboard;