/* eslint-disable */
export default {
  displayName: "features-reconciliation",
  preset: "../../../jest.preset.js",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiTests/libs/features/reconciliation",
        outputName: "report.xml",
      },
    ],
  ],
  coverageReporters: ["lcov"],
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../../coverage/libs/features/reconciliation",
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.(html|svg)$",
      },
    ],
  },
};
