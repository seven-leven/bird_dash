/// <reference types="vite/client" />

// Injected by vite.config.ts at build time from script/version/version.ts.
/** `major.minor.patch`, e.g. "0.9.161". */
declare const __APP_VERSION__: string;
/** Illustrations marked drawn across all collections. */
declare const __APP_DRAWN__: number;
/** Short hash of the commit built from, or "unknown" without git. */
declare const __APP_COMMIT__: string;
