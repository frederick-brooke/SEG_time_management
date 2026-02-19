const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "\\.module\\.css$": "identity-obj-proxy",
  },

  transformIgnorePatterns: [
    "/node_modules/(?!(jose|openid-client|next-auth|@fullcalendar|preact|@panva)/)",
  ],
};

module.exports = createJestConfig(customJestConfig);
