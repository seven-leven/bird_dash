// src\utils\birdUtils.ts

import { BirdFamily } from "../types/types.tsx";

export const calculateTotalBirds = (families: BirdFamily[]): number => {
  return families.reduce((acc, family) => acc + family.species.length, 0);
};

export const getTrackerTitle = (spotted: number, total: number): string => {
  return `Bird Tracker ${spotted}/${total}`;
};

export const parseBirdData = (text: string): BirdFamily[] => {
  const lines = text.split("\n");
  const families: BirdFamily[] = [];
  let currentFamily: BirdFamily | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if the line is a species line.
    const speciesMatch = trimmed.match(
      /^(\d+)\s+([^,]+)(?:,(\d{4}-\d{2}-\d{2}))?/,
    );
    if (speciesMatch) {
      if (currentFamily) {
        const spotted = !!speciesMatch[3];
        currentFamily.species.push({
          index: parseInt(speciesMatch[1]),
          name: speciesMatch[2].trim(),
          spotted,
          spottedDate: speciesMatch[3] || undefined,
        });
      }
      return;
    }

    // If the line is not a species line, it might be a family header.
    // Only create a new family header if:
    // 1. There is no current family, or
    // 2. The current family already has at least one species.
    // Otherwise, skip the line (malformed or misplaced).
    if (!currentFamily || (currentFamily && currentFamily.species.length > 0)) {
      currentFamily = { family: trimmed, species: [] };
      families.push(currentFamily);
    }
  });

  return families;
};
