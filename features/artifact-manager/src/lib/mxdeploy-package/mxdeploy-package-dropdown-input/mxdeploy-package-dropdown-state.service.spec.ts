import {
  FetchMxDeployPackagesFilter,
  MxDeployPackage,
  MxDeployPackagesPage,
} from "../model/mxdeploy-package";
import { MxDeployPackageDropdownOption } from "./mxdeploy-package-dropdown-option.model";
import { MxBuildVersion } from "../../version/mxbuild/model/mxbuild-version";
import { MavenBuildVersion } from "../../version/maven-build/model/maven-build-version";
import { Asset } from "../../asset/model/asset";
import { Storage } from "../../storage/model/storage";
import { PathBasedAssetLocation } from "../../location/model/path-based-asset-location";
import { AssetLocationType } from "../../location/model/asset-location-type";
import { MxDeployPackageDropdownStateService } from "./mxdeploy-package-dropdown-state.service";
import { ArtifactMxDeployPackageService } from "../mxdeploy-package.service";
import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { delay, dematerialize, materialize, of, throwError } from "rxjs";
import { VersionType } from "../../version/version-type";
import { MxDeployPackageDropdownDefaultSelectionMode } from "../model/mxdeploy-package-dropdown-default-selection-mode";
import { version } from "os";
import { StorageUseCase } from "../../storage/model/storage-use-case";
import { StorageType } from "@mxflow/features/artifact-manager";
const SEARCH_KEY = "SEARCH_KEY";
const SEARCH_KEY_2 = "SEARCH_KEY_2";

const PROJECT_ID = "PROJECT_ID";
const DEBOUNCE_TIME = 100;
const FILTERS: FetchMxDeployPackagesFilter = {
  pageSize: 10,
  pageIndex: 0,
  searchKey: SEARCH_KEY,
};
const EMPTY_PAGE: MxDeployPackagesPage = {
  content: [],
  size: 0,
  number: 0,
  totalPages: 0,
  totalElements: 0,
  last: true,
};
const MXDEPLOY_PACKAGE_ID_1 = "MXDEPLOY_PACKAGE_ID_1";
const MXDEPLOY_PACKAGE_ID_2 = "MXDEPLOY_PACKAGE_ID_2";
const MXDEPLOY_PACKAGE_TYPE_1 = "TYPE_1";
const MXDEPLOY_PACKAGE_TYPE_2 = "TYPE_2";
const VERSION_1: MxBuildVersion = {
  version: "version1",
  buildId: "buildId1",
  revision: "revision1",
  os: "os1",
  type: VersionType.MXBUILD,
};
const VERSION_2: MavenBuildVersion = {
  groupId: "groupId",
  artifactId: "artifactId",
  version: "version2",
  classifier: "classifier",
  type: VersionType.MAVEN,
};
const storage: Storage = {
  id: "storageID",
  baseUri: "http:/baseUri",
  name: "name",
  storageType: StorageType.HTTP,
  useCases: [StorageUseCase.DUMPS],
  createdOn: new Date(),
};
const assetLocation: PathBasedAssetLocation = {
  storage: storage,
  relativePath: "/relativePath",
  fullPath: "http:/baseUri/relativePath",
  type: AssetLocationType.PATH,
};
const asset: Asset = {
  id: "assetId",
  locations: [assetLocation],
};
const FIRST_MXDEPLOY_PACKAGE: MxDeployPackage = {
  id: MXDEPLOY_PACKAGE_ID_1,
  type: MXDEPLOY_PACKAGE_TYPE_1,
  version: VERSION_1,
  asset: asset,
  createdOn: new Date(),
};
const SECOND_MXDEPLOY_PACKAGE: MxDeployPackage = {
  id: MXDEPLOY_PACKAGE_ID_2,
  type: MXDEPLOY_PACKAGE_TYPE_2,
  version: VERSION_2,
  asset: asset,
  createdOn: new Date(),
};

const NEW_MXDEPLOY_PACKAGE: MxDeployPackage = {
  id: MXDEPLOY_PACKAGE_ID_1,
  type: MXDEPLOY_PACKAGE_TYPE_1,
  version: VERSION_1,
  asset: asset,
  createdOn: new Date("2025-1-1"),
};
const OLD_MXDEPLOY_PACKAGE: MxDeployPackage = {
  id: MXDEPLOY_PACKAGE_ID_2,
  type: MXDEPLOY_PACKAGE_TYPE_2,
  version: VERSION_2,
  asset: asset,
  createdOn: new Date("2024-1-1"),
};

const MXDEPLOY_PACKAGE_PAGE_FOR_DATE_CHECK = {
  content: [OLD_MXDEPLOY_PACKAGE, NEW_MXDEPLOY_PACKAGE],
  number: 0,
  size: 2,
  last: false,
  totalElements: 2,
  totalPages: 2,
};
const CUSTOM_MXDEPLOY_PACKAGE: MxDeployPackage = {
  id: "CUSTOM_MXDEPLOY_PACKAGE_ID",
  type: SEARCH_KEY,
  version: VERSION_1,
  asset: asset,
  createdOn: new Date(),
};
const FIRST_MXDEPLOY_PACKAGE_PAGE: MxDeployPackagesPage = {
  content: [FIRST_MXDEPLOY_PACKAGE],
  number: 0,
  size: 1,
  last: false,
  totalElements: 2,
  totalPages: 2,
};
const SECOND_MXDEPLOY_PACKAGE_PAGE: MxDeployPackagesPage = {
  content: [SECOND_MXDEPLOY_PACKAGE],
  number: 1,
  size: 1,
  last: true,
  totalElements: 2,
  totalPages: 2,
};
const FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS: MxDeployPackageDropdownOption[] =
  [
    {
      label: `${MXDEPLOY_PACKAGE_TYPE_1}-${VERSION_1.version}`,
      value: FIRST_MXDEPLOY_PACKAGE,
    },
  ];
const SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS: MxDeployPackageDropdownOption[] =
  [
    {
      label: `${MXDEPLOY_PACKAGE_TYPE_2}-${VERSION_2.version}`,
      value: SECOND_MXDEPLOY_PACKAGE,
    },
  ];
const CUSTOM_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS: MxDeployPackageDropdownOption[] =
  [
    {
      label: `${CUSTOM_MXDEPLOY_PACKAGE.type}-${VERSION_1.version}`,
      value: CUSTOM_MXDEPLOY_PACKAGE,
    },
  ];
const ACCUMULATED_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS: MxDeployPackageDropdownOption[] =
  FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS.concat(
    SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
  );

