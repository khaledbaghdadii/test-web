import { of, lastValueFrom } from "rxjs";
import { MxVersionDataProvider } from "./mx-version-data-provider";
import { FactoryProductApiService } from "@mxevolve/domains/artifact/data-access";

describe("MxVersionDataProvider", () => {
  let dataProvider: MxVersionDataProvider;
  let mockService: jest.Mocked<FactoryProductApiService>;

  beforeEach(() => {
    mockService = {
      getDistinctVersions: jest.fn().mockReturnValue(
        of({
          content: [{ version: "3.1.65" }, { version: "3.1.64" }],
          last: false,
        })
      ),
    } as unknown as jest.Mocked<FactoryProductApiService>;

    dataProvider = new MxVersionDataProvider(mockService);
  });

  describe("fetchData", () => {
    it("delegates to FactoryProductApiService with correct params", () => {
      return lastValueFrom(
        dataProvider.fetchData({ projectId: "project-1" }, 0, 10, "")
      ).then(() => {
        expect(mockService.getDistinctVersions).toHaveBeenCalledWith(
          "project-1",
          0,
          10,
          ""
        );
      });
    });

    it("returns the mapped PageResponse", () => {
      return lastValueFrom(
        dataProvider.fetchData({ projectId: "project-1" }, 0, 10, "")
      ).then((result) => {
        expect(result.content).toEqual([
          { version: "3.1.65" },
          { version: "3.1.64" },
        ]);
        expect(result.last).toBe(false);
      });
    });

    it("passes page index and page size correctly", () => {
      return lastValueFrom(
        dataProvider.fetchData({ projectId: "project-1" }, 2, 20, "")
      ).then(() => {
        expect(mockService.getDistinctVersions).toHaveBeenCalledWith(
          "project-1",
          2,
          20,
          ""
        );
      });
    });

    it("passes search key to getDistinctVersions", () => {
      return lastValueFrom(
        dataProvider.fetchData({ projectId: "project-1" }, 0, 10, "3.1")
      ).then(() => {
        expect(mockService.getDistinctVersions).toHaveBeenCalledWith(
          "project-1",
          0,
          10,
          "3.1"
        );
      });
    });
  });

  describe("toDropdownOption", () => {
    it("maps version to dropdown option with version as label", () => {
      const option = dataProvider.toDropdownOption({ version: "3.1.65" });

      expect(option).toEqual({
        label: "3.1.65",
        value: { version: "3.1.65" },
      });
    });
  });

  describe("getItemId", () => {
    it("returns the version string as the unique ID", () => {
      expect(dataProvider.getItemId({ version: "3.1.65" })).toBe("3.1.65");
    });
  });
});
