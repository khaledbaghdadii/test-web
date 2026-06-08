import {
  EnvironmentDefinition,
  EnvironmentDefinitionStatus,
} from "@mxflow/features/environment";
import { EnvironmentDefinitionsState } from "./environment-definitions.state";
import { selectEnvironmentDefinitions } from "./environment-definitions.selectors";

const PROJECT_ID = "project-id";

const mockEnvironmentDefinitions: EnvironmentDefinition[] = [
  {
    id: "env-1",
    name: "Development",
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
];

describe("selectEnvironmentDefinitions", () => {
  it("should return environment definitions data if available", () => {
    const mockState: EnvironmentDefinitionsState = {
      [PROJECT_ID]: {
        data: mockEnvironmentDefinitions,
      },
    };

    const selector = selectEnvironmentDefinitions({ projectId: PROJECT_ID });
    expect(selector.projector(mockState)).toEqual(mockEnvironmentDefinitions);
  });

  it("should throw an error if environment definitions have an error", () => {
    const mockState: EnvironmentDefinitionsState = {
      [PROJECT_ID]: {
        error: "Failed to load environment definitions",
      },
    };

    const selector = selectEnvironmentDefinitions({ projectId: PROJECT_ID });
    expect(() => selector.projector(mockState)).toThrow(
      "Failed to load environment definitions"
    );
  });

  it("should return undefined if environment definitions are not found for the sent project id", () => {
    const mockState: EnvironmentDefinitionsState = {};
    const selector = selectEnvironmentDefinitions({ projectId: PROJECT_ID });

    expect(selector.projector(mockState)).toBeUndefined();
  });
});
