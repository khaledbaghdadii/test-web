import { of, lastValueFrom } from "rxjs";
import { MxBuildIdDataProvider } from "./mx-build-id-data-provider";
import { FactoryProductApiService } from "@mxevolve/domains/artifact/data-access";

describe("MxBuildIdDataProvider", () => {
  let dataProvider: MxBuildIdDataProvider;
  let mockService: jest.Mocked<FactoryProductApiService>;

  beforeEach(() => {
    mockService = {
      getDistinctBuilds: jest.fn().mockReturnValue(
        of({
          content: [
            { buildId: "build-1", projectId: undefined },
            { buildId: "build-2", projectId: "project-1" },
          ],
          last: true,
        })
      ),
    } as unknown as jest.Mocked<FactoryProductApiService>;

    dataProvider = new MxBuildIdDataProvider(mockService);
  });

  describe("fetchData", () => {
    it("delegates to FactoryProductApiService with correct params", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          { projectId: "project-1", softwareProductVersion: "3.1.65" },
          0,
          10,
          ""
        )
      ).then(() => {
        expect(mockService.getDistinctBuilds).toHaveBeenCalledWith(
          "project-1",
          "3.1.65",
          0,
          10,
          ""
        );
      });
    });

    it("returns the mapped PageResponse", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          { projectId: "project-1", softwareProductVersion: "3.1.65" },
          0,
          10,
          ""
        )
      ).then((result) => {
        expect(result.content).toHaveLength(2);
        expect(result.last).toBe(true);
      });
    });

    it("returns empty page when softwareProductVersion is empty", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          { projectId: "project-1", softwareProductVersion: "" },
          0,
          10,
          ""
        )
      ).then((result) => {
        expect(result.content).toEqual([]);
        expect(result.last).toBe(true);
      });
    });

    it("does not call the API when softwareProductVersion is empty", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          { projectId: "project-1", softwareProductVersion: "" },
          0,
          10,
          ""
        )
      ).then(() => {
        expect(mockService.getDistinctBuilds).not.toHaveBeenCalled();
      });
    });

    it("passes search key to getDistinctBuilds", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          { projectId: "project-1", softwareProductVersion: "3.1.65" },
          0,
          10,
          "build-search"
        )
      ).then(() => {
        expect(mockService.getDistinctBuilds).toHaveBeenCalledWith(
          "project-1",
          "3.1.65",
          0,
          10,
          "build-search"
        );
      });
    });
  });

  describe("toDropdownOption", () => {
    it("returns buildId as label for global builds", () => {
      const option = dataProvider.toDropdownOption({
        buildId: "build-1",
        projectId: undefined,
      });

      expect(option).toEqual({
        label: "build-1",
        value: { buildId: "build-1", projectId: undefined },
      });
    });

    it("returns CUSTOM- prefix for project-specific builds", () => {
      const option = dataProvider.toDropdownOption({
        buildId: "build-2",
        projectId: "project-1",
      });

      expect(option).toEqual({
        label: "CUSTOM-build-2",
        value: { buildId: "build-2", projectId: "project-1" },
      });
    });
  });

  describe("getItemId", () => {
    it("returns buildId_global for global builds", () => {
      expect(
        dataProvider.getItemId({ buildId: "build-1", projectId: undefined })
      ).toBe("build-1_global");
    });

    it("returns buildId_projectId for project-specific builds", () => {
      expect(
        dataProvider.getItemId({ buildId: "build-2", projectId: "project-1" })
      ).toBe("build-2_project-1");
    });

    it("distinguishes global and custom builds with the same buildId", () => {
      const globalId = dataProvider.getItemId({
        buildId: "build-1",
        projectId: undefined,
      });
      const customId = dataProvider.getItemId({
        buildId: "build-1",
        projectId: "project-1",
      });

      expect(globalId).not.toBe(customId);
    });
  });
});
