// The build this is: the one place that reads the globals vite.config.ts injects
// (docs/ARCHITECTURE.md, rule 4), worked out by script/version/version.ts.

/** `major.minor.patch`, its line's name, the drawings it holds, and the commit it was built from. */
export const buildInfo = {
  version: __APP_VERSION__,
  name: __APP_NAME__,
  drawn: __APP_DRAWN__,
  commit: __APP_COMMIT__,
};

export type BuildInfo = typeof buildInfo;
