/* eslint-disable */
export default {
  displayName: "features-incident-management",
  preset: "../../../jest.preset.js",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiTests/libs/features/incident-management",
        outputName: "report.xml",
      },
    ],
  ],
  coverageReporters: ["lcov"],
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../../coverage/libs/features/incident-management",
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.(html|svg)$",
      },
    ],
  },
  snapshotSerializers: [
    "jest-preset-angular/build/serializers/no-ng-attributes",
    "jest-preset-angular/build/serializers/ng-snapshot",
    "jest-preset-angular/build/serializers/html-comment",
  ],
};
