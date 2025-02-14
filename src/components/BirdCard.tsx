// BirdCard.tsx
import React from 'react';
import styles from './BirdCard.module.css';
import { BirdCardProps, BirdSpecies, BirdFamily } from '../types/types';

const BirdCard = React.memo(({ 
  imagePath, 
  fallbackPath, 
  index, 
  name, 
  isClickable, 
  onImageClick 
}: BirdCardProps) => {
  return (
    <div 
      className={styles.birdCard}
      onClick={isClickable ? () => onImageClick(imagePath) : undefined}
      style={{
        backgroundImage: `url(${imagePath}), url(${fallbackPath})`,
        cursor: isClickable ? 'pointer' : 'default'
      }}
    >
      <div className={styles.birdIndex}>
        #{index.toString().padStart(3, '0')}
      </div>
      <div className={styles.birdNameContainer}>
        <p className={styles.birdName}>
          {name}
        </p>
      </div>
    </div>
  );
});

interface FamilyCardProps {
  family: BirdFamily;
  onImageClick: (imagePath: string) => void;
}

export const FamilyCard = React.memo(({ family, onImageClick }: FamilyCardProps) => {
  const spottedSpecies = family.species.filter(s => s.spotted);

  return (
    <div className={styles.familyCardWrapper}>
      <BirdCard
        imagePath=""   // No image needed
        fallbackPath=""// No fallback needed
        index={0}
        name={family.family}
        isClickable={spottedSpecies.length > 0}
        onImageClick={onImageClick}
      />
    </div>
  );
});

interface SpeciesCardProps {
  species: BirdSpecies;
  onImageClick: (imagePath: string) => void;
}

export const SpeciesCard = React.memo(({ species, onImageClick }: SpeciesCardProps) => {
  const baseURL = import.meta.env?.PUBLIC_URL || window.location.origin;

  const imagePath = species.spotted 
    ? `./pictures/${species.index}.png` 
    : `./placeholder_bird.png`;
  const fallbackPath = `./placeholder_bird.png`;

  return (
    <BirdCard
      imagePath={imagePath}
      fallbackPath={fallbackPath}
      index={species.index}
      name={species.name}
      isClickable={species.spotted}
      onImageClick={onImageClick}
    />
  );
});