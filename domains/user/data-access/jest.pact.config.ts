export default {
  displayName: "domains-user-data-access",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiContractTests/libs/domains/user/data-access",
        outputName: "report.xml",
      },
    ],
  ],
  preset: "../../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../../../coverage/libs/domains/user/data-access",
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
