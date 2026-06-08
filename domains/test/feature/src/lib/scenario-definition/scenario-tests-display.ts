import { Test } from "@mxevolve/domains/test/model";

export function formatTests(tests: Test[]): string[] {
  return tests.map((test) => {
    if (test.full) {
      return test.testDefinition.name;
    } else {
      return `${test.testDefinition.name}: ${test.testSelections
        .map((tc) => tc.name)
        .join(" - ")}`;
    }
  });
}
