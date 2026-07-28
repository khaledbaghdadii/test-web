export default {
  displayName: "ui-monaco-editor",
  preset: "../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "../../../uiTests/libs/ui/monaco-editor",
        outputName: "report.xml",
      },
    ],
  ],
  coverageDirectory: "../../../coverage/libs/ui/monaco-editor",
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
  transformIgnorePatterns: [],
  snapshotSerializers: [
    "jest-preset-angular/build/serializers/no-ng-attributes",
    "jest-preset-angular/build/serializers/ng-snapshot",
    "jest-preset-angular/build/serializers/html-comment",
  ],
};
