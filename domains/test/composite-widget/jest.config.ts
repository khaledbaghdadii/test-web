export default {
  displayName: "domains-test-composite-widget",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiTests/libs/domains/test/composite-widget",
        outputName: "report.xml",
      },
    ],
  ],
  preset: "../../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../../../coverage/libs/domains/test/composite-widget",
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
