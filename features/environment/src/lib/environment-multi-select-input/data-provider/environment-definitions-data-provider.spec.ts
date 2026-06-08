import { EnvironmentDefinitionsDataProvider } from "./environment-definitions-data-provider";
import { EnvironmentService } from "../../service/environment.service";
import { EnvironmentDefinition } from "../../environment-definition";
import { EnvironmentDefinitionStatus } from "../../environment-definition-status";
import { of, firstValueFrom } from "rxjs";

describe("EnvironmentDefinitionsDataProvider", () => {
  let provider: EnvironmentDefinitionsDataProvider;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;

  const MOCK_DEFINITION: EnvironmentDefinition = {
    id: "env-def-1",
    name: "Production",
    status: EnvironmentDefinitionStatus.ACTIVE,
  };

  const MOCK_DEFINITIONS: EnvironmentDefinition[] = [
    MOCK_DEFINITION,
    {
      id: "env-def-2",
      name: "Staging",
      status: EnvironmentDefinitionStatus.ACTIVE,
    },
  ];

  beforeEach(() => {
    mockEnvironmentService = {
      getEnvironmentDefinitions: jest
        .fn()
        .mockReturnValue(of(MOCK_DEFINITIONS)),
    } as unknown as jest.Mocked<EnvironmentService>;

    provider = new EnvironmentDefinitionsDataProvider(mockEnvironmentService);
  });

  describe("fetchData", () => {
    it("should fetch environment definitions with correct project id", async () => {
      const params = { projectId: "project-123", includeInactive: false };

      const result = await firstValueFrom(provider.fetchData(params));

      expect(
        mockEnvironmentService.getEnvironmentDefinitions
      ).toHaveBeenCalledWith("project-123", false);
      expect(result).toEqual(MOCK_DEFINITIONS);
    });

    it("should pass includeInactive flag to environment service", async () => {
      const params = { projectId: "project-123", includeInactive: true };

      await firstValueFrom(provider.fetchData(params));

      expect(
        mockEnvironmentService.getEnvironmentDefinitions
      ).toHaveBeenCalledWith("project-123", true);
    });
  });

  describe("toDropdownOption", () => {
    it("should convert environment definition to dropdown option with name as label", () => {
      const option = provider.toDropdownOption(MOCK_DEFINITION);

      expect(option).toEqual({
        label: "Production",
        value: MOCK_DEFINITION,
      });
    });
  });

  describe("getItemId", () => {
    it("should return environment definition id", () => {
      const id = provider.getItemId(MOCK_DEFINITION);

      expect(id).toBe("env-def-1");
    });
  });
});
