import "expo-router/entry";

// At the very top of your entry file (e.g. index.js or App.js)

const originalConsoleError = console.error;
console.error = (...args) => {
  // Look for React’s max-depth warning
  if (
    typeof args[0] === 'string' &&
    args[0].startsWith('Warning: Maximum update depth exceeded')
  ) {
    // Print a JS stack trace to show file/line
    console.trace();
  }
  originalConsoleError.apply(console, args);
};
