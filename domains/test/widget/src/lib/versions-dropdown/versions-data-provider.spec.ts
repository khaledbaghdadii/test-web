import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of } from "rxjs";
import { VersionsDataProvider } from "./versions-data-provider";
import {
  Page,
  VersionApiModel,
  VersionService,
  VersionType,
} from "@mxevolve/domains/test/data-access";
import { VersionsDropdownParams } from "./versions-dropdown-params";

describe("VersionsDataProvider", () => {
  let provider: VersionsDataProvider;
  let versionService: jest.Mocked<VersionService>;

  const versionsPage: Page<VersionApiModel> = {
    content: [
      {
        id: "v1",
        name: "Version 1",
        active: true,
        type: VersionType.RELEASE_EFFECTIVE,
      },
      { id: "v2", name: "Version 2", active: true, type: VersionType.ARCHIVAL },
    ],
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    last: true,
  };

  const defaultParams: VersionsDropdownParams = {
    versionTypes: [VersionType.RELEASE_EFFECTIVE, VersionType.ARCHIVAL],
    active: true,
  };

  beforeEach(() => {
    versionService = {
      fetchVersions: jest.fn().mockReturnValue(of(versionsPage)),
    } as unknown as jest.Mocked<VersionService>;

    TestBed.configureTestingModule({
      providers: [
        VersionsDataProvider,
        { provide: VersionService, useValue: versionService },
      ],
    });

    provider = TestBed.inject(VersionsDataProvider);
  });

  it("should pass version types from params to the versions query", async () => {
    await firstValueFrom(provider.fetchData(defaultParams, 0, 20));

    expect(versionService.fetchVersions).toHaveBeenCalledWith(
      expect.objectContaining({ versionTypes: defaultParams.versionTypes })
    );
  });

  it.each([true, false])(
    "should include active param when provided",
    async (activeValue) => {
      await firstValueFrom(
        provider.fetchData({
          versionTypes: [VersionType.RELEASE_EFFECTIVE],
          active: activeValue,
        })
      );

      expect(versionService.fetchVersions).toHaveBeenCalledWith(
        expect.objectContaining({ active: activeValue })
      );
    }
  );

  it("should not include active param when undefined", async () => {
    await firstValueFrom(
      provider.fetchData({ versionTypes: [VersionType.RELEASE_EFFECTIVE] })
    );

    const query = versionService.fetchVersions.mock.calls[0][0];
    expect(query).not.toHaveProperty("active");
  });

  it("should include namePhrase in query when searchKey is provided", async () => {
    await firstValueFrom(provider.fetchData(defaultParams, 0, 20, "search"));

    expect(versionService.fetchVersions).toHaveBeenCalledWith(
      expect.objectContaining({ namePhrase: "search" })
    );
  });

  it.each(["", "   "])(
    "should not include namePhrase in query when searchKey is blank: %p",
    async (searchKey) => {
      await firstValueFrom(provider.fetchData(defaultParams, 0, 20, searchKey));

      const query = versionService.fetchVersions.mock.calls[0][0];
      expect(query).not.toHaveProperty("namePhrase");
    }
  );

  it("should map version API models to Version objects with id and name only", async () => {
    const result = await firstValueFrom(provider.fetchData(defaultParams));

    expect(result.content).toEqual([
      { id: "v1", name: "Version 1" },
      { id: "v2", name: "Version 2" },
    ]);
  });

  it("should map page last flag to response", async () => {
    const result = await firstValueFrom(provider.fetchData(defaultParams));

    expect(result.last).toBe(true);
  });

  it("should use default page index and size when not provided", async () => {
    await firstValueFrom(provider.fetchData(defaultParams));

    expect(versionService.fetchVersions).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 20 })
    );
  });

  it("should return item id from getItemId", () => {
    expect(provider.getItemId({ id: "v1", name: "Version 1" })).toBe("v1");
  });

  it("should map item to dropdown option from toDropdownOption", () => {
    const version = { id: "v1", name: "Version 1" };
    const option = provider.toDropdownOption(version);

    expect(option).toEqual({ label: "Version 1", value: version });
  });
});
