// ExpandedImage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ExpandedSpeciesState } from '../types/types.tsx';
import  {CloseButton, NavigationArrows, ZoomControls } from '../utils/ExpandedImageUtils.tsx';
import './ExpandedImage.css';


const ExpandedImage: React.FC<ExpandedSpeciesState & { 
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = React.memo(({ species, family, allSpotted, currentIndex, onClose, onPrev, onNext }) => {
  const [scale, setScale] = useState(1);
  const imageUrl = species?.spotted ? `${process.env.PUBLIC_URL}/pictures/${species.index}.png` : null;

  // Memoized zoom handlers
  const zoomIn = useCallback(() => setScale(s => Math.min(s + 0.1, 3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(s - 0.1, 0.5)), []);

  useEffect(() => {
    if (!imageUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': onPrev(); break;
        case 'ArrowRight': onNext(); break;
        case 'Escape': onClose(); break;
        case '+': zoomIn(); break;
        case '-': zoomOut(); break;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale(prev => Math.min(Math.max(0.5, prev + e.deltaY * -0.01), 3));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      setScale(1);
    };
  }, [imageUrl, onClose, onPrev, onNext, zoomIn, zoomOut]);

  if (!imageUrl) return null;

  return (
    <div className="expanded-image-overlay" onClick={onClose}>
      <div className="expanded-image-header">
        <div className="expanded-image-info">
          <div className="species-name">{species?.name}</div>
          <div className="family-name">{family}</div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <NavigationArrows 
        onPrev={onPrev}
        onNext={onNext}
        showPrev={currentIndex > 0}
        showNext={currentIndex < allSpotted.length - 1}
      />

      <div className="image-container">
        <img
          src={imageUrl}
          alt={`Expanded view of ${species?.name}`}
          className="expanded-image"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <ZoomControls scale={scale} setScale={setScale} />
    </div>
  );
});

export default ExpandedImage;