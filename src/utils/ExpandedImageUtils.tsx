import React from "react";

interface NavigationArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  showPrev: boolean;
  showNext: boolean;
}

export const NavigationArrows: React.FC<NavigationArrowsProps> = ({
  onPrev,
  onNext,
  showPrev,
  showNext,
}) => {
  return (
    <div className="navigation-arrows">
      {showPrev
        ? (
          <button
            className="arrow prev"
            onClick={onPrev}
            aria-label="Previous Image"
          >
            &#8249;
          </button>
        )
        : (
          // Invisible placeholder to maintain layout
          <div className="arrow placeholder" />
        )}
      {showNext
        ? (
          <button
            className="arrow next"
            onClick={onNext}
            aria-label="Next Image"
          >
            &#8250;
          </button>
        )
        : <div className="arrow placeholder" />}
    </div>
  );
};

export const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button className="close-button" onClick={onClick} aria-label="Close">
    &times;
  </button>
);

export const ZoomControls: React.FC<{
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
}> = ({ scale, setScale }) => {
  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));

  return (
    <div className="zoom-controls">
      <button onClick={zoomOut} aria-label="Zoom Out">-</button>
      <span>{(scale * 100).toFixed(0)}%</span>
      <button onClick={zoomIn} aria-label="Zoom In">+</button>
    </div>
  );
};
