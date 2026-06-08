export default {
  displayName: "shared-ui-table",
  preset: "../../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "../../../../uiTests/libs/shared/ui/table",
        outputName: "report.xml",
      },
    ],
  ],
  coverageDirectory: "../../../../coverage/libs/shared/ui/table",
  coverageReporters: ["lcov"],
  transform: {
    "^.+\\.(ts|mjs|js|html|svg)$": [
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
