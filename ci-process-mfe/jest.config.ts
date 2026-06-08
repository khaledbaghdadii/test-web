/* eslint-disable */
export default {
  displayName: "ci-process-mfe",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiTests/apps/ci-process-mfe",
        outputName: "report.xml",
      },
    ],
  ],
  preset: "../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../coverage/apps/ci-process-mfe",
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
