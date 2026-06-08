import { DumpsDataProvider } from "./dumps-data-provider";
import {
  ArtifactDumpsService,
  Dump,
  DumpsPage,
} from "@mxflow/features/artifact-manager";
import { firstValueFrom, of } from "rxjs";

describe("DumpsDataProvider", () => {
  let provider: DumpsDataProvider;
  let mockDumpsService: jest.Mocked<ArtifactDumpsService>;

  const MOCK_DUMP: Dump = {
    id: "dump-1",
  } as Dump;

  const MOCK_DUMPS_PAGE = {
    content: [MOCK_DUMP],
    last: false,
    totalPages: 2,
    totalElements: 15,
    size: 10,
    number: 0,
  };

  beforeEach(() => {
    mockDumpsService = {
      getAllDumps: jest.fn().mockReturnValue(of(MOCK_DUMPS_PAGE)),
    } as unknown as jest.Mocked<ArtifactDumpsService>;

    provider = new DumpsDataProvider(mockDumpsService);
  });

  describe("fetchData", () => {
    const pageIndex = 1;
    const pageSize = 20;
    const searchKey = "test";

    it("should fetch dumps with correct parameters", async () => {
      const response = await firstValueFrom(
        provider.fetchData(undefined, pageIndex, pageSize, searchKey)
      );

      expect(mockDumpsService.getAllDumps).toHaveBeenCalledWith({
        pageIndex: 1,
        pageSize: 20,
        searchKey: "test",
      });
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toEqual(MOCK_DUMP);
      expect(response.last).toBe(false);
    });

    it("should handle empty response from service", async () => {
      mockDumpsService.getAllDumps.mockReturnValue(
        of({
          totalPages: 0,
          totalElements: 0,
          size: 0,
          last: true,
        } as unknown as DumpsPage)
      );

      const response = await firstValueFrom(
        provider.fetchData(undefined, pageIndex, pageSize, searchKey)
      );

      expect(mockDumpsService.getAllDumps).toHaveBeenCalledWith({
        pageIndex: 1,
        pageSize: 20,
        searchKey: "test",
      });
      expect(response.content).toBeUndefined();
      expect(response.last).toBe(true);
    });
  });

  describe("toDropdownOption", () => {
    it("should convert dump to dropdown option with id as label", () => {
      const option = provider.toDropdownOption(MOCK_DUMP);

      expect(option).toEqual({
        label: "dump-1",
        value: MOCK_DUMP,
      });
    });
  });

  describe("getItemId", () => {
    it("should return dump id", () => {
      const id = provider.getItemId(MOCK_DUMP);

      expect(id).toBe("dump-1");
    });
  });
});
