// src/composables/useBirdData.ts
import { ref } from 'vue';
import type { GridItem } from '../components/GridItemCard.vue'; // Adjust path if GridItemCard is elsewhere

// --- Constants ---
const BIRD_DATA_FILE = 'birds.txt';
const DEFAULT_FAMILY_NAME = "Uncategorized Birds";
const ASSETS_PATH_PREFIX = 'assets/';
const PLACEHOLDER_IMAGE = 'placeholder.png';
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const BIRD_LINE_REGEX = /^(\d+)[,\s]+(.+)/;

// --- Helper: Process a single line to create a GridItem ---
// This could be further broken down if parsing becomes very complex
function _parseLineToGridItem(
    line: string,
    currentFamilyNameRef: { value: string | null }, // Pass as ref object to modify
    baseUrl: string,
    existingItems: GridItem[]
): GridItem | null {
    const birdMatch = line.match(BIRD_LINE_REGEX);

    if (birdMatch) {
        if (!currentFamilyNameRef.value) {
            currentFamilyNameRef.value = DEFAULT_FAMILY_NAME;
            // Add family header if it doesn't exist yet for uncategorized
            if (!existingItems.find(item => item.type === 'family' && item.name === currentFamilyNameRef.value)) {
                 // This assumes we want to insert it right before the first uncategorized bird.
                 // For simplicity, the main processRawData will handle adding it if needed.
                 // Here, we just ensure the family name is set.
            }
        }

        const id = birdMatch[1];
        const restOfLine = birdMatch[2];
        const parts = restOfLine.split(',');
        const name = parts[0]?.trim(); // Use optional chaining and provide fallback if needed

        if (!name) {
            console.warn(`Skipping bird line due to missing name: '${line}'`);
            return null;
        }

        const datePart = parts[1]?.trim();
        const date = datePart && datePart.match(DATE_REGEX) ? datePart : undefined;

        const imageUrl = date
            ? `${baseUrl}${ASSETS_PATH_PREFIX}${id}.png`
            : `${baseUrl}${PLACEHOLDER_IMAGE}`;

        return {
            type: 'bird',
            id: `bird-${id}`,
            birdId: id,
            name,
            date,
            imageUrl,
        };
    } else if (line.length > 0) { // Assume it's a family name
        currentFamilyNameRef.value = line;
        return {
            type: 'family',
            id: `family-${line.replace(/\s+/g, '-')}`,
            name: line,
        };
    }
    console.warn(`Skipping unparseable line: '${line}'`);
    return null;
}


// --- Main Data Processing Logic ---
function processRawData(text: string, baseUrl: string): GridItem[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: GridItem[] = [];
    let currentFamilyName: string | null = null; // Tracks the current family for bird entries

    for (const line of lines) {
        const birdMatch = line.match(BIRD_LINE_REGEX);

        if (birdMatch) {
            // Ensure a family (even "Uncategorized") is established before adding a bird
            if (!currentFamilyName) {
                currentFamilyName = DEFAULT_FAMILY_NAME;
                if (!items.find(item => item.type === 'family' && item.name === currentFamilyName)) {
                    items.push({
                        type: 'family',
                        id: `family-${currentFamilyName.replace(/\s+/g, '-')}`,
                        name: currentFamilyName
                    });
                }
            }

            const id = birdMatch[1];
            const restOfLine = birdMatch[2];
            const parts = restOfLine.split(',');
            const name = parts[0]?.trim();

            if (!name) {
                console.warn(`Skipping bird line due to missing name: '${line}'`);
                continue;
            }

            const datePart = parts[1]?.trim();
            const date = datePart && datePart.match(DATE_REGEX) ? datePart : undefined;

            const imageUrl = date
                ? `${baseUrl}${ASSETS_PATH_PREFIX}${id}.png`
                : `${baseUrl}${PLACEHOLDER_IMAGE}`;

            items.push({
                type: 'bird',
                id: `bird-${id}`,
                birdId: id,
                name,
                date,
                imageUrl,
            });
        } else if (line.length > 0) { // Assumed to be a family name
            currentFamilyName = line; // Set current family for subsequent birds
            items.push({
                type: 'family',
                id: `family-${currentFamilyName.replace(/\s+/g, '-')}`,
                name: currentFamilyName,
            });
        } else {
             console.warn(`Skipping empty or unparseable line: '${line}'`);
        }
    }
    return items;
}

// --- Composable ---
export function useBirdData() {
    const gridItems = ref<GridItem[]>([]);
    const isLoading = ref(true);
    const error = ref<string | null>(null);
    const baseUrl = import.meta.env.BASE_URL;

    const fetchData = async () => {
        isLoading.value = true;
        error.value = null;
        gridItems.value = []; // Clear previous data

        const filePath = `${baseUrl}${BIRD_DATA_FILE}`;

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} while fetching ${filePath}`);
            }
            const textData = await response.text();
            if (!textData.trim()) {
                console.warn(`Fetched data from '${filePath}' is empty.`);
                // Optionally set an error or handle as "no items found"
                // error.value = `No data found in '${filePath}'.`;
                // For now, it will result in "No birds or families found" message
            }
            gridItems.value = processRawData(textData, baseUrl);
        } catch (e: unknown) {
            let message = "An unknown error occurred during data fetching.";
            if (e instanceof Error) {
                message = e.message;
            } else if (typeof e === 'string') {
                message = e;
            }
            console.error("Failed to load or parse bird data:", message, e); // Log original error too
            error.value = `Failed to load bird data from '${filePath}'. ${message}`;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        gridItems,
        isLoading,
        error,
        fetchData,
    };
}