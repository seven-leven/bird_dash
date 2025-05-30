// public/shim.js
console.log("--- shim.js Diagnostics ---");

// In a plain JS file in `public`, `import.meta.env` is NOT available directly
// because it's a Vite-specific feature processed during the build/dev server.
// So, this shim will mostly test basic path resolution.

console.log("shim.js: window.location.origin:", window.location.origin);
console.log("shim.js: window.location.pathname:", window.location.pathname);
console.log("shim.js: window.location.href:", window.location.href);

// Test fetching birds.txt using different path assumptions
const testFetch = async (path, description) => {
  console.log(`shim.js: Testing fetch for "${description}" with path: '${path}'`);
  try {
    const response = await fetch(path);
    console.log(`shim.js: Fetch status for '${path}': ${response.status}`);
    if (response.ok) {
      const text = await response.text();
      console.log(`shim.js: Successfully fetched '${path}'. Content starts with: "${text.substring(0, 30)}..."`);
    } else {
      console.warn(`shim.js: Fetch for '${path}' failed with status ${response.status}.`);
    }
  } catch (error) {
    console.error(`shim.js: Fetch for '${path}' threw an error:`, error);
  }
};

// Run tests after the DOM is somewhat ready, though fetch doesn't strictly need it.
// Using a small timeout to ensure these logs appear after Vite's initial logs.
setTimeout(() => {
  console.log("--- shim.js Fetch Tests ---");
  testFetch('/birds.txt', 'Absolute path from domain root');
  testFetch('birds.txt', 'Relative path from current page');

  // Simulate what happens if base path was '/foo/' (not relevant locally but good for understanding)
  // const hypotheticalBasePath = '/foo/';
  // testFetch(hypotheticalBasePath + 'birds.txt', 'Hypothetical base path');

  // Test fetching an image from assets to check general public path serving
  testFetch('/placeholder.png', 'Absolute path for placeholder.png'); // Assuming you have public/placeholder.png
  console.log("--- End shim.js Diagnostics ---");
}, 100);