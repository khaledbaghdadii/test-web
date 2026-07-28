/* eslint-disable */
export default {
  displayName: "vertical-timeline",
  preset: "../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiTests/libs/ui/vertical-timeline",
        outputName: "report.xml",
      },
    ],
  ],
  coverageDirectory: "../../../coverage/libs/ui/vertical-timeline",
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
