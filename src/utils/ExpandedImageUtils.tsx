import React from 'react';

// Sub-components
export const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="close-button" onClick={onClick}>
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  </button>
);

export const NavigationArrows: React.FC<{ 
  onPrev?: () => void; 
  onNext?: () => void;
  showPrev: boolean;
  showNext: boolean;
}> = ({ onPrev, onNext, showPrev, showNext }) => (
  <div className="navigation-arrows">
    {showPrev && <button className="nav-arrow prev" onClick={onPrev}>&#10094;</button>}
    {showNext && <button className="nav-arrow next" onClick={onNext}>&#10095;</button>}
  </div>
);

export const ZoomControls: React.FC<{ 
  scale: number;
  setScale: (value: number) => void;
}> = ({ scale, setScale }) => (
  <div className="zoom-controls">
    <button onClick={() => setScale(1)}>Reset</button>
    <div className="zoom-buttons">
      <button onClick={() => setScale(Math.min(scale + 0.1, 3))}>+</button>
      <button onClick={() => setScale(Math.max(scale - 0.1, 0.5))}>-</button>
    </div>
  </div>
);
