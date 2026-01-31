const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  
  config.transformIgnorePatterns = [
    '/node_modules/(?!(jose|openid-client|next-auth|@fullcalendar|preact|@panva)/)',
  ];
  
  return config;
};