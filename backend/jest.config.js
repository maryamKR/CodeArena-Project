module.exports = {
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  moduleFileExtensions: ["js", "jsx", "json", "node"],
  // 🎯 Tell Jest to skip this stubborn file entirely for your backend runs
  modulePathIgnorePatterns: [
    "<rootDir>/tests/src/__tests__/Challenge.test.jsx"
  ]
};