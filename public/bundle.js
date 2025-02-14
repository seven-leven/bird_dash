// src/index.tsx
import React5 from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

// src/BirdDashboard.tsx
import React4, { useState as useState3, useCallback as useCallback2 } from "react";

// src/types/types.tsx
var INITIAL_EXPANDED_STATE = {
  species: null,
  family: null,
  allSpotted: [],
  currentIndex: -1
};

// src/utils/birdUtils.ts
var calculateTotalBirds = (families) => {
  return families.reduce((acc, family) => acc + family.species.length, 0);
};
var getTrackerTitle = (spotted, total) => {
  return `Bird Tracker ${spotted}/${total}`;
};
var parseBirdData = (text) => {
  const lines = text.split("\n");
  const families = [];
  let currentFamily = null;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (!/^\d/.test(trimmed)) {
      currentFamily = { family: trimmed, species: [] };
      families.push(currentFamily);
    } else {
      const match = trimmed.match(/^(\d+)\t([^,]+)(?:,(\d{4}-\d{2}-\d{2}))?/);
      if (match && currentFamily) {
        const spotted = !!match[3];
        currentFamily.species.push({
          index: parseInt(match[1]),
          name: match[2].trim(),
          spotted,
          spottedDate: match[3] || void 0
        });
      }
    }
  });
  return families;
};

// src/utils/useBirdData.ts
import { useState, useEffect } from "react";
var useBirdData = () => {
  const [families, setFamilies] = useState([]);
  const [totalBirds, setTotalBirds] = useState(0);
  const [spottedBirds, setSpottedBirds] = useState(0);
  useEffect(() => {
    const loadBirdData = async () => {
      try {
        const baseURL = import.meta.env?.PUBLIC_URL || window.location.origin;
        const response = await fetch(`${baseURL}/birds.txt`);
        const textData = await response.text();
        const parsedFamilies = parseBirdData(textData);
        const allSpotted = parsedFamilies.flatMap(
          (f) => f.species.filter((s) => s.spotted)
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
var useBirdData_default = useBirdData;

// src/components/BirdCard.tsx
import React from "react";

// src/components/BirdCard.module.css
var BirdCard_default = {
  birdCard: "BirdCard_birdCard",
  birdIndex: "BirdCard_birdIndex",
  birdNameContainer: "BirdCard_birdNameContainer",
  birdName: "BirdCard_birdName",
  familyCardWrapper: "BirdCard_familyCardWrapper"
};

// src/components/BirdCard.tsx
var BirdCard = React.memo(({
  imagePath,
  fallbackPath,
  index,
  name,
  isClickable,
  onImageClick
}) => {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: BirdCard_default.birdCard,
      onClick: isClickable ? () => onImageClick(imagePath) : void 0,
      style: {
        backgroundImage: `url(${imagePath}), url(${fallbackPath})`,
        cursor: isClickable ? "pointer" : "default"
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: BirdCard_default.birdIndex }, "#", index.toString().padStart(3, "0")),
    /* @__PURE__ */ React.createElement("div", { className: BirdCard_default.birdNameContainer }, /* @__PURE__ */ React.createElement("p", { className: BirdCard_default.birdName }, name))
  );
});
var FamilyCard = React.memo(({ family, onImageClick }) => {
  const spottedSpecies = family.species.filter((s) => s.spotted);
  return /* @__PURE__ */ React.createElement("div", { className: BirdCard_default.familyCardWrapper }, /* @__PURE__ */ React.createElement(
    BirdCard,
    {
      imagePath: "",
      fallbackPath: "",
      index: 0,
      name: family.family,
      isClickable: spottedSpecies.length > 0,
      onImageClick
    }
  ));
});
var SpeciesCard = React.memo(({ species, onImageClick }) => {
  const baseURL = import.meta.env?.PUBLIC_URL || window.location.origin;
  const imagePath = species.spotted ? `${baseURL}/pictures/${species.index}.png` : `${baseURL}/placeholder_bird.png`;
  const fallbackPath = `${baseURL}/placeholder_bird.png`;
  return /* @__PURE__ */ React.createElement(
    BirdCard,
    {
      imagePath,
      fallbackPath,
      index: species.index,
      name: species.name,
      isClickable: species.spotted,
      onImageClick
    }
  );
});

// src/components/ExpandedImage.tsx
import React3, { useState as useState2, useEffect as useEffect2, useCallback } from "react";

// src/utils/ExpandedImageUtils.tsx
import React2 from "react";
var CloseButton = ({ onClick }) => /* @__PURE__ */ React2.createElement("button", { className: "close-button", onClick }, /* @__PURE__ */ React2.createElement("svg", { viewBox: "0 0 24 24", width: "24", height: "24" }, /* @__PURE__ */ React2.createElement("path", { fill: "currentColor", d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" })));
var NavigationArrows = ({ onPrev, onNext, showPrev, showNext }) => /* @__PURE__ */ React2.createElement("div", { className: "navigation-arrows" }, showPrev && /* @__PURE__ */ React2.createElement("button", { className: "nav-arrow prev", onClick: onPrev }, "\u276E"), showNext && /* @__PURE__ */ React2.createElement("button", { className: "nav-arrow next", onClick: onNext }, "\u276F"));
var ZoomControls = ({ scale, setScale }) => /* @__PURE__ */ React2.createElement("div", { className: "zoom-controls" }, /* @__PURE__ */ React2.createElement("button", { onClick: () => setScale(1) }, "Reset"), /* @__PURE__ */ React2.createElement("div", { className: "zoom-buttons" }, /* @__PURE__ */ React2.createElement("button", { onClick: () => setScale(Math.min(scale + 0.1, 3)) }, "+"), /* @__PURE__ */ React2.createElement("button", { onClick: () => setScale(Math.max(scale - 0.1, 0.5)) }, "-")));

// src/components/ExpandedImage.tsx
var ExpandedImage = React3.memo(({ species, family, allSpotted, currentIndex, onClose, onPrev, onNext }) => {
  const [scale, setScale] = useState2(1);
  const imageUrl = species?.spotted ? `${"."}/pictures/${species.index}.png` : null;
  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.1, 3)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 0.1, 0.5)), []);
  useEffect2(() => {
    if (!imageUrl) return;
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          onPrev();
          break;
        case "ArrowRight":
          onNext();
          break;
        case "Escape":
          onClose();
          break;
        case "+":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
      }
    };
    const handleWheel = (e) => {
      e.preventDefault();
      setScale((prev) => Math.min(Math.max(0.5, prev + e.deltaY * -0.01), 3));
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      setScale(1);
    };
  }, [imageUrl, onClose, onPrev, onNext, zoomIn, zoomOut]);
  if (!imageUrl) return null;
  return /* @__PURE__ */ React3.createElement("div", { className: "expanded-image-overlay", onClick: onClose }, /* @__PURE__ */ React3.createElement("div", { className: "expanded-image-header" }, /* @__PURE__ */ React3.createElement("div", { className: "expanded-image-info" }, /* @__PURE__ */ React3.createElement("div", { className: "species-name" }, species?.name), /* @__PURE__ */ React3.createElement("div", { className: "family-name" }, family)), /* @__PURE__ */ React3.createElement(CloseButton, { onClick: onClose })), /* @__PURE__ */ React3.createElement(
    NavigationArrows,
    {
      onPrev,
      onNext,
      showPrev: currentIndex > 0,
      showNext: currentIndex < allSpotted.length - 1
    }
  ), /* @__PURE__ */ React3.createElement("div", { className: "image-container" }, /* @__PURE__ */ React3.createElement(
    "img",
    {
      src: imageUrl,
      alt: `Expanded view of ${species?.name}`,
      className: "expanded-image",
      style: { transform: `scale(${scale})` },
      onClick: (e) => e.stopPropagation()
    }
  )), /* @__PURE__ */ React3.createElement(ZoomControls, { scale, setScale }));
});
var ExpandedImage_default = ExpandedImage;

// src/BirdDashboard.module.css
var BirdDashboard_default = {
  birdContainer: "BirdDashboard_birdContainer",
  birdTrackerTitle: "BirdDashboard_birdTrackerTitle",
  familyTitle: "BirdDashboard_familyTitle",
  speciesGrid: "BirdDashboard_speciesGrid"
};

// src/BirdDashboard.tsx
var BirdDashboard = () => {
  const { families, totalBirds, spottedBirds } = useBirdData_default();
  const [expandedSpecies, setExpandedSpecies] = useState3(INITIAL_EXPANDED_STATE);
  const handleCardClick = useCallback2((species, familyName) => {
    const allSpotted = families.flatMap(
      (f) => f.species.filter((s) => s.spotted)
    );
    setExpandedSpecies({
      species,
      family: familyName,
      allSpotted,
      currentIndex: allSpotted.findIndex((s) => s.index === species.index)
    });
  }, [families]);
  const handleNavigation = useCallback2((direction) => {
    setExpandedSpecies((prev) => {
      const newIndex = direction === "prev" ? prev.currentIndex - 1 : prev.currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.allSpotted.length) return prev;
      const species = prev.allSpotted[newIndex];
      const family = families.find(
        (f) => f.species.some((s) => s.index === species.index)
      )?.family || "";
      return { ...prev, species, family, currentIndex: newIndex };
    });
  }, [families]);
  const handleClose = useCallback2(() => setExpandedSpecies(INITIAL_EXPANDED_STATE), []);
  const handlePrev = useCallback2(() => handleNavigation("prev"), [handleNavigation]);
  const handleNext = useCallback2(() => handleNavigation("next"), [handleNavigation]);
  const renderFamilySection = (family) => /* @__PURE__ */ React4.createElement(React4.Fragment, { key: family.family }, /* @__PURE__ */ React4.createElement(
    FamilyCard,
    {
      family,
      onImageClick: () => handleCardClick(family.species[0], family.family)
    }
  ), family.species.map((species) => /* @__PURE__ */ React4.createElement(
    SpeciesCard,
    {
      key: species.index,
      species,
      onImageClick: () => handleCardClick(species, family.family)
    }
  )));
  return /* @__PURE__ */ React4.createElement("div", { className: BirdDashboard_default.birdContainer }, /* @__PURE__ */ React4.createElement("h1", { className: BirdDashboard_default.birdTrackerTitle }, getTrackerTitle(spottedBirds, totalBirds)), /* @__PURE__ */ React4.createElement("div", { className: BirdDashboard_default.speciesGrid }, families.map(renderFamilySection)), /* @__PURE__ */ React4.createElement(
    ExpandedImage_default,
    {
      ...expandedSpecies,
      onClose: handleClose,
      onPrev: handlePrev,
      onNext: handleNext
    }
  ));
};
var BirdDashboard_default2 = React4.memo(BirdDashboard);

// src/index.tsx
function App() {
  return /* @__PURE__ */ React5.createElement(Routes, null, /* @__PURE__ */ React5.createElement(Route, { path: "/", element: /* @__PURE__ */ React5.createElement(BirdDashboard_default2, null) }), /* @__PURE__ */ React5.createElement(Route, { path: "*", element: /* @__PURE__ */ React5.createElement("div", null, "404 Not Found") }));
}
var root = ReactDOM.createRoot(
  document.getElementById("root")
);
root.render(
  /* @__PURE__ */ React5.createElement(React5.StrictMode, null, /* @__PURE__ */ React5.createElement(HashRouter, null, /* @__PURE__ */ React5.createElement(App, null)))
);
//# sourceMappingURL=bundle.js.map
