const config = {
  testEnvironment: "node",
  verbose: true,
  collectCoverage: true,
  coverageProvider: "babel",
  collectCoverageFrom: ["<rootDir>/controllers/*.js"],
  coveragePathIgnorePatterns: ["<rootDir>/node_modules/"],
};

module.exports = config;
