import { of, throwError, firstValueFrom } from "rxjs";
import { DestinationBranchDataProvider } from "./destination-branch-data-provider";
import { MergeConfigurationService } from "../../merge-configuration/merge-configuration.service";

describe("DestinationBranchDataProvider", () => {
  let dataProvider: DestinationBranchDataProvider;
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

    dataProvider = new DestinationBranchDataProvider(mergeConfigurationService);
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

    it("should map response to PageResponse with content and last only", async () => {
      mergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
        of({
          content: [MERGE_CONFIG],
          last: true,
          totalPages: 1,
          totalElements: 1,
          size: 10,
          number: 0,
        })
      );

      const result = await firstValueFrom(
        dataProvider.fetchData(
          { projectId: PROJECT_ID, repositoryId: REPOSITORY_ID },
          0,
          10,
          ""
        )
      );

      expect(result).toEqual({
        content: [MERGE_CONFIG],
        last: true,
      });
    });

    it("should pass empty search key correctly", async () => {
      mergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
        of({
          content: [],
          last: true,
          totalPages: 0,
          totalElements: 0,
          size: 10,
          number: 0,
        })
      );

      const result = await firstValueFrom(
        dataProvider.fetchData(
          { projectId: PROJECT_ID, repositoryId: REPOSITORY_ID },
          0,
          10,
          ""
        )
      );

      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        { searchKey: "", repositoryId: REPOSITORY_ID },
        10,
        0
      );
      expect(result.content).toEqual([]);
      expect(result.last).toBe(true);
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

    it("should use the correct branch name for each configuration", () => {
      const option = dataProvider.toDropdownOption(MERGE_CONFIG_2);
      expect(option.label).toBe("develop");
      expect(option.value).toEqual(MERGE_CONFIG_2);
    });

    it("should include branchPattern as tooltip", () => {
      const option = dataProvider.toDropdownOption(MERGE_CONFIG);
      expect(option.tooltip).toBe("^main$");
    });

    it("should include branchPattern as tooltip for pattern-based config", () => {
      const option = dataProvider.toDropdownOption(MERGE_CONFIG_2);
      expect(option.tooltip).toBe("^develop.*$");
    });
  });

  describe("getItemId", () => {
    it("should return the merge configuration id", () => {
      expect(dataProvider.getItemId(MERGE_CONFIG)).toBe("mc-1");
    });

    it("should return the correct id for different configurations", () => {
      expect(dataProvider.getItemId(MERGE_CONFIG_2)).toBe("mc-2");
    });
  });
});
