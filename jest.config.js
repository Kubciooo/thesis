const config = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageProvider: 'babel',
  collectCoverageFrom: [
    '<rootDir>/controllers/*.js',
    '<rootDir>/models/*.js',
    '<rootDir>/routes/*.js',
    '<rootDir>/middlewares/*.js',
    '<rootDir>/services/*.js',
  ],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
};

module.exports = config;
