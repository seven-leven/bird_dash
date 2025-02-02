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
      onClick={isClickable ? onImageClick : undefined}
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
        imagePath=""   // No image needed.
        fallbackPath=""// No fallback needed.
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
  const imagePath = species.spotted 
    ? `${process.env.PUBLIC_URL}/pictures/${species.index}.png` 
    : `${process.env.PUBLIC_URL}/placeholder_bird.png`;
  const fallbackPath = `${process.env.PUBLIC_URL}/placeholder_bird.png`;

  return (
    <BirdCard
      imagePath={imagePath}
      fallbackPath={fallbackPath}
      index={species.index}
      name={species.name}
      isClickable={species.spotted}
      onImageClick={() => onImageClick(imagePath)}
    />
  );
});