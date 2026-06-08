import {
  BusinessProcessChain,
  EnvironmentDefinition,
  EnvironmentDefinitionStatus,
  TestDefinition,
} from "@mxevolve/domains/test/model";
import {
  ScenarioDefinitionApiResponse,
  TestDefinitionApiResponse,
} from "../api-models/scenario-definition-api-response";
import { ScenarioDefinitionMapper } from "./scenario-definition-mapper";

function buildTestDefinition(
  overrides: Partial<TestDefinition> = {}
): TestDefinition {
  return {
    id: "td-1",
    name: "Test Package 1",
    projectId: "p1",
    repoId: "r1",
    path: "/path",
    description: "desc",
    timeoutDuration: { days: 0, hours: 1, minutes: 0 },
    testSelections: [],
    ...overrides,
  };
}

function buildApiResponse(
  overrides: Partial<ScenarioDefinitionApiResponse> = {}
): ScenarioDefinitionApiResponse {
  return {
    id: "sd-1",
    projectId: "p1",
    name: "Scenario 1",
    tests: [],
    idempotent: true,
    nonFunctionalTest: false,
    bpcs: [],
    environmentDefinitionId: "env-1",
    qualityLevel: "CQG",
    heaviness: "LIGHT",
    archived: false,
    ...overrides,
  };
}

const defaultEnvironment: EnvironmentDefinition = {
  id: "env-1",
  name: "Dev Environment",
  status: EnvironmentDefinitionStatus.ACTIVE,
};

const defaultBpcs: BusinessProcessChain[] = [
  { id: "bpc-1", name: "BPC One" },
  { id: "bpc-2", name: "BPC Two" },
];

describe("ScenarioDefinitionMapper", () => {
  describe("toScenarioDefinition", () => {
    it("maps the scenario name and id from the api response", () => {
      const apiResponse = buildApiResponse({
        id: "sd-99",
        name: "My Scenario",
      });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        [],
        [defaultEnvironment]
      );

      expect(result.id).toBe("sd-99");
      expect(result.name).toBe("My Scenario");
    });

    it("filters business process chains to only those referenced in the response", () => {
      const apiResponse = buildApiResponse({ bpcs: ["bpc-2"] });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        defaultBpcs,
        [defaultEnvironment]
      );

      expect(result.bpcs).toEqual([{ id: "bpc-2", name: "BPC Two" }]);
    });

    it("returns an empty bpc list when none of the ids match", () => {
      const apiResponse = buildApiResponse({ bpcs: ["bpc-unknown"] });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        defaultBpcs,
        [defaultEnvironment]
      );

      expect(result.bpcs).toEqual([]);
    });

    it("resolves the environment definition by id", () => {
      const apiResponse = buildApiResponse({
        environmentDefinitionId: "env-1",
      });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        [],
        [defaultEnvironment]
      );

      expect(result.environmentDefinition).toEqual(defaultEnvironment);
    });

    it("preserves heaviness from the api response", () => {
      const apiResponse = buildApiResponse({ heaviness: "HEAVY" });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        [],
        [defaultEnvironment]
      );

      expect(result.heaviness).toBe("HEAVY");
    });

    it("preserves idempotent flag from the api response", () => {
      const apiResponse = buildApiResponse({ idempotent: false });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        [],
        [defaultEnvironment]
      );

      expect(result.idempotent).toBe(false);
    });

    it("preserves nonFunctionalTest flag from the api response", () => {
      const apiResponse = buildApiResponse({ nonFunctionalTest: true });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        [],
        [defaultEnvironment]
      );

      expect(result.nonFunctionalTest).toBe(true);
    });

    it("preserves archived flag from the api response", () => {
      const apiResponse = buildApiResponse({ archived: true });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [],
        [],
        [defaultEnvironment]
      );

      expect(result.archived).toBe(true);
    });

    it("maps tests using the test definitions lookup", () => {
      const testDefinition = buildTestDefinition({
        id: "td-1",
        name: "Package A",
      });
      const apiResponse = buildApiResponse({
        tests: [
          {
            testDefinitionId: "td-1",
            full: true,
            testSelectionIds: [],
          },
        ],
      });

      const result = ScenarioDefinitionMapper.toScenarioDefinition(
        apiResponse,
        [testDefinition],
        [],
        [defaultEnvironment]
      );

      expect(result.tests.length).toBe(1);
      expect(result.tests[0].testDefinition.name).toBe("Package A");
    });
  });

  describe("toTestDefinition", () => {
    it("marks the test as full when there are no test selection ids", () => {
      const testDefinition = buildTestDefinition();
      const apiTest: TestDefinitionApiResponse = {
        testDefinitionId: "td-1",
        full: true,
        testSelectionIds: [],
      };

      const result = ScenarioDefinitionMapper.toTestDefinition(
        [testDefinition],
        apiTest
      );

      expect(result.full).toBe(true);
    });

    it("marks the test as not full when test selection ids are present", () => {
      const testDefinition = buildTestDefinition({
        testSelections: [{ id: "ts-1", name: "Sel 1", path: "/s1", tags: [] }],
      });
      const apiTest: TestDefinitionApiResponse = {
        testDefinitionId: "td-1",
        full: false,
        testSelectionIds: ["ts-1"],
      };

      const result = ScenarioDefinitionMapper.toTestDefinition(
        [testDefinition],
        apiTest
      );

      expect(result.full).toBe(false);
    });

    it("resolves test selections by their ids", () => {
      const testDefinition = buildTestDefinition({
        testSelections: [
          { id: "ts-1", name: "Selection A", path: "/a", tags: ["smoke"] },
          { id: "ts-2", name: "Selection B", path: "/b", tags: [] },
        ],
      });
      const apiTest: TestDefinitionApiResponse = {
        testDefinitionId: "td-1",
        full: false,
        testSelectionIds: ["ts-2"],
      };

      const result = ScenarioDefinitionMapper.toTestDefinition(
        [testDefinition],
        apiTest
      );

      expect(result.testSelections).toEqual([
        { id: "ts-2", name: "Selection B", path: "/b", tags: [] },
      ]);
    });

    it("excludes test selection ids that do not exist in the test definition", () => {
      const testDefinition = buildTestDefinition({
        testSelections: [
          { id: "ts-1", name: "Selection A", path: "/a", tags: [] },
        ],
      });
      const apiTest: TestDefinitionApiResponse = {
        testDefinitionId: "td-1",
        full: false,
        testSelectionIds: ["ts-1", "ts-unknown"],
      };

      const result = ScenarioDefinitionMapper.toTestDefinition(
        [testDefinition],
        apiTest
      );

      expect(result.testSelections).toEqual([
        { id: "ts-1", name: "Selection A", path: "/a", tags: [] },
      ]);
    });

    it("returns an empty test selections array when all ids are invalid", () => {
      const testDefinition = buildTestDefinition({ testSelections: [] });
      const apiTest: TestDefinitionApiResponse = {
        testDefinitionId: "td-1",
        full: false,
        testSelectionIds: ["ts-unknown"],
      };

      const result = ScenarioDefinitionMapper.toTestDefinition(
        [testDefinition],
        apiTest
      );

      expect(result.testSelections).toEqual([]);
    });
  });

  describe("getTestDefinition", () => {
    it("returns the test definition matching the target id", () => {
      const testDefinition = buildTestDefinition({ id: "td-5" });

      const result = ScenarioDefinitionMapper.getTestDefinition(
        [testDefinition],
        "td-5"
      );

      expect(result).toBe(testDefinition);
    });

    it("throws when the test definition is not found", () => {
      expect(() =>
        ScenarioDefinitionMapper.getTestDefinition([], "td-missing")
      ).toThrow("Test Definition was not found");
    });
  });

  describe("getTestSelection", () => {
    it("returns the test selection matching the target id", () => {
      const selections = [
        { id: "ts-1", name: "A", path: "/a", tags: ["tag1"] },
        { id: "ts-2", name: "B", path: "/b", tags: [] },
      ];

      const result = ScenarioDefinitionMapper.getTestSelection(
        selections,
        "ts-2"
      );

      expect(result).toEqual({
        id: "ts-2",
        name: "B",
        path: "/b",
        tags: [],
      });
    });

    it("returns an empty object when the target id is not found", () => {
      const result = ScenarioDefinitionMapper.getTestSelection(
        [],
        "ts-missing"
      );

      expect(result).toEqual({});
    });
  });
});
