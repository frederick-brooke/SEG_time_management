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
  "src/generated/",
  "src/components/animate-ui",
  "src/components/effects/",
  ".next/",
  "src/components/map/index.ts",
  "src/lib/map/index.ts",
  "src/app/actions/module/index.ts",
  "src/app/actions/profile/index.ts",
  "src/app/api/auth",
],

moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1",
  "^components/(.*)$": "<rootDir>/src/components/$1",
  "\\.module\\.css$": "identity-obj-proxy",
  "^hooks/(.*)$": "<rootDir>/src/hooks/$1",
  "^leaflet$": "<rootDir>/__mocks__/leaflet.ts",
  "^lib/(.*)$": "<rootDir>/src/lib/$1",
},
transformIgnorePatterns: [
  "/node_modules/(?!(jose|openid-client|next-auth|@fullcalendar|preact|preact-render-to-string|@panva|bson|uuid)/)",
],
};

module.exports = createJestConfig(customJestConfig);  