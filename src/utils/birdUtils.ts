import { BirdFamily } from "../types/types.ts";

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
          spottedDate: match[3] || undefined,
        });
      }
    }
  });

  return families;
};
