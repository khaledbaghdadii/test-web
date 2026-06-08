import {
  AssetLocation,
  AssetLocationType,
  FinalProduct,
  FinalProductLatestSyncState,
  FinalProductScope,
  FinalProductService,
  FinalProductState,
  Storage,
  StorageType,
  StorageUseCase,
  SyncState,
} from "@mxflow/features/artifact-manager";
import { Project, ProjectService } from "@mxflow/features/project";
import {
  delay,
  dematerialize,
  materialize,
  of,
  Subject,
  throwError,
} from "rxjs";
import { FinalProductStateService } from "./final-product-state.service";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { SyncFinalProductApiRequest } from "../model/sync-final-product-api-request";

const PROJECT_ID = "PROJECT-ID";
const PROJECT_ID2 = "PROJECT-ID2";
const PROJECT_NAME = "PROJECT-NAME";
const PROJECT_DESCRIPTION = "PROJECT-DESCRIPTION";

const PROJECT: Project = {
  id: PROJECT_ID,
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
};
const MOCK_USER_CASE_1 = StorageUseCase.CLIENT_CONFIGURATIONS;
const MOCK_USER_CASE_2 = StorageUseCase.FACTORY_PRODUCTS;
const MOCK_USE_CASES = [MOCK_USER_CASE_1, MOCK_USER_CASE_2];
const MOCK_CREATED_BY = "User1";
const MOCK_STORAGE: Storage = {
  id: "storage_id",
  baseUri: "base-uri",
  name: "name",
  storageType: StorageType.HTTP,
  useCases: MOCK_USE_CASES,
  createdOn: new Date(),
  createdBy: MOCK_CREATED_BY,
};
const MOCK_ASSET_LOCATION: AssetLocation = {
  storage: MOCK_STORAGE,
  relativePath: "/path",
  fullPath: "/full/path",
  type: AssetLocationType.PATH,
};
const FINAL_PRODUCT: FinalProduct = {
  id: "finalProductId",
  projectId: "projectId",
  branch: "branch",
  repositoryId: "repositoryId",
  tag: "tag",
  validationLevel: "validationLevel",
  version: "version",
  environmentDefinitionId: "environmentDefinitionId",
  configurationCommitId: "configurationCommitId",
  state: "available",
  latestSyncState: FinalProductLatestSyncState.SUCCESS,
  createdOn: "createdOnDate",
  rtpProduct: {
    id: "id",
    tag: "tag",
    rtpCommitId: "rtpCommitId",
  },
  factoryProduct: {
    id: "id",
    type: "type",
    softwareProduct: {
      id: "id",
      version: "version",
      revision: "revision",
    },
  },
  clientConfigurations: [
    {
      id: "id",
      type: "type",
      branch: "branch",
      commitId: "commitId",
    },
  ],
  mxBundles: [
    {
      id: "id",
      type: "type",
    },
  ],
  isTools: [
    {
      id: "id",
      type: "type",
      name: "name",
    },
  ],
  syncRequests: [
    {
      id: "id",
      state: SyncState.SUCCESS,
      startDate: "startDate",
      endDate: "endDate",
      environmentDefinitionIds: ["environmentDefinitionId"],
      lightPackage: false,
      asset: {
        id: "id",
        nickname: "nickname",
        locations: [MOCK_ASSET_LOCATION],
      },
    },
  ],
};

const FINAL_PRODUCTS = {
  content: [FINAL_PRODUCT],
  size: 1,
  number: 1,
  totalPages: 1,
  totalElements: 1,
  last: true,
};

const FINAL_PRODUCTS2 = {
  content: [FINAL_PRODUCT, FINAL_PRODUCT],
  size: 2,
  number: 2,
  totalPages: 1,
  totalElements: 2,
  last: true,
};

const mockFinalProductService = {
  getFilteredFinalProducts: jest.fn().mockReturnValue(of(FINAL_PRODUCTS)),
  getFinalProducts: jest.fn().mockReturnValue(of(FINAL_PRODUCTS)),
};

const mockProjectService = {
  getAllProjects: jest.fn().mockReturnValue(of([PROJECT])),
};

const EMPTY_PAGE = {
  content: [],
  size: 0,
  number: 0,
  totalPages: 0,
  totalElements: 0,
  last: true,
};

const ERROR_MESSAGE = "Failed to fetch final products";

describe("FinalProductStateService", () => {
  let service: FinalProductStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FinalProductStateService,
        {
          provide: FinalProductService,
          useValue: mockFinalProductService,
        },
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    });
  });

  function initializeServices() {
    service = TestBed.inject(FinalProductStateService);
  }

  describe("fetch final products tests", () => {
    beforeEach(() => {
      initializeServices();
    });

    it("should initialize with default values", () => {
      TestBed.tick();
      expect(service.pageSize()).toBe(20);
      expect(service.pageIndex()).toBe(0);
      expect(service.fetchFinalProductsLoading()).toBe(false);

      expect(service.isSyncFinalProductModalOpen()).toBe(false);
      expect(service.isSyncFinalProductLoading()).toBe(false);
      expect(service.selectedFinalProductToBeSynced()).toBe(undefined);
      service.errorMessage$.subscribe((value) => {
        expect(value).toEqual(undefined);
      });
      service.successMessageSubject.subscribe((value) => {
        expect(value).toEqual(undefined);
      });
      service.refreshTriggerSubject.subscribe((value) => {
        expect(value).toEqual(true);
      });
    });

    it("should update errorMessage$ when an error occurs while retrieving final products", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        throwError(() => ERROR_MESSAGE)
      );
      TestBed.tick();
      service.errorMessage$.subscribe((next) => {
        expect(next).toEqual(ERROR_MESSAGE);
      });
      service.setPageIndex(1);
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(EMPTY_PAGE);
      expect(service.fetchFinalProductsLoading()).toEqual(false);
    }));

    it("should still react to changes when error occurs while retrieving final products", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts
        .mockImplementationOnce(() =>
          throwError(() => ERROR_MESSAGE).pipe(
            materialize(),
            delay(1000),
            dematerialize()
          )
        )
        .mockImplementationOnce(() => of(FINAL_PRODUCTS2));
      service.errorMessage$.subscribe((next) => {
        expect(next).toEqual(ERROR_MESSAGE);
      });
      service.setPageIndex(1);
      service.setScope(FinalProductScope.GLOBAL);
      TestBed.tick();
      tick(1000);

      service.setPageIndex(1);
      TestBed.tick();
      tick(2000);
      service.setPageIndex(0);
      TestBed.tick();
      tick();
      expect(service.fetchFinalProductsLoading()).toBe(false);
      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
      tick();
    }));

    it("should update fetchFinalProductsLoading from false to true and back to false when data is returned", fakeAsync(() => {
      expect(service.fetchFinalProductsLoading()).toBe(false);
      mockFinalProductService.getFilteredFinalProducts.mockReturnValueOnce(
        of(FINAL_PRODUCTS).pipe(delay(1000))
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setPageIndex(1);
      TestBed.tick();
      tick();
      expect(service.fetchFinalProductsLoading()).toBe(true);
      tick(1000);
      expect(service.fetchFinalProductsLoading()).toBe(false);
    }));

    it("should update fetchFinalProductsLoading from false to true and back to false when error occurs", fakeAsync(() => {
      expect(service.fetchFinalProductsLoading()).toBe(false);
      mockFinalProductService.getFilteredFinalProducts.mockReturnValueOnce(
        throwError(() => ERROR_MESSAGE).pipe(
          materialize(),
          delay(1000),
          dematerialize()
        )
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setPageIndex(1);
      TestBed.tick();
      tick();
      expect(service.fetchFinalProductsLoading()).toBe(true);
      tick(1000);
      expect(service.fetchFinalProductsLoading()).toBe(false);
    }));

    it("should fetch final products when page index changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setPageIndex(1);
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when page size changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setPageSize(1);
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when project ids change", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setProjectIds([PROJECT_ID2]);
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when branch name changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setBranchNameSearchValue("");
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when state changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setFinalProductStates([FinalProductState.AVAILABLE]);
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should set state and reset page index", fakeAsync(() => {
      service.setFinalProductStates([FinalProductState.AVAILABLE]);
      service.finalProductState$.subscribe((state) => {
        expect(state).toEqual([FinalProductState.AVAILABLE]);
      });
      expect(service.pageIndex()).toBe(0);
    }));

    it("should fetch final products when latest sync state changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setLatestSyncState(FinalProductLatestSyncState.SUCCESS);
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should set latest sync state and reset page index", fakeAsync(() => {
      service.setLatestSyncState(FinalProductLatestSyncState.SUCCESS);
      service.latestSyncStateFilter$.subscribe((latestSyncState) => {
        expect(latestSyncState).toEqual(FinalProductLatestSyncState.SUCCESS);
      });
      expect(service.pageIndex()).toBe(0);
    }));

    it("should fetch final products when validation level changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setValidationLevelSearchValue([]); // pass empty array instead of empty string
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when configuration commit id changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setConfigurationCommitIdSearchValue("");
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when search key changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setSearchKeyValue("");
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when bundle type changes", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setMxBundlesType("");
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should fetch final products when is tool types change", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      service.setIsToolTypes([""]);
      TestBed.tick();
      tick();

      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));
  });

  describe("setters test", () => {
    const validSearchKey = "validSearchKey";
    const validBranchName = "validBranchName";
    const validValidationLevel = "validValidationLevel";
    const validCommitId = "validCommitId";
    const errorMessage = "errorMessage";
    const IS_TOOL1 = "isTool1";
    const IS_TOOL2 = "isTool2";
    const MX_BUNDLE1 = "mxBundle1";

    beforeEach(() => {
      initializeServices();
    });

    it("should set page size", () => {
      service.setPageSize(50);
      expect(service.pageSize()).toBe(50);
    });

    it("should set page index", () => {
      service.setPageIndex(2);
      expect(service.pageIndex()).toBe(2);
    });

    it("should set projectIds", (done) => {
      service.projectIds$.subscribe((projectIds) => {
        expect(projectIds).toEqual([PROJECT_ID, PROJECT_ID2]);
        done();
      });
      service.setProjectIds([PROJECT_ID, PROJECT_ID2]);
    });

    it("should set is tool types", (done) => {
      service.isToolTypeFilter$.subscribe((isToolTypes) => {
        expect(isToolTypes).toEqual([IS_TOOL1, IS_TOOL2]);
        done();
      });
      service.setIsToolTypes([IS_TOOL1, IS_TOOL2]);
    });

    it("should set mx bundles types", (done) => {
      service.mxBundleTypeFilter$.subscribe((mxBundleType) => {
        expect(mxBundleType).toEqual(MX_BUNDLE1);
        done();
      });
      service.setMxBundlesType(MX_BUNDLE1);
    });

    it("should set search key", (done) => {
      service.searchKey$.subscribe((searchKey) => {
        expect(searchKey).toEqual(validSearchKey);
        done();
      });
      service.setSearchKeyValue(validSearchKey);
    });

    it("should set branch name", (done) => {
      service.brachNameSearch$.subscribe((branch) => {
        expect(branch).toEqual(validBranchName);
        done();
      });
      service.setBranchNameSearchValue(validBranchName);
    });

    it("should set validation level", (done) => {
      service.validationLevelSearch$.subscribe((validationLevel) => {
        expect(validationLevel).toEqual([validValidationLevel]); // expect array
        done();
      });
      service.setValidationLevelSearchValue([validValidationLevel]); // pass array
    });

    it("should set configuration commit id", (done) => {
      service.configurationCommitIdSearch$.subscribe((commitId) => {
        expect(commitId).toEqual(validCommitId);
        done();
      });
      service.setConfigurationCommitIdSearchValue(validCommitId);
    });

    it("should set error message", (done) => {
      service.errorMessage$.subscribe((errorMessage) => {
        expect(errorMessage).toEqual(errorMessage);
        done();
      });
      service.setErrorMessage(errorMessage);
    });

    it("should set selected final product to be synced", () => {
      service.setSelectedFinalProductToBeSynced(FINAL_PRODUCT);
      expect(service.selectedFinalProductToBeSynced()).toEqual(FINAL_PRODUCT);
    });

    it("should set selected final product", () => {
      service.setSelectedFinalProduct(FINAL_PRODUCT);
      expect(service.selectedFinalProduct()).toEqual(FINAL_PRODUCT);
    });

    it("should set is sync final product modal open", () => {
      service.setIsSyncFinalProductModalOpen(true);
      expect(service.isSyncFinalProductModalOpen()).toBe(true);
    });

    it("should set sync final product loading", () => {
      service.setSyncFinalProductLoading(true);
      expect(service.isSyncFinalProductLoading()).toBe(true);
    });
  });

  describe("sync final product tests", () => {
    const finalProductService = {
      syncFinalProduct: jest.fn().mockReturnValue(of({})),
    };

    const syncFinalProductRequest: SyncFinalProductApiRequest = {
      infraGroupId: "infraGroupId",
      environmentDefinitionIds: ["environmentDefinitionId"],
      lightPackage: false,
      destinationMetadata: {
        storageType: "nfs",
        packageName: "packageName",
        directoryName: "directoryName",
      },
    };

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          FinalProductStateService,
          {
            provide: FinalProductService,
            useValue: finalProductService,
          },
        ],
      });
      initializeServices();
    });

    it("should set error message when sync final product fails", fakeAsync(() => {
      finalProductService.syncFinalProduct.mockReturnValue(
        throwError(() => new Error("error"))
      );
      service
        .syncFinalProduct(PROJECT_ID, FINAL_PRODUCT.id, syncFinalProductRequest)
        .subscribe({
          error: () => {
            service.errorMessage$.subscribe((value) => {
              expect(value).toEqual("Sync of final product failed");
            });
          },
        });
      tick();
    }));
  });

  describe("scope tests", () => {
    beforeEach(() => {
      initializeServices();
    });

    it("should use getFilteredFinalProducts when scope is GLOBAL", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockClear();
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.GLOBAL);
      TestBed.tick();
      tick();

      expect(
        mockFinalProductService.getFilteredFinalProducts
      ).toHaveBeenCalled();
      expect(mockFinalProductService.getFinalProducts).not.toHaveBeenCalled();
      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should use getFinalProducts when scope is PROJECT with projectId", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.PROJECT);
      service.setScopeProjectId(PROJECT_ID);
      TestBed.tick();
      tick();

      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(Object),
        PROJECT_ID
      );
      expect(
        mockFinalProductService.getFilteredFinalProducts
      ).not.toHaveBeenCalled();
      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should throw error when scope is PROJECT but projectId is undefined", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockClear();

      service.setScope(FinalProductScope.PROJECT);
      service.setScopeProjectId(undefined);
      TestBed.tick();
      tick();

      service.errorMessage$.subscribe((next) => {
        expect(next).toEqual(
          "Project ID is required when scope is set to PROJECT"
        );
      });
      expect(
        mockFinalProductService.getFilteredFinalProducts
      ).not.toHaveBeenCalled();
      expect(mockFinalProductService.getFinalProducts).not.toHaveBeenCalled();
      expect(service.finalProducts()).toEqual(EMPTY_PAGE);
      expect(service.fetchFinalProductsLoading()).toBe(false);
    }));

    it("should throw error when scope is PROJECT but projectId is null", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockClear();

      service.setScope(FinalProductScope.PROJECT);
      service.setScopeProjectId(null as unknown as undefined);
      TestBed.tick();
      tick();

      service.errorMessage$.subscribe((next) => {
        expect(next).toEqual(
          "Project ID is required when scope is set to PROJECT"
        );
      });
      expect(
        mockFinalProductService.getFilteredFinalProducts
      ).not.toHaveBeenCalled();
      expect(mockFinalProductService.getFinalProducts).not.toHaveBeenCalled();
      expect(service.finalProducts()).toEqual(EMPTY_PAGE);
      expect(service.fetchFinalProductsLoading()).toBe(false);
    }));

    it("should switch from GLOBAL to PROJECT scope correctly", fakeAsync(() => {
      mockFinalProductService.getFilteredFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockClear();
      mockFinalProductService.getFilteredFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS)
      );
      mockFinalProductService.getFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      // Start with GLOBAL
      service.setScope(FinalProductScope.GLOBAL);
      TestBed.tick();
      tick();

      expect(
        mockFinalProductService.getFilteredFinalProducts
      ).toHaveBeenCalled();
      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS);

      // Switch to PROJECT
      mockFinalProductService.getFilteredFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockClear();

      service.setScope(FinalProductScope.PROJECT);
      service.setScopeProjectId(PROJECT_ID);
      TestBed.tick();
      tick();

      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(Object),
        PROJECT_ID
      );
      expect(service.finalProducts()).toEqual(FINAL_PRODUCTS2);
    }));

    it("should pass correct filters to getFinalProducts in PROJECT scope", fakeAsync(() => {
      mockFinalProductService.getFinalProducts.mockClear();
      mockFinalProductService.getFinalProducts.mockReturnValue(
        of(FINAL_PRODUCTS2)
      );

      service.setScope(FinalProductScope.PROJECT);
      service.setScopeProjectId(PROJECT_ID);
      service.setBranchNameSearchValue("test-branch");
      service.setValidationLevelSearchValue(["level1"]);
      service.setPageIndex(2);
      service.setPageSize(50);
      TestBed.tick();
      tick();

      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          size: 50,
          branchFilter: "test-branch",
          validationLevelFilter: ["level1"],
        }),
        PROJECT_ID
      );
    }));
  });

  describe("resetState tests", () => {
    beforeEach(() => {
      initializeServices();
    });

    it("should reset all state variables to their default values", () => {
      service.setPageSize(50);
      service.setPageIndex(2);
      service.setBranchNameSearchValue("branchName");
      service.setValidationLevelSearchValue(["validationLevel"]); // pass array
      service.setConfigurationCommitIdSearchValue("commitId");
      service.setSearchKeyValue("searchKey");
      service.setProjectIds(["projectId1", "projectId2"]);
      service.setIsToolTypes(["toolType1", "toolType2"]);
      service.setMxBundlesType("bundleType");
      service.setErrorMessage("errorMessage");
      service.setIsSyncFinalProductModalOpen(true);
      service.setSyncFinalProductLoading(true);
      service.setSelectedFinalProductToBeSynced(FINAL_PRODUCT);
      service.setSelectedFinalProduct(FINAL_PRODUCT);

      service.resetState();

      expect(service.pageSize()).toBe(20);
      expect(service.pageIndex()).toBe(0);
      expect(service.fetchFinalProductsLoading()).toBe(false);
      expect(service.isSyncFinalProductLoading()).toBe(false);
      expect(service.isSyncFinalProductModalOpen()).toBe(false);
      expect(service.selectedFinalProductToBeSynced()).toBe(undefined);
      expect(service.selectedFinalProduct()).toBe(undefined);
      service.brachNameSearch$.subscribe((value) => {
        expect(value).toBe(undefined);
      });
      service.validationLevelSearch$.subscribe((value) => {
        expect(value).toBe(undefined);
      });
      service.configurationCommitIdSearch$.subscribe((value) => {
        expect(value).toBe(undefined);
      });
      service.searchKey$.subscribe((value) => {
        expect(value).toBe(undefined);
      });
      service.projectIds$.subscribe((value) => {
        expect(value).toBe(undefined);
      });
      service.isToolTypeFilter$.subscribe((value) => {
        expect(value).toBe(undefined);
      });
      service.mxBundleTypeFilter$.subscribe((value) => {
        expect(value).toBe(undefined);
      });
      service.errorMessage$.subscribe((value) => {
        expect(value).toBe("");
      });
      service.successMessageSubject.subscribe((value) => {
        expect(value).toBe("");
      });
    });
  });

  describe("destroyService tests", () => {
    beforeEach(() => {
      initializeServices();
    });

    it("should emit a value to destroyRef$ when destroyService is called", fakeAsync(() => {
      const serviceAsRecord = service as unknown as Record<
        string,
        Subject<unknown>
      >;
      const destroyRef$ = serviceAsRecord["destroyRef$"];

      let emittedValue: unknown;
      let valueEmitted = false;

      destroyRef$.subscribe({
        next: (value: unknown) => {
          emittedValue = value;
          valueEmitted = true;
        },
      });

      service.destroyService();
      tick();

      expect(valueEmitted).toBe(true);
      expect(emittedValue).toEqual({});
    }));
  });
});
