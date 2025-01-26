// BirdCard.tsx
import React from 'react';
import { BirdSpecies } from '../types/types';

interface BirdCardProps {
  species: BirdSpecies;
  onImageClick: (imagePath: string) => void;
}

const BirdCard: React.FC<BirdCardProps> = ({ species, onImageClick }) => {
  const imagePath = species.spotted 
    ? `/pictures/${species.index}.png` 
    : '/placeholder_bird.png';
  const fallbackPath = '/placeholder_bird.png';

  return (
    <div 
      className="bird-card"
      onClick={() => species.spotted && onImageClick(imagePath)}
      style={{
        backgroundImage: `url(${imagePath}), url(${fallbackPath})`,
        cursor: species.spotted ? 'pointer' : 'default'
      }}
    >
      <div className="bird-index">
        #{species.index.toString().padStart(2, '0')}
      </div>
      <div className="bird-name-container">
        <p className="bird-name">
          {species.name}
        </p>
      </div>
    </div>
  );
};

export default BirdCard;