import { ScenarioFilterPipe } from "./scenario-filter.pipe";
import {
  EnvironmentDefinitionStatus,
  ScenarioDefinition,
} from "@mxevolve/domains/test/model";

describe("Pipe: ScenarioFilter", () => {
  let pipe: ScenarioFilterPipe;

  beforeEach(() => {
    pipe = new ScenarioFilterPipe();
  });

  const mockScenarioDefinitions: ScenarioDefinition[] = [
    {
      id: "1",
      name: "Scenario1",
      tests: [
        {
          full: true,
          testDefinition: {
            name: "Test1",
            id: "",
            projectId: "",
            repoId: "",
            path: "",
            timeoutDuration: {
              days: 0,
              hours: 0,
              minutes: 0,
            },
            testSelections: [],
            description: "",
          },
          testSelections: [],
        },
      ],
      bpcs: [],
      heaviness: "NA",
      environmentDefinition: {
        name: "Environment1",
        id: "",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
      idempotent: false,
    } as unknown as ScenarioDefinition,
    {
      id: "2",
      name: "Scenario2",
      tests: [
        {
          full: false,
          testDefinition: {
            name: "Test2",
            id: "",
            projectId: "",
            repoId: "",
            path: "",
            timeoutDuration: {
              days: 0,
              hours: 0,
              minutes: 0,
            },
            testSelections: [],
            description: "",
          },
          testSelections: [
            { name: "TestSelection1", id: "", path: "", tags: ["tag1"] },
          ],
        },
      ],
      bpcs: [],
      heaviness: "NA",
      environmentDefinition: {
        name: "Environment2",
        id: "",
        status: EnvironmentDefinitionStatus.ACTIVE,
      },
      idempotent: false,
    } as unknown as ScenarioDefinition,
  ];

  it.each([
    ["Scenario1", [mockScenarioDefinitions[0]]],
    ["scenario1", [mockScenarioDefinitions[0]]],
    ["Environment1", [mockScenarioDefinitions[0]]],
    ["EnvironMENt1", [mockScenarioDefinitions[0]]],
    ["Test1", [mockScenarioDefinitions[0]]],
    ["tesT1", [mockScenarioDefinitions[0]]],
    ["TestSelection1", [mockScenarioDefinitions[1]]],
    ["testSelection1", [mockScenarioDefinitions[1]]],
    ["Nonexistent", []],
    ["", mockScenarioDefinitions],
  ])(
    "should filter scenario definitions based on search input",
    (searchInput, expectedFilteredScenarios) => {
      const result = pipe.transform(mockScenarioDefinitions, searchInput);

      expect(result).toEqual(expectedFilteredScenarios);
    }
  );
});
