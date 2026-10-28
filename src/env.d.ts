/// <reference types="vite/client" />

// Injected by vite.config.ts at build time from script/version/version.ts.
/** `major.minor.patch`, e.g. "0.9.161". */
declare const __APP_VERSION__: string;
/** The line's name, a Dhivehi name from the drawings (script/version/line_names.ts), or null. */
declare const __APP_NAME__: { roman: string; script: string; species: string } | null;
/** Illustrations marked drawn across all collections. */
declare const __APP_DRAWN__: number;
/** Short hash of the commit built from, or "unknown" without git. */
declare const __APP_COMMIT__: string;
