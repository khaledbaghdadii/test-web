import { Test, TestDefinition } from "@mxevolve/domains/test/model";
import { formatTests } from "./scenario-tests-display";

function buildTestDefinition(
  overrides: Partial<TestDefinition> = {}
): TestDefinition {
  return {
    id: "1",
    name: "test package",
    description: "desc",
    projectId: "121",
    repoId: "repoID",
    path: "path",
    timeoutDuration: { days: 0, hours: 1, minutes: 0 },
    testSelections: [],
    ...overrides,
  };
}

describe("formatTests", () => {
  it("shows only the test definition name for a full test", () => {
    const tests: Test[] = [
      {
        full: true,
        testSelections: [],
        testDefinition: buildTestDefinition(),
      },
    ];

    expect(formatTests(tests)).toEqual(["test package"]);
  });

  it("ignores test selections for a full test", () => {
    const tests: Test[] = [
      {
        full: true,
        testSelections: [
          {
            id: "123",
            name: "test selection 1",
            path: "qrweq",
            tags: ["tag1"],
          },
        ],
        testDefinition: buildTestDefinition(),
      },
    ];

    expect(formatTests(tests)).toEqual(["test package"]);
  });

  it("appends test selection names separated by dashes for a partial test", () => {
    const tests: Test[] = [
      {
        full: false,
        testSelections: [
          {
            id: "123",
            name: "test selection 1",
            path: "qrweq",
            tags: ["tag1"],
          },
          { id: "23", name: "test selection 2", path: "qrweq", tags: ["tag1"] },
        ],
        testDefinition: buildTestDefinition(),
      },
    ];

    expect(formatTests(tests)).toEqual([
      "test package: test selection 1 - test selection 2",
    ]);
  });

  it("returns an empty array when there are no tests", () => {
    expect(formatTests([])).toEqual([]);
  });

  it("formats multiple tests independently", () => {
    const tests: Test[] = [
      {
        full: true,
        testSelections: [],
        testDefinition: buildTestDefinition({ name: "Package A" }),
      },
      {
        full: false,
        testSelections: [
          { id: "s1", name: "Selection X", path: "/x", tags: [] },
        ],
        testDefinition: buildTestDefinition({ name: "Package B" }),
      },
    ];

    expect(formatTests(tests)).toEqual(["Package A", "Package B: Selection X"]);
  });
});