describe("MxDeployPackageDropdownStateService", () => {
  let service: MxDeployPackageDropdownStateService;
  let mxDeployPackageService: jest.Mocked<ArtifactMxDeployPackageService>;

  beforeEach(waitForAsync(() => {
    mxDeployPackageService = {
      getAllMxDeployPackages: jest.fn(() => of(FIRST_MXDEPLOY_PACKAGE_PAGE)),
      getMxDeployPackageById: jest.fn(() => of(CUSTOM_MXDEPLOY_PACKAGE)),
    } as unknown as jest.Mocked<ArtifactMxDeployPackageService>;

    TestBed.configureTestingModule({
      providers: [
        MxDeployPackageDropdownStateService,
        {
          provide: ArtifactMxDeployPackageService,
          useValue: mxDeployPackageService,
        },
      ],
    });
    service = TestBed.inject(MxDeployPackageDropdownStateService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("signals and observables initialization", () => {
    it("should initialize searchkey subject to undefined", () => {
      service["searchKeySubject"].subscribe((searchkey) =>
        expect(searchkey).toBeUndefined()
      );
    });

    it("should emit distinct values from searchKey observable", fakeAsync(() => {
      const emittedValues: string[] = [];
      service["searchKey$"].subscribe((value) => emittedValues.push(value!));

      setSearchKeySubject("first");
      tick(DEBOUNCE_TIME);
      setSearchKeySubject("second");
      tick(DEBOUNCE_TIME);
      setSearchKeySubject("third");
      tick(DEBOUNCE_TIME);

      expect(emittedValues).toEqual(["first", "second", "third"]);
    }));

    it("should initialize pageIndex subject correctly", () => {
      service["pageIndexSubject"].subscribe((pageIndex) =>
        expect(pageIndex).toEqual(0)
      );
    });

    it("should emit distinct values from pageIndex observable", () => {
      const emittedValues: number[] = [];
      service["pageIndex$"].subscribe((value) => emittedValues.push(value));

      setPageIndexSubject(0);
      setPageIndexSubject(1);
      setPageIndexSubject(1);
      setPageIndexSubject(2);

      expect(emittedValues).toEqual([0, 1, 2]);
    });

    it("should compute newMxDeployPackageDropdownOptions from mxDeployPackagesPage", fakeAsync(() => {
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      expect(service.newMXdeployPackageDropdownOptions()).toEqual(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );

      mxDeployPackageService.getAllMxDeployPackages.mockReturnValue(
        of(SECOND_MXDEPLOY_PACKAGE_PAGE)
      );
      setPageIndexSubject(1);
      expect(service.newMXdeployPackageDropdownOptions()).toEqual(
        SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );
    }));

    it("should compute isLastPage from the mxDeployPackagesPage signal", fakeAsync(() => {
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      expect(service.isLastPage()).toBeFalsy();

      mxDeployPackageService.getAllMxDeployPackages.mockReturnValue(
        of(SECOND_MXDEPLOY_PACKAGE_PAGE)
      );
      setPageIndexSubject(1);
      expect(service.isLastPage()).toBeTruthy();
    }));

    it("should initialize error message subject to undefined", () => {
      service["errorMessageSubject"].subscribe((error) =>
        expect(error).toBeUndefined()
      );
    });

    it("should initialize last fetched element subject correctly", () => {
      service["lastFetchedElementSubject"].subscribe((last) =>
        expect(last).toEqual(-1)
      );
    });
    it("should emit distinct values from last fetched element observable", () => {
      const emittedValues: number[] = [];
      service["lastFetchedElement$"].subscribe((value) =>
        emittedValues.push(value)
      );

      setLastFetchedElementSubject(1);
      setLastFetchedElementSubject(1);
      setLastFetchedElementSubject(2);

      expect(emittedValues).toEqual([-1, 1, 2]);
    });

    it("should initialize the last fetched element signal correctly", () => {
      expect(service.lastFetchedElement()).toEqual(-1);
    });

    it("should initialize isLoading signal correctly", () => {
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should initialize customMxDeployPackageIdSubject to null", () => {
      service["customMxDeployPackageIdSubject"].subscribe(
        (customMxDeployPackageId) => {
          expect(customMxDeployPackageId).toBeNull();
        }
      );
    });

    it("should emit values from customMxDeployPackageId$ observable", () => {
      let customMxDeployPackageId: string | undefined = undefined;
      service["customMxDeployPackageId$"].subscribe(
        (receivedCustomMxDeployPackageId) => {
          customMxDeployPackageId = receivedCustomMxDeployPackageId;
        }
      );
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);

      expect(customMxDeployPackageId).toEqual(CUSTOM_MXDEPLOY_PACKAGE.id);
    });

    it("should initialize dropdownDefaultSelectionModeSubject to LATEST", () => {
      service["dropdownDefaultSelectionModeSubject"].subscribe(
        (dropdownDefaultSelectionMode) => {
          expect(dropdownDefaultSelectionMode).toEqual(
            MxDeployPackageDropdownDefaultSelectionMode.LATEST
          );
        }
      );
    });

    it("should emit values from dropdownDefaultSelectionMode$ observable", () => {
      let dropdownDefaultSelectionMode:
        | MxDeployPackageDropdownDefaultSelectionMode
        | undefined;
      service["dropdownDefaultSelectionMode$"].subscribe(
        (defaultSelectionMode) => {
          dropdownDefaultSelectionMode = defaultSelectionMode;
        }
      );
      setDropdownDefaultSelectionMode(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );

      expect(dropdownDefaultSelectionMode).toEqual(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );
    });

    it("should default dropdownDefaultSelectionModeSignal to LATEST", () => {
      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        MxDeployPackageDropdownDefaultSelectionMode.LATEST
      );
    });

    it("should compute dropdownDefaultSelectionModeSignal from dropdownDefaultSelectionMode$ observable", () => {
      setDropdownDefaultSelectionMode(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );

      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );
    });

    it("should compute newMxDeployPackageDropdownOptions from mxDeployPackages", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      expect(service.newMXdeployPackageDropdownOptions()).toEqual(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );

      mxDeployPackageService.getAllMxDeployPackages.mockReturnValue(
        of(SECOND_MXDEPLOY_PACKAGE_PAGE)
      );
      setPageIndexSubject(1);
      expect(service.newMXdeployPackageDropdownOptions()).toEqual(
        SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      expect(service.newMXdeployPackageDropdownOptions()).toEqual(
        CUSTOM_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS.concat(
          SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        )
      );
    }));
  });

  describe("function Object() { [native code] }", () => {
    it("should not fetch custom mxdeploy package when not initialized", fakeAsync(() => {
      initializeSubjects();
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).not.toHaveBeenCalled();
    }));

    it("should fetch custom mxdeploy package when customMxDeployPackageId is specified", () => {
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);

      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
    });

    it("should fetch custom mxdeploy package once again when projectIdSubject changes", fakeAsync(() => {
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setProjectIdSubject("projectId");
      tick();

      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, "projectId");
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledTimes(2);
    }));

    it("should fetch custom mxdeploy package once again when customMxDeployPackageIdSubject changes", fakeAsync(() => {
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setCustomMxDeployPackageId("custom");
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith("custom", PROJECT_ID);
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledTimes(2);
    }));

    it("should fetch mxdeploy packages page with the correct filters", fakeAsync(() => {
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith(FILTERS);
    }));

    it("should not include searchKey in the filters if undefined", fakeAsync(async () => {
      setSearchKeySubject(undefined);
      tick(DEBOUNCE_TIME);
      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({ ...FILTERS, searchKey: undefined });
    }));

    it("should fetch mxdeploy packages page again when searchKeySubject changes", fakeAsync(async () => {
      setSearchKeySubject(SEARCH_KEY);
      setSearchKeySubject(SEARCH_KEY_2);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: SEARCH_KEY_2,
      });

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledTimes(2);
    }));

    it("should fetch mxdeploy packages page again when pageIndexSubject changes", fakeAsync(async () => {
      setPageIndexSubject(2);
      tick();

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: undefined,
        pageIndex: 2,
      });
      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledTimes(2);
    }));

    it("should emit the mxdeploy packages page value into a signal", fakeAsync(async () => {
      setSearchKeySubject(SEARCH_KEY);
      setSearchKeySubject(SEARCH_KEY_2);
      tick(DEBOUNCE_TIME);
      expect(service.mxDeployPackagesPage()).toEqual(
        FIRST_MXDEPLOY_PACKAGE_PAGE
      );
    }));

    it("should aggregate mxDeployPackagesPage and customMxDeployPackage into the mxDeployPackages signal", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(SEARCH_KEY);
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(service.mxDeployPackages()).toEqual([
        CUSTOM_MXDEPLOY_PACKAGE,
        FIRST_MXDEPLOY_PACKAGE,
      ]);
    }));
    it("should propagate error through errorMessageSubject when fetching custom mxdeploy package fails", fakeAsync(() => {
      const FAILURE_MESSAGE = "Failed to fetch custom MXdeploy Package";
      let receivedFailure: string | undefined = undefined;
      initializeSubjects();
      service["errorMessageSubject"].subscribe(
        (error) => (receivedFailure = error)
      );
      mxDeployPackageService.getMxDeployPackageById.mockReturnValueOnce(
        throwError(() => new Error(FAILURE_MESSAGE))
      );
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: undefined,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(receivedFailure as unknown as string).toBe(FAILURE_MESSAGE);
    }));

    it("should load the mxDeploy packages list with null customMxDeployPackage when it is not provided", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
      });
      expect(service.mxDeployPackages()).toEqual([FIRST_MXDEPLOY_PACKAGE]);
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).not.toHaveBeenCalled();
    }));

    it("should remove duplicated items from the mxDeployPackages list when customMxDeployPackage matches an existing mxdeploy package", fakeAsync(() => {
      const mxDeployPackagesPage: MxDeployPackagesPage = {
        content: [FIRST_MXDEPLOY_PACKAGE],
        number: 1,
        size: 2,
        last: true,
        totalElements: 2,
        totalPages: 2,
      };
      const MXDEPLOY_PACKAGE: MxDeployPackage = {
        id: FIRST_MXDEPLOY_PACKAGE.id,
        type: FIRST_MXDEPLOY_PACKAGE.type,
        version: FIRST_MXDEPLOY_PACKAGE.version,
      } as unknown as MxDeployPackage;
      mxDeployPackageService.getMxDeployPackageById.mockReturnValueOnce(
        of(MXDEPLOY_PACKAGE)
      );
      mxDeployPackageService.getAllMxDeployPackages.mockReturnValueOnce(
        of(mxDeployPackagesPage)
      );
      initializeSubjects();
      setSearchKeySubject(SEARCH_KEY);
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(service.mxDeployPackageDropdownOptions()).toEqual([
        {
          label: `${MXDEPLOY_PACKAGE_TYPE_1}-${VERSION_1.version}`,
          value: FIRST_MXDEPLOY_PACKAGE,
        },
      ]);
    }));

    it("should set the custom mxdeploy package to the beginning of the mxdeployPackages list when dropdownSelectionMode is set to CUSTOM", fakeAsync(() => {
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setDropdownDefaultSelectionMode(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: undefined,
      });
      expect(service.mxDeployPackages()).toEqual([
        CUSTOM_MXDEPLOY_PACKAGE,
        FIRST_MXDEPLOY_PACKAGE,
      ]);
    }));

    it("should include custom mxdeploy package when its type matches the search key", fakeAsync(() => {
      const searchKey = "search";
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: searchKey,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(service.mxDeployPackages()).toContain(CUSTOM_MXDEPLOY_PACKAGE);
    }));

    it("should include custom mxdeploy package when its type matches the search key different case", fakeAsync(() => {
      const searchKey = "SEARCH";
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: searchKey,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(service.mxDeployPackages()).toContain(CUSTOM_MXDEPLOY_PACKAGE);
    }));
    it("should include custom mxdeploy package when its version matches the search key", fakeAsync(() => {
      const searchKey = "version1";
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: searchKey,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(service.mxDeployPackages()).toContain(CUSTOM_MXDEPLOY_PACKAGE);
    }));

    it("should include custom mxdeploy package when its version matches the search key different case", fakeAsync(() => {
      const searchKey = "VERSION1";
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: searchKey,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(service.mxDeployPackages()).toContain(CUSTOM_MXDEPLOY_PACKAGE);
    }));

    it("should not include custom mxdeploy package when its version and type do not match the search key", fakeAsync(() => {
      const searchKey = "random";
      initializeSubjects();
      setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledWith({
        ...FILTERS,
        searchKey: searchKey,
      });
      expect(
        mxDeployPackageService.getMxDeployPackageById
      ).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id, PROJECT_ID);
      expect(service.mxDeployPackages()).not.toContain(CUSTOM_MXDEPLOY_PACKAGE);
    }));

    it("should emit the dropdownDefaultSelectionMode into a signal", fakeAsync(() => {
      setDropdownDefaultSelectionMode(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );

      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );
    }));

    it("should set the dropdownDefaultSelectionMode default value to LATEST", fakeAsync(() => {
      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        MxDeployPackageDropdownDefaultSelectionMode.LATEST
      );
    }));

    it("should set isLoading to true when fetching mxdeploy packages", () => {
      const isLoadingSpy = jest.spyOn(service.isLoadingData, "set");
      setPageIndexSubject(2);
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    });

    it("should set isLoading to false on successfully fetching mxdeploy packages", () => {
      expect(
        mxDeployPackageService.getAllMxDeployPackages
      ).toHaveBeenCalledTimes(1);
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should still react to changes when error occurs while retrieving dumps", fakeAsync(async () => {
      mxDeployPackageService.getAllMxDeployPackages
        .mockImplementationOnce(() =>
          throwError(() => "error").pipe(
            materialize(),
            delay(1000),
            dematerialize()
          )
        )
        .mockImplementationOnce(() => of(SECOND_MXDEPLOY_PACKAGE_PAGE));

      service["errorMessageSubject"].subscribe((next) => {
        expect(next).toEqual("Failed to fetch MXdeploy Packages");
      });
      service.setPageIndex(1);
      tick(2000);
      service.setPageIndex(0);
      tick();
      expect(service.isLoadingData()).toBe(false);
      expect(service.mxDeployPackagesPage()).toEqual(
        SECOND_MXDEPLOY_PACKAGE_PAGE
      );
      tick();
    }));
    it("should initialize value for page index siganl to zero", () => {
      expect(service.pageIndex()).toEqual(0);
    });

    it("should set value for page index siganl to the values emitted by ", fakeAsync(() => {
      setPageIndexSubject(3);
      tick();
      expect(service.pageIndex()).toEqual(3);
    }));

    it("should emit selectedOption values into the signal", () => {
      service["selectedOptionSubject"].next(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
      expect(service.selectedOption()).toEqual(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
    });

    it("should emit searchkey values into the signal", fakeAsync(() => {
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      expect(service.searchKey()).toEqual(SEARCH_KEY);
    }));

    describe("populating the mxdeploy package dropdown options", () => {
      it("should set mxdeploy package options after fetching first page", () => {
        expect(service.mxDeployPackageDropdownOptions()).toEqual(
          FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        );
      });

      it("should concatenate new options to existing options", fakeAsync(() => {
        mxDeployPackageService.getAllMxDeployPackages.mockReturnValue(
          of(SECOND_MXDEPLOY_PACKAGE_PAGE)
        );
        setPageIndexSubject(2);
        tick();

        expect(service.newMXdeployPackageDropdownOptions()).toEqual(
          SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        );
        expect(service.mxDeployPackageDropdownOptions()).toEqual(
          ACCUMULATED_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        );
      }));

      it("should replace the existing mxdeploy package options with the new options when pageIndex is 0", fakeAsync(() => {
        expect(service.mxDeployPackageDropdownOptions()).toEqual(
          FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        );
        expect(service.newMXdeployPackageDropdownOptions()).toEqual(
          FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        );
        mxDeployPackageService.getAllMxDeployPackages.mockReturnValue(
          of(SECOND_MXDEPLOY_PACKAGE_PAGE)
        );
        setPageIndexSubject(2);
        setPageIndexSubject(0);
        tick();

        expect(service.newMXdeployPackageDropdownOptions()).toEqual(
          SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        );
        expect(service.mxDeployPackageDropdownOptions()).toEqual(
          SECOND_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
        );
      }));
    });
  });

  describe("setters", () => {
    it("should set project id", () => {
      const nextSpy = jest.spyOn(service["projectIdSubject"], "next");
      service.setProjectId("newProjectId");
      expect(nextSpy).toHaveBeenCalledWith("newProjectId");
    });

    it("should set customMxDeployPackageId", () => {
      const nextSpy = jest.spyOn(
        service["customMxDeployPackageIdSubject"],
        "next"
      );
      service.setCustomMxDeployPackageId(CUSTOM_MXDEPLOY_PACKAGE.id);

      expect(nextSpy).toHaveBeenCalledWith(CUSTOM_MXDEPLOY_PACKAGE.id);
    });

    it("should set dropdownDefaultSelectionMode", () => {
      const nextSpy = jest.spyOn(
        service["dropdownDefaultSelectionModeSubject"],
        "next"
      );
      service.setDropdownDefaultSelectionMode(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );

      expect(nextSpy).toHaveBeenCalledWith(
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
      );
    });

    it("should set page index", () => {
      const nextSpy = jest.spyOn(service["pageIndexSubject"], "next");
      service.setPageIndex(2);
      expect(nextSpy).toHaveBeenCalledWith(2);
    });

    it.each([undefined, SEARCH_KEY])("should set search key", (searchKey) => {
      const nextSpy = jest.spyOn(service["searchKeySubject"], "next");
      service.setSearchKey(searchKey);
      expect(nextSpy).toHaveBeenCalledWith(searchKey);
    });

    it.each([undefined, FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]])(
      "should set selected option",
      (selectedOption) => {
        const nextSpy = jest.spyOn(service["selectedOptionSubject"], "next");
        service.setSelectedOption(selectedOption);
        expect(nextSpy).toHaveBeenCalledWith(selectedOption);
      }
    );

    it("should set lastFetchedElement", () => {
      const nextSpy = jest.spyOn(service["lastFetchedElementSubject"], "next");
      service.setLastFetchedElement(2);
      expect(nextSpy).toHaveBeenCalledWith(2);
    });
  });
  function setPageIndexSubject(index: number) {
    service["pageIndexSubject"].next(index);
  }

  function setLastFetchedElementSubject(last: number) {
    service["lastFetchedElementSubject"].next(last);
  }

  function setSearchKeySubject(searchKey: string | undefined) {
    service["searchKeySubject"].next(searchKey);
  }

  function setCustomMxDeployPackageId(customMxDeployPackageId: string) {
    service["customMxDeployPackageIdSubject"].next(customMxDeployPackageId);
  }

  function setDropdownDefaultSelectionMode(
    dropdownDefaultSelectionMode: MxDeployPackageDropdownDefaultSelectionMode
  ) {
    service["dropdownDefaultSelectionModeSubject"].next(
      dropdownDefaultSelectionMode
    );
  }

  function setProjectIdSubject(projectId: string) {
    service["projectIdSubject"].next(projectId);
  }

  function initializeSubjects() {
    setProjectIdSubject(PROJECT_ID);
  }
});

describe("MxDeployPackageDropdownStateServiceDateSortingTest", () => {
  let service: MxDeployPackageDropdownStateService;
  let mxDeployPackageService: jest.Mocked<ArtifactMxDeployPackageService>;

  beforeEach(waitForAsync(() => {
    mxDeployPackageService = {
      getAllMxDeployPackages: jest.fn(() =>
        of(MXDEPLOY_PACKAGE_PAGE_FOR_DATE_CHECK)
      ),
      getMxDeployPackageById: jest.fn(() => of(CUSTOM_MXDEPLOY_PACKAGE)),
    } as unknown as jest.Mocked<ArtifactMxDeployPackageService>;

    TestBed.configureTestingModule({
      providers: [
        MxDeployPackageDropdownStateService,
        {
          provide: ArtifactMxDeployPackageService,
          useValue: mxDeployPackageService,
        },
      ],
    });
    service = TestBed.inject(MxDeployPackageDropdownStateService);
  }));

  it("should sort mxdeploy packages by creation date when dropdownSelectionMode is set to LATEST", fakeAsync(() => {
    expect(mxDeployPackageService.getAllMxDeployPackages).toHaveBeenCalledWith({
      ...FILTERS,
      searchKey: undefined,
    });
    expect(service.mxDeployPackages()).toEqual([
      NEW_MXDEPLOY_PACKAGE,
      OLD_MXDEPLOY_PACKAGE,
    ]);
  }));
});
