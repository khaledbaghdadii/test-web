export default {
  displayName: "domains-analytics-data-access",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiContractTests/libs/domains/analytics/data-access",
        outputName: "report.xml",
      },
    ],
  ],
  preset: "../../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../../../coverage/libs/domains/analytics/data-access",
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.(html|svg)$",
      },
    ],
  },
  testMatch: ["**/*.pact.spec.ts"],
};
