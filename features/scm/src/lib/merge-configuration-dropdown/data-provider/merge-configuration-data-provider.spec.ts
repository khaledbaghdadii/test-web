import { of, throwError, firstValueFrom } from "rxjs";
import { MergeConfigurationDataProvider } from "./merge-configuration-data-provider";
import { MergeConfigurationService } from "@mxflow/features/scm-management";

describe("MergeConfigurationDataProvider", () => {
  let dataProvider: MergeConfigurationDataProvider;
  let mergeConfigurationService: jest.Mocked<MergeConfigurationService>;

  const PROJECT_ID = "project-1";
  const REPOSITORY_ID = "repo-1";
  const MERGE_CONFIG = {
    id: "mc-1",
    projectId: PROJECT_ID,
    branchName: "main",
    mergeConfigurationDefinition: {
      id: "mcd-1",
      repositoryId: REPOSITORY_ID,
      branchPattern: "^main$",
    },
  };
  const MERGE_CONFIG_2 = {
    id: "mc-2",
    projectId: PROJECT_ID,
    branchName: "develop",
    mergeConfigurationDefinition: {
      id: "mcd-2",
      repositoryId: REPOSITORY_ID,
      branchPattern: "^develop.*$",
    },
  };

  beforeEach(() => {
    mergeConfigurationService = {
      getFilteredMergeConfigurations: jest.fn(),
    } as unknown as jest.Mocked<MergeConfigurationService>;

    dataProvider = new MergeConfigurationDataProvider(
      mergeConfigurationService
    );
  });

  describe("fetchData", () => {
    it("should call getFilteredMergeConfigurations with correct parameters", async () => {
      mergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
        of({
          content: [MERGE_CONFIG, MERGE_CONFIG_2],
          last: false,
          totalPages: 2,
          totalElements: 20,
          size: 10,
          number: 0,
        })
      );

      const result = await firstValueFrom(
        dataProvider.fetchData(
          { projectId: PROJECT_ID, repositoryId: REPOSITORY_ID },
          0,
          10,
          "search"
        )
      );

      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        { searchKey: "search", repositoryId: REPOSITORY_ID },
        10,
        0
      );
      expect(result.content).toEqual([MERGE_CONFIG, MERGE_CONFIG_2]);
      expect(result.last).toBe(false);
    });

    it("should propagate errors from the service", async () => {
      mergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
        throwError(() => new Error("Service error"))
      );

      await expect(
        firstValueFrom(
          dataProvider.fetchData(
            { projectId: PROJECT_ID, repositoryId: REPOSITORY_ID },
            0,
            10,
            ""
          )
        )
      ).rejects.toThrow("Service error");
    });
  });

  describe("toDropdownOption", () => {
    it("should return a dropdown option with branch name as label", () => {
      const option = dataProvider.toDropdownOption(MERGE_CONFIG);
      expect(option.label).toBe("main");
      expect(option.value).toEqual(MERGE_CONFIG);
    });

    it("should include branchPattern as tooltip", () => {
      const option = dataProvider.toDropdownOption(MERGE_CONFIG);
      expect(option.tooltip).toBe("^main$");
    });
  });

  describe("getItemId", () => {
    it("should return the merge configuration id", () => {
      expect(dataProvider.getItemId(MERGE_CONFIG)).toBe("mc-1");
    });
  });
});
