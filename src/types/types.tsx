export interface BirdSpecies {
  index: number;
  name: string;
  spotted: boolean;
  spottedDate?: string;  // Add spottedDate to the type
}
  
export type BirdFamily = {
    family: string;
    species: BirdSpecies[];
  };

export interface ExpandedSpeciesState {
    species: BirdSpecies | null;
    family: string | null;
    allSpotted: BirdSpecies[];
    currentIndex: number;
  }
  
export const INITIAL_EXPANDED_STATE: ExpandedSpeciesState = {
    species: null,
    family: null,
    allSpotted: [],
    currentIndex: -1
  };