import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of } from "rxjs";
import {
  VersionApiModel,
  VersionType,
  Page,
  VersionService,
} from "@mxevolve/domains/test/data-access";
import { VersionValidationService } from "./version-validation.service";

const versionsPage: Page<VersionApiModel> = {
  content: [
    {
      id: "v1",
      name: "Version 1",
      active: true,
      type: VersionType.RELEASE_EFFECTIVE,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  last: true,
};

describe("VersionValidationService", () => {
  let versionValidationService: VersionValidationService;
  let versionService: jest.Mocked<VersionService>;

  beforeEach(() => {
    versionService = {
      fetchVersions: jest.fn().mockReturnValue(of(versionsPage)),
    } as unknown as jest.Mocked<VersionService>;

    TestBed.configureTestingModule({
      providers: [
        VersionValidationService,
        { provide: VersionService, useValue: versionService },
      ],
    });

    versionValidationService = TestBed.inject(VersionValidationService);
  });

  describe("validate versions", () => {
    it("should return an empty list without calling the backend when no names are given", async () => {
      const result = await firstValueFrom(
        versionValidationService.validateVersions([])
      );

      expect(result).toEqual({ validVersions: [], invalidVersions: [] });
    });

    it("should pass version types when fetching the versions", async () => {
      await firstValueFrom(
        versionValidationService.validateVersions(
          ["version-1"],
          [VersionType.ARCHIVAL]
        )
      );

      expect(versionService.fetchVersions).toHaveBeenCalledWith(
        expect.objectContaining({ versionTypes: [VersionType.ARCHIVAL] })
      );
    });

    it("should pass active when fetching the versions", async () => {
      await firstValueFrom(
        versionValidationService.validateVersions(
          ["version-1"],
          undefined,
          true
        )
      );

      expect(versionService.fetchVersions).toHaveBeenCalledWith(
        expect.objectContaining({ active: true })
      );
    });

    it("should not pass active when it is undefined", async () => {
      await firstValueFrom(
        versionValidationService.validateVersions(["version-1"])
      );

      expect(versionService.fetchVersions).toHaveBeenCalledWith(
        expect.not.objectContaining({ active: expect.anything() })
      );
    });

    it("should pass the names to the backend when fetching the versions", async () => {
      await firstValueFrom(
        versionValidationService.validateVersions(["version-1", "version-2"])
      );

      expect(versionService.fetchVersions).toHaveBeenCalledWith(
        expect.objectContaining({ names: ["version-1", "version-2"] })
      );
    });

    it("should return empty invalidVersions when all versions are valid", async () => {
      const result = await firstValueFrom(
        versionValidationService.validateVersions(["Version 1"])
      );

      expect(result.invalidVersions).toEqual([]);
    });

    it("should return all invalid versions when none of the versions are valid", async () => {
      const result = await firstValueFrom(
        versionValidationService.validateVersions(["Unknown 1", "Unknown 2"])
      );

      expect(result.invalidVersions).toEqual(["Unknown 1", "Unknown 2"]);
    });

    it("should return valid and invalid versions when some of the versions are valid", async () => {
      const result = await firstValueFrom(
        versionValidationService.validateVersions(["Version 1", "Unknown 1"])
      );

      expect(result).toEqual({
        validVersions: [{ id: "v1", name: "Version 1" }],
        invalidVersions: ["Unknown 1"],
      });
    });
  });
});
