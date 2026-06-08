/* tslint:disable:no-unused-variable */

import {
  EnvironmentDefinitionStatus,
  Heaviness,
  ScenarioDefinition,
} from "@mxevolve/domains/test/model";
import { ScenarioDefinitionTableSearchPipe } from "./scenario-definition-table-search.pipe";

describe("Pipe: ScenarioDefinitionTableSearch", () => {
  it("create an instance", () => {
    const pipe = new ScenarioDefinitionTableSearchPipe();
    expect(pipe).toBeTruthy();
  });

  let pipe: ScenarioDefinitionTableSearchPipe;
  let data: ScenarioDefinition[] = [];

  beforeEach(() => {
    data = DataProvider.getData();
    pipe = new ScenarioDefinitionTableSearchPipe();
  });
  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("return all values if search value is empty", () => {
    expect(pipe.transform(data, "")).toStrictEqual(DataProvider.getData());
  });
  it("can search by scenario name", () => {
    expect(pipe.transform(data, "Scenario-1")).toStrictEqual([
      {
        id: "scen-id-1",
        name: "Scenario-1",
        environmentDefinition: {
          name: "env2",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        idempotent: false,
        bpcs: [],
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-1",
              name: "name-1",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [],
          },
        ],
      },
    ]);
  });

  it("can search by env name", () => {
    expect(pipe.transform(data, "env2")).toStrictEqual([
      {
        id: "scen-id-1",
        name: "Scenario-1",
        environmentDefinition: {
          name: "env2",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        idempotent: false,
        bpcs: [],
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-1",
              name: "name-1",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [],
          },
        ],
      },
    ]);
  });

  it("can search by test definition name", () => {
    expect(pipe.transform(data, "name-2")).toStrictEqual([
      {
        id: "scen-id-2",
        name: "Scenario-2",
        idempotent: false,
        environmentDefinition: {
          name: "env",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        bpcs: [],
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-2",
              name: "name-2",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [],
          },
        ],
      },
    ]);
  });

  it("can search by test selection name", () => {
    expect(pipe.transform(data, "case-name-4")).toStrictEqual([
      {
        id: "scen-id-4",
        name: "Scenario-4",
        idempotent: false,
        bpcs: [],
        environmentDefinition: {
          name: "env",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-4",
              name: "name-4",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [
              {
                id: "case-4",
                name: "case-name-4",
                path: "path-4",
                tags: ["tag1"],
              },
            ],
          },
        ],
      },
    ]);
  });
});
class DataProvider {
  static getData(): ScenarioDefinition[] {
    return [
      {
        id: "scen-id-1",
        environmentDefinition: {
          name: "env2",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        name: "Scenario-1",
        idempotent: false,
        bpcs: [],
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-1",
              name: "name-1",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [],
          },
        ],
      } as unknown as ScenarioDefinition,
      {
        id: "scen-id-2",
        name: "Scenario-2",
        idempotent: false,
        environmentDefinition: {
          name: "env",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        bpcs: [],
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-2",
              name: "name-2",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [],
          },
        ],
      } as unknown as ScenarioDefinition,
      {
        id: "scen-id-3",
        name: "Scenario-3",
        environmentDefinition: {
          name: "env",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        idempotent: false,
        bpcs: [],
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-3",
              name: "name-3",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [
              {
                id: "case-3",
                name: "case-name-3",
                path: "path-3",
                tags: ["tag1"],
              },
            ],
          },
        ],
      } as unknown as ScenarioDefinition,
      {
        id: "scen-id-4",
        name: "Scenario-4",
        environmentDefinition: {
          name: "env",
          id: "envId",
          status: EnvironmentDefinitionStatus.ACTIVE,
        },
        idempotent: false,
        bpcs: [],
        heaviness: Heaviness.LIGHT,
        tests: [
          {
            full: true,
            testDefinition: {
              id: "id-4",
              name: "name-4",
              projectId: "project-1",
              repoId: "repo",
              path: "path",
              description: "desc",
              timeoutDuration: {
                days: 0,
                hours: 1,
                minutes: 0,
              },
              testSelections: [],
            },
            testSelections: [
              {
                id: "case-4",
                name: "case-name-4",
                path: "path-4",
                tags: ["tag1"],
              },
            ],
          },
        ],
      } as unknown as ScenarioDefinition,
    ];
  }
}
