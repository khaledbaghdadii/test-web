/* eslint-disable */
export default {
  displayName: "ui-utils",
  preset: "../../../jest.preset.js",
  setupFilesAfterEnv: [
    "<rootDir>/src/test-setup.ts",
    "<rootDir>/jest.setup.js",
  ],
  reporters: [
    "default",
    [
      "jest-junit",
      { outputDirectory: "uiTests/libs/ui/utils", outputName: "report.xml" },
    ],
  ],
  coverageDirectory: "../../../coverage/libs/ui/utils",
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
