/* eslint-disable */
export default {
  displayName: "ui-bar",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "../../../uiTests/libs/ui/bar",
        outputName: "report.xml",
      },
    ],
  ],
  preset: "../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../../coverage/libs/ui/bar",
  coverageReporters: ["lcov"],
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
