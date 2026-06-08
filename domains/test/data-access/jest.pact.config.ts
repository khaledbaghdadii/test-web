export default {
  displayName: "domains-test-data-access",
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "uiContractTests/libs/domains/test/data-access",
        outputName: "report.xml",
      },
    ],
  ],
  preset: "../../../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../../../coverage/libs/domains/test/data-access",
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
  testMatch: ["**/+(*.)+(pact).(spec).(ts)"],
  moduleFileExtensions: ["ts", "js", "html"],
};
