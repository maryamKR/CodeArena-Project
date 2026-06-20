module.exports = {
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  moduleFileExtensions: ["js", "jsx", "json", "node"],
  // Clean workspace: no need to ignore the new backend/tests/frontend/Challenge.test.js
  modulePathIgnorePatterns: []
};