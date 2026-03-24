const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/types.ts"
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  forceExit: true,
  maxWorkers: 1,
  coveragePathIgnorePatterns: [
    "src/components/friend-map/map.tsx",
  ], 
  
  moduleNameMapper: {
    "^@/src/(.*)$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "\\.module\\.css$": "identity-obj-proxy",
    "^hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^leaflet$": "<rootDir>/__mocks__/leaflet.js",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(jose|openid-client|next-auth|@fullcalendar|preact|preact-render-to-string|@panva|bson|uuid)/)",
  ],
};

module.exports = createJestConfig(customJestConfig);  