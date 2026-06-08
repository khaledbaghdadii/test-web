import { FinalProductDropdownStateService } from "./final-product-dropdown-state.service";
import { EMPTY, of, throwError } from "rxjs";
import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { FinalProductDropdownOption } from "./final-product-dropdown-option.model";
import { FinalProductService } from "../final-product.service";
import { FinalProduct, FinalProducts } from "../model/final-product";
import {
  FinalProductFilters,
  FinalProductState,
} from "../model/final-product-filters";
import {
  DropdownDefaultSelectionMode,
  FinalProductDropdownInputLabelMode,
} from "@mxflow/features/artifact-manager";
import { FinalProductApiResponse } from "../model/final-product-api-response";
import { ScmService } from "@mxflow/features/scm";

const PROJECT_ID = "projectId";
const BRANCH = "branch";
const FETCH_PARENT = true;
const COMMIT_ID = "commitId";
const CUSTOM_FINAL_PRODUCT_ID = "CUSTOM_FINAL_PRODUCT_ID";
const DEBOUNCE_TIME = 300;
const FILTERS: FinalProductFilters = {
  page: 0,
  size: 10,
  sort: "createdOn,desc",
  branchFilter: BRANCH,
  fetchParent: FETCH_PARENT,
  searchKey: COMMIT_ID,
  validationLevelFilter: [],
  stateFilter: [FinalProductState.AVAILABLE],
};

const EMPTY_PAGE: FinalProducts = {
  content: [],
  size: 0,
  number: 0,
  totalPages: 0,
  totalElements: 0,
  last: true,
};

const FIRST_FINAL_PRODUCT = {
  id: "firstFinalProductId",
  projectId: "firstProjectId",
  branch: "firstBranch",
  repositoryId: "firstRepositoryId",
  tag: "firstTag",
  configurationCommitId: "firstConfigurationCommitId",
} as unknown as FinalProduct;

const SECOND_FINAL_PRODUCT = {
  id: "secondFinalProductId",
  projectId: "secondProjectId",
  branch: "secondBranch",
  repositoryId: "secondRepositoryId",
  tag: "secondTag",
  configurationCommitId: "secondConfigurationCommitId",
} as unknown as FinalProduct;

const CUSTOM_FINAL_PRODUCT = {
  id: "customFinalProductId",
  projectId: "customProjectId",
  branch: "customBranch",
  repositoryId: "customRepositoryId",
  tag: "customTag",
  configurationCommitId: "customConfigurationCommitId",
} as unknown as FinalProduct;

const FIRST_FINAL_PRODUCT_PAGE: FinalProducts = {
  content: [FIRST_FINAL_PRODUCT],
  number: 0,
  size: 1,
  last: false,
  totalElements: 2,
  totalPages: 2,
};

const SECOND_FINAL_PRODUCT_PAGE: FinalProducts = {
  content: [SECOND_FINAL_PRODUCT],
  number: 1,
  size: 1,
  last: true,
  totalElements: 2,
  totalPages: 2,
};

const FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS: FinalProductDropdownOption[] = [
  {
    label: FIRST_FINAL_PRODUCT.configurationCommitId,
    value: FIRST_FINAL_PRODUCT,
  },
];

const FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE: FinalProductDropdownOption[] =
  [
    {
      label:
        FIRST_FINAL_PRODUCT.tag +
        "-" +
        FIRST_FINAL_PRODUCT.configurationCommitId,
      value: FIRST_FINAL_PRODUCT,
    },
  ];

const FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE: FinalProductDropdownOption[] =
  [
    {
      label: "firstTag",
      value: FIRST_FINAL_PRODUCT,
    },
  ];

const SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS: FinalProductDropdownOption[] = [
  {
    label: SECOND_FINAL_PRODUCT.configurationCommitId,
    value: SECOND_FINAL_PRODUCT,
  },
];

const SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE: FinalProductDropdownOption[] =
  [
    {
      label:
        SECOND_FINAL_PRODUCT.tag +
        "-" +
        SECOND_FINAL_PRODUCT.configurationCommitId,
      value: SECOND_FINAL_PRODUCT,
    },
  ];

const SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE: FinalProductDropdownOption[] =
  [
    {
      label: "secondTag",
      value: SECOND_FINAL_PRODUCT,
    },
  ];

const CUSTOM_FINAL_PRODUCT_OPTIONS: FinalProductDropdownOption[] = [
  {
    label: CUSTOM_FINAL_PRODUCT.configurationCommitId,
    value: CUSTOM_FINAL_PRODUCT,
  },
];

const CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_COMMIT_ID_MODE: FinalProductDropdownOption[] =
  [
    {
      label:
        CUSTOM_FINAL_PRODUCT.tag +
        "-" +
        CUSTOM_FINAL_PRODUCT.configurationCommitId,
      value: CUSTOM_FINAL_PRODUCT,
    },
  ];

const CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_MODE: FinalProductDropdownOption[] = [
  {
    label: "customTag",
    value: CUSTOM_FINAL_PRODUCT,
  },
];

const ACCUMULATED_FINAL_PRODUCT_DROPDOWN_OPTIONS: FinalProductDropdownOption[] =
  FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS.concat(
    SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS
  );

describe("FinalProductDropdownStateService", () => {
  let service: FinalProductDropdownStateService;
  let finalProductService: jest.Mocked<FinalProductService>;
  let scmService: jest.Mocked<ScmService>;

  beforeEach(waitForAsync(() => {
    finalProductService = {
      getFinalProducts: jest.fn(() => of(FIRST_FINAL_PRODUCT_PAGE)),
      getFinalProductById: jest.fn(() => of(CUSTOM_FINAL_PRODUCT)),
    } as unknown as jest.Mocked<FinalProductService>;

    scmService = {
      getBranchDetails: jest.fn(() =>
        of({ latestCommitId: "test-head-commit-id" })
      ),
    } as unknown as jest.Mocked<ScmService>;

    TestBed.configureTestingModule({
      providers: [
        FinalProductDropdownStateService,
        { provide: FinalProductService, useValue: finalProductService },
        { provide: ScmService, useValue: scmService },
      ],
    });

    service = TestBed.inject(FinalProductDropdownStateService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("signals and observables initialization", () => {
    it("should initialize branchCriteriaSubject to undefined", () => {
      service["branchCriteriaSubject"].subscribe((branch) =>
        expect(branch).toBeUndefined()
      );
    });

    it("should initialize repositoryIdSubject to undefined", () => {
      service["repositoryIdSubject"].subscribe((repositoryId) =>
        expect(repositoryId).toBeUndefined()
      );
    });

    it("should emit values from repositoryId$ observable", () => {
      let repositoryId: string | undefined = undefined;
      service["repositoryId$"].subscribe((receivedRepositoryId) => {
        repositoryId = receivedRepositoryId;
      });
      service.setRepositoryId("test-repo-id");

      expect(repositoryId).toEqual("test-repo-id");
    });

    it("should initialize dropdownLabelModeSubject to commit id", () => {
      service["dropdownLabelModeSubject"].subscribe((labelMode) =>
        expect(labelMode).toBe(FinalProductDropdownInputLabelMode.COMMIT_ID)
      );
    });

    it("should initialize pageIndex subject correctly", () => {
      service["pageIndexSubject"].subscribe((pageIndex) =>
        expect(pageIndex).toEqual(0)
      );
    });
    it("should initialize customFinalProductIdSubject to null", () => {
      service["customFinalProductIdSubject"].subscribe(
        (customFinalProductId) => {
          expect(customFinalProductId).toBeNull();
        }
      );
    });
    it("should emit values from customFinalProductId$ observable", () => {
      let customFinalProductId: string | null = null;
      service["customFinalProductId$"].subscribe(
        (receivedCustomFinalProductId) => {
          customFinalProductId = receivedCustomFinalProductId;
        }
      );
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);

      expect(customFinalProductId).toEqual(CUSTOM_FINAL_PRODUCT_ID);
    });

    it("should emit errors from customFinalProductFailure$ observable", () => {
      const testError = new Error("Failed to fetch custom final product");
      let emittedError: Error | undefined;
      service["customFinalProductFailure$"].subscribe((error) => {
        emittedError = error;
      });

      service["customFinalProductFailureSubject"].next(testError);

      expect(emittedError).toEqual(testError);
    });

    it.each([
      FinalProductDropdownInputLabelMode.TAG,
      FinalProductDropdownInputLabelMode.TAG_COMMIT_ID,
    ])("should emit values from dropdownLabelMode$ observable", (labelMode) => {
      let expectedLabelMode: FinalProductDropdownInputLabelMode | undefined =
        undefined;
      service["dropdownLabelMode$"].subscribe((receivedLabelMode) => {
        expectedLabelMode = receivedLabelMode;
      });
      setDropdownLabelMode(labelMode);

      expect(expectedLabelMode).toEqual(labelMode);
    });

    it("should initialize dropdownDefaultSelectionModeSubject to LATEST", () => {
      service["dropdownDefaultSelectionModeSubject"].subscribe(
        (dropdownDefaultSelectionMode) => {
          expect(dropdownDefaultSelectionMode).toEqual(
            DropdownDefaultSelectionMode.LATEST
          );
        }
      );
    });
    it("should emit values from dropdownDefaultSelectionMode$ observable", () => {
      let dropdownDefaultSelectionMode:
        | DropdownDefaultSelectionMode
        | undefined;
      service["dropdownDefaultSelectionMode$"].subscribe(
        (defaultSelectionMode) => {
          dropdownDefaultSelectionMode = defaultSelectionMode;
        }
      );
      setDropdownDefaultSelectionMode(DropdownDefaultSelectionMode.CUSTOM);

      expect(dropdownDefaultSelectionMode).toEqual(
        DropdownDefaultSelectionMode.CUSTOM
      );
    });
    it("should default dropdownDefaultSelectionModeSignal to LATEST", () => {
      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        DropdownDefaultSelectionMode.LATEST
      );
    });
    it("should compute dropdownDefaultSelectionModeSignal from dropdownDefaultSelectionMode$ observable", () => {
      setDropdownDefaultSelectionMode(DropdownDefaultSelectionMode.CUSTOM);

      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        DropdownDefaultSelectionMode.CUSTOM
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

    it("should compute newFinalProductsDropdownOptions from finalProducts when label mode is commit id", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS
      );

      finalProductService.getFinalProducts.mockReturnValue(
        of(SECOND_FINAL_PRODUCT_PAGE)
      );
      setPageIndexSubject(1);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS
      );
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        CUSTOM_FINAL_PRODUCT_OPTIONS.concat(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS
        )
      );
    }));

    it("should compute newFinalProductsDropdownOptions from finalProducts when label mode is tag commit id", fakeAsync(() => {
      initializeSubjects();
      setDropdownLabelMode(FinalProductDropdownInputLabelMode.TAG_COMMIT_ID);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE
      );

      finalProductService.getFinalProducts.mockReturnValue(
        of(SECOND_FINAL_PRODUCT_PAGE)
      );
      setPageIndexSubject(1);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE
      );
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_COMMIT_ID_MODE.concat(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE
        )
      );
    }));

    it("should compute newFinalProductsDropdownOptions from finalProducts when label mode is tag commit id and final products have no tag", fakeAsync(() => {
      const FIRST_FINAL_PRODUCT_WITHOUT_TAG = {
        ...FIRST_FINAL_PRODUCT,
        tag: undefined,
      } as unknown as FinalProduct;
      const FIRST_FINAL_PRODUCT_PAGE_WITHOUT_TAG: FinalProducts = {
        content: [FIRST_FINAL_PRODUCT_WITHOUT_TAG],
        number: 0,
        size: 1,
        last: false,
        totalElements: 2,
        totalPages: 2,
      };
      const FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE_WITHOUT_TAG: FinalProductDropdownOption[] =
        [
          {
            label: FIRST_FINAL_PRODUCT_WITHOUT_TAG.configurationCommitId,
            value: FIRST_FINAL_PRODUCT_WITHOUT_TAG,
          },
        ];
      const SECOND_FINAL_PRODUCT_WITHOUT_TAG = {
        ...SECOND_FINAL_PRODUCT,
        tag: undefined,
      } as unknown as FinalProduct;
      const SECOND_FINAL_PRODUCT_PAGE_WITHOUT_TAG: FinalProducts = {
        content: [SECOND_FINAL_PRODUCT_WITHOUT_TAG],
        number: 0,
        size: 1,
        last: false,
        totalElements: 2,
        totalPages: 2,
      };
      const SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE_WITHOUT_TAG: FinalProductDropdownOption[] =
        [
          {
            label: SECOND_FINAL_PRODUCT_WITHOUT_TAG.configurationCommitId,
            value: SECOND_FINAL_PRODUCT_WITHOUT_TAG,
          },
        ];
      const CUSTOM_FINAL_PRODUCT_WITHOUT_TAG = {
        id: "customFinalProductWithoutTagId",
        tag: undefined,
        configurationCommitId: "customConfigurationCommitId",
      } as unknown as FinalProductApiResponse;
      const CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_COMMIT_ID_MODE_WITHOUT_TAG: FinalProductDropdownOption[] =
        [
          {
            label: CUSTOM_FINAL_PRODUCT_WITHOUT_TAG.configurationCommitId,
            value: CUSTOM_FINAL_PRODUCT_WITHOUT_TAG,
          },
        ];
      finalProductService.getFinalProducts.mockReturnValue(
        of(FIRST_FINAL_PRODUCT_PAGE_WITHOUT_TAG)
      );
      initializeSubjects();
      setDropdownLabelMode(FinalProductDropdownInputLabelMode.TAG_COMMIT_ID);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE_WITHOUT_TAG
      );

      finalProductService.getFinalProducts.mockReturnValue(
        of(SECOND_FINAL_PRODUCT_PAGE_WITHOUT_TAG)
      );
      finalProductService.getFinalProductById.mockReturnValue(
        of(CUSTOM_FINAL_PRODUCT_WITHOUT_TAG)
      );
      setPageIndexSubject(1);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE_WITHOUT_TAG
      );
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_COMMIT_ID_MODE_WITHOUT_TAG.concat(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_COMMIT_ID_MODE_WITHOUT_TAG
        )
      );
    }));
    it("should compute newFinalProductsDropdownOptions from finalProducts when label mode is tag", fakeAsync(() => {
      initializeSubjects();
      setDropdownLabelMode(FinalProductDropdownInputLabelMode.TAG);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE
      );

      finalProductService.getFinalProducts.mockReturnValue(
        of(SECOND_FINAL_PRODUCT_PAGE)
      );
      setPageIndexSubject(1);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE
      );
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_MODE.concat(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE
        )
      );
    }));

    it("should compute newFinalProductsDropdownOptions from finalProducts when label mode is tag and final products have no tag", fakeAsync(() => {
      const FIRST_FINAL_PRODUCT_WITHOUT_TAG = {
        ...FIRST_FINAL_PRODUCT,
        tag: undefined,
      } as unknown as FinalProduct;
      const FIRST_FINAL_PRODUCT_PAGE_WITHOUT_TAG: FinalProducts = {
        content: [FIRST_FINAL_PRODUCT_WITHOUT_TAG],
        number: 0,
        size: 1,
        last: false,
        totalElements: 2,
        totalPages: 2,
      };
      const FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE_WITHOUT_TAG: FinalProductDropdownOption[] =
        [
          {
            label: "-",
            value: FIRST_FINAL_PRODUCT_WITHOUT_TAG,
          },
        ];
      const SECOND_FINAL_PRODUCT_WITHOUT_TAG = {
        ...SECOND_FINAL_PRODUCT,
        tag: undefined,
      } as unknown as FinalProduct;
      const SECOND_FINAL_PRODUCT_PAGE_WITHOUT_TAG: FinalProducts = {
        content: [SECOND_FINAL_PRODUCT_WITHOUT_TAG],
        number: 0,
        size: 1,
        last: false,
        totalElements: 2,
        totalPages: 2,
      };
      const SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE_WITHOUT_TAG: FinalProductDropdownOption[] =
        [
          {
            label: "-",
            value: SECOND_FINAL_PRODUCT_WITHOUT_TAG,
          },
        ];
      const CUSTOM_FINAL_PRODUCT_WITHOUT_TAG = {
        id: "customFinalProductWithoutTagId",
        tag: undefined,
        configurationCommitId: "customConfigurationCommitId",
      } as unknown as FinalProductApiResponse;
      const CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_MODE_WITHOUT_TAG: FinalProductDropdownOption[] =
        [
          {
            label: "-",
            value: CUSTOM_FINAL_PRODUCT_WITHOUT_TAG,
          },
        ];
      finalProductService.getFinalProducts.mockReturnValue(
        of(FIRST_FINAL_PRODUCT_PAGE_WITHOUT_TAG)
      );
      initializeSubjects();
      setDropdownLabelMode(FinalProductDropdownInputLabelMode.TAG);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE_WITHOUT_TAG
      );

      finalProductService.getFinalProducts.mockReturnValue(
        of(SECOND_FINAL_PRODUCT_PAGE_WITHOUT_TAG)
      );
      finalProductService.getFinalProductById.mockReturnValue(
        of(CUSTOM_FINAL_PRODUCT_WITHOUT_TAG)
      );
      setPageIndexSubject(1);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE_WITHOUT_TAG
      );
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      expect(service.newFinalProductDropdownOptions()).toEqual(
        CUSTOM_FINAL_PRODUCT_OPTIONS_TAG_MODE_WITHOUT_TAG.concat(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS_TAG_MODE_WITHOUT_TAG
        )
      );
    }));

    it("should add 'HEAD-' prefix to dropdown label when commit id matches head commit", fakeAsync(() => {
      const HEAD_COMMIT_ID = "test-head-commit-id";
      const finalProductWithHeadCommit = {
        ...FIRST_FINAL_PRODUCT,
        configurationCommitId: HEAD_COMMIT_ID,
      } as FinalProduct;
      const finalProductsPage: FinalProducts = {
        content: [finalProductWithHeadCommit],
        number: 0,
        size: 1,
        last: true,
        totalElements: 1,
        totalPages: 1,
      };

      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: HEAD_COMMIT_ID })
      );
      finalProductService.getFinalProducts.mockReturnValue(
        of(finalProductsPage)
      );

      initializeSubjects();
      service.setRepositoryId("test-repo-id");
      service.setBranchCriteria(BRANCH);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);

      expect(service.newFinalProductDropdownOptions()).toEqual([
        {
          label: "HEAD-" + HEAD_COMMIT_ID,
          value: finalProductWithHeadCommit,
        },
      ]);
    }));

    it("should not add 'HEAD-' prefix when commit id does not match head commit", fakeAsync(() => {
      const HEAD_COMMIT_ID = "test-head-commit-id";
      const DIFFERENT_COMMIT_ID = "different-commit-id";
      const finalProductWithDifferentCommit = {
        ...FIRST_FINAL_PRODUCT,
        configurationCommitId: DIFFERENT_COMMIT_ID,
      } as FinalProduct;
      const finalProductsPage: FinalProducts = {
        content: [finalProductWithDifferentCommit],
        number: 0,
        size: 1,
        last: true,
        totalElements: 1,
        totalPages: 1,
      };

      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: HEAD_COMMIT_ID })
      );
      finalProductService.getFinalProducts.mockReturnValue(
        of(finalProductsPage)
      );

      initializeSubjects();
      service.setRepositoryId("test-repo-id");
      service.setBranchCriteria(BRANCH);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);

      expect(service.newFinalProductDropdownOptions()).toEqual([
        {
          label: DIFFERENT_COMMIT_ID,
          value: finalProductWithDifferentCommit,
        },
      ]);
    }));

    it("should add 'HEAD-' prefix in TAG_COMMIT_ID mode when commit matches head commit and has tag", fakeAsync(() => {
      const HEAD_COMMIT_ID = "test-head-commit-id";
      const finalProductWithHeadCommit = {
        ...FIRST_FINAL_PRODUCT,
        configurationCommitId: HEAD_COMMIT_ID,
        tag: "v1.0.0",
      } as FinalProduct;
      const finalProductsPage: FinalProducts = {
        content: [finalProductWithHeadCommit],
        number: 0,
        size: 1,
        last: true,
        totalElements: 1,
        totalPages: 1,
      };

      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: HEAD_COMMIT_ID })
      );
      finalProductService.getFinalProducts.mockReturnValue(
        of(finalProductsPage)
      );

      initializeSubjects();
      setDropdownLabelMode(FinalProductDropdownInputLabelMode.TAG_COMMIT_ID);
      service.setRepositoryId("test-repo-id");
      service.setBranchCriteria(BRANCH);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);

      expect(service.newFinalProductDropdownOptions()).toEqual([
        {
          label: "v1.0.0-HEAD-" + HEAD_COMMIT_ID,
          value: finalProductWithHeadCommit,
        },
      ]);
    }));

    it("should add 'HEAD-' prefix in TAG_COMMIT_ID mode when commit matches head commit and has no tag", fakeAsync(() => {
      const HEAD_COMMIT_ID = "test-head-commit-id";
      const finalProductWithHeadCommit = {
        ...FIRST_FINAL_PRODUCT,
        configurationCommitId: HEAD_COMMIT_ID,
        tag: undefined,
      } as FinalProduct;
      const finalProductsPage: FinalProducts = {
        content: [finalProductWithHeadCommit],
        number: 0,
        size: 1,
        last: true,
        totalElements: 1,
        totalPages: 1,
      };

      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: HEAD_COMMIT_ID })
      );
      finalProductService.getFinalProducts.mockReturnValue(
        of(finalProductsPage)
      );

      initializeSubjects();
      setDropdownLabelMode(FinalProductDropdownInputLabelMode.TAG_COMMIT_ID);
      service.setRepositoryId("test-repo-id");
      service.setBranchCriteria(BRANCH);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);

      expect(service.newFinalProductDropdownOptions()).toEqual([
        {
          label: "HEAD-" + HEAD_COMMIT_ID,
          value: finalProductWithHeadCommit,
        },
      ]);
    }));

    it("should not add 'HEAD-' prefix in TAG mode even when commit matches head commit", fakeAsync(() => {
      const HEAD_COMMIT_ID = "test-head-commit-id";
      const finalProductWithHeadCommit = {
        ...FIRST_FINAL_PRODUCT,
        configurationCommitId: HEAD_COMMIT_ID,
        tag: "v1.0.0",
      } as FinalProduct;
      const finalProductsPage: FinalProducts = {
        content: [finalProductWithHeadCommit],
        number: 0,
        size: 1,
        last: true,
        totalElements: 1,
        totalPages: 1,
      };

      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: HEAD_COMMIT_ID })
      );
      finalProductService.getFinalProducts.mockReturnValue(
        of(finalProductsPage)
      );

      initializeSubjects();
      setDropdownLabelMode(FinalProductDropdownInputLabelMode.TAG);
      service.setRepositoryId("test-repo-id");
      service.setBranchCriteria(BRANCH);
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);

      expect(service.newFinalProductDropdownOptions()).toEqual([
        {
          label: "v1.0.0",
          value: finalProductWithHeadCommit,
        },
      ]);
    }));

    it("should not add 'HEAD-' prefix when head commit id is undefined", fakeAsync(() => {
      const finalProductsPage: FinalProducts = {
        content: [FIRST_FINAL_PRODUCT],
        number: 0,
        size: 1,
        last: true,
        totalElements: 1,
        totalPages: 1,
      };

      finalProductService.getFinalProducts.mockReturnValue(
        of(finalProductsPage)
      );

      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);

      expect(service.newFinalProductDropdownOptions()).toEqual([
        {
          label: FIRST_FINAL_PRODUCT.configurationCommitId,
          value: FIRST_FINAL_PRODUCT,
        },
      ]);
    }));

    it("should compute isLastPage from the finalProductsPage signal", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.isLastPage()).toBeFalsy();

      finalProductService.getFinalProducts.mockReturnValue(
        of(SECOND_FINAL_PRODUCT_PAGE)
      );
      setPageIndexSubject(1);
      expect(service.isLastPage()).toBeTruthy();
    }));

    it("should initialize searchKey criteria subject to undefined", () => {
      service["searchKeySubject"].subscribe((searchKey: string | undefined) =>
        expect(searchKey).toBeUndefined()
      );
    });

    it("should emit distinct values from searchKey criteria", fakeAsync(() => {
      const emittedValues: string[] = [];
      service["searchKeyCriteria$"].subscribe((value: string | undefined) => {
        if (value) emittedValues.push(value);
      });

      setSearchKeySubject("0");
      tick(DEBOUNCE_TIME);
      setSearchKeySubject("1");
      tick(DEBOUNCE_TIME);
      setSearchKeySubject("1");
      tick(DEBOUNCE_TIME);
      setSearchKeySubject("2");
      tick(DEBOUNCE_TIME);

      expect(emittedValues).toEqual(["0", "1", "2"]);
    }));

    it("should initialize errorMessage signal to undefined", () => {
      expect(service.errorMessage()).toBeUndefined();
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
  });

  describe("headCommitID$ combineLatest", () => {
    it("should fetch head commit id when projectId, repositoryId, and branch are provided", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      service.setRepositoryId("test-repo-id");
      service.setBranchCriteria("test-branch");
      tick();

      expect(scmService.getBranchDetails).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        repoId: "test-repo-id",
        branchName: "test-branch",
      });
      expect(service.headCommitId()).toEqual("test-head-commit-id");
    }));

    it("should not fetch head commit id when repositoryId is undefined", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      service.setBranchCriteria("test-branch");
      tick();

      expect(scmService.getBranchDetails).not.toHaveBeenCalled();
      expect(service.headCommitId()).toBeUndefined();
    }));

    it("should not fetch head commit id when branch is undefined", fakeAsync(() => {
      setProjectIdSubject(PROJECT_ID);
      service.setRepositoryId("test-repo-id");
      tick();

      expect(scmService.getBranchDetails).not.toHaveBeenCalled();
      expect(service.headCommitId()).toBeUndefined();
    }));

    it("should update head commit id when repositoryId changes", fakeAsync(() => {
      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: "first-commit-id" })
      );
      setProjectIdSubject(PROJECT_ID);
      service.setRepositoryId("first-repo-id");
      service.setBranchCriteria("test-branch");
      tick();

      expect(service.headCommitId()).toEqual("first-commit-id");

      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: "second-commit-id" })
      );
      service.setRepositoryId("second-repo-id");
      tick();

      expect(service.headCommitId()).toEqual("second-commit-id");
    }));

    it("should update head commit id when branch changes", fakeAsync(() => {
      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: "first-branch-commit" })
      );
      setProjectIdSubject(PROJECT_ID);
      service.setRepositoryId("test-repo-id");
      service.setBranchCriteria("first-branch");
      tick();

      expect(service.headCommitId()).toEqual("first-branch-commit");

      scmService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: "second-branch-commit" })
      );
      service.setBranchCriteria("second-branch");
      tick();

      expect(service.headCommitId()).toEqual("second-branch-commit");
    }));
  });

  describe("setters", () => {
    it("should set project id", () => {
      const nextSpy = jest.spyOn(service["projectIdSubject"], "next");
      service.setProjectId("newProjectId");
      expect(nextSpy).toHaveBeenCalledWith("newProjectId");
    });

    it("should set branch criteria", () => {
      const nextSpy = jest.spyOn(service["branchCriteriaSubject"], "next");
      service.setBranchCriteria("newBranch");
      expect(nextSpy).toHaveBeenCalledWith("newBranch");
    });

    it("should set repository id", () => {
      const nextSpy = jest.spyOn(service["repositoryIdSubject"], "next");
      service.setRepositoryId("newRepositoryId");
      expect(nextSpy).toHaveBeenCalledWith("newRepositoryId");
    });

    it("should set validation level", () => {
      const nextSpy = jest.spyOn(service["validationLevelSubject"], "next");
      service.setValidationLevel(["MQG"]);
      expect(nextSpy).toHaveBeenCalledWith(["MQG"]);
    });

    it.each([
      FinalProductDropdownInputLabelMode.TAG,
      FinalProductDropdownInputLabelMode.COMMIT_ID,
      FinalProductDropdownInputLabelMode.TAG_COMMIT_ID,
    ])("should set dropdown label mode", (labelMode) => {
      const nextSpy = jest.spyOn(service["dropdownLabelModeSubject"], "next");
      service.setDropdownLabelMode(labelMode);
      expect(nextSpy).toHaveBeenCalledWith(labelMode);
    });
    it("should set page index", () => {
      const nextSpy = jest.spyOn(service["pageIndexSubject"], "next");
      service.setPageIndex(2);
      expect(nextSpy).toHaveBeenCalledWith(2);
    });
    it("should set customFinalProductId", () => {
      const nextSpy = jest.spyOn(
        service["customFinalProductIdSubject"],
        "next"
      );
      service.setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);

      expect(nextSpy).toHaveBeenCalledWith(CUSTOM_FINAL_PRODUCT_ID);
    });
    it("should set dropdownDefaultSelectionMode", () => {
      const nextSpy = jest.spyOn(
        service["dropdownDefaultSelectionModeSubject"],
        "next"
      );
      service.setDropdownDefaultSelectionMode(
        DropdownDefaultSelectionMode.CUSTOM
      );

      expect(nextSpy).toHaveBeenCalledWith(DropdownDefaultSelectionMode.CUSTOM);
    });
    it.each([undefined, FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS[0]])(
      "should set selected option",
      (selectedOption) => {
        const nextSpy = jest.spyOn(service["selectedOptionSubject"], "next");
        service.setSelectedOption(selectedOption);
        expect(nextSpy).toHaveBeenCalledWith(selectedOption);
      }
    );

    it.each([undefined, COMMIT_ID])(
      "should set searchKey criteria",
      (searchKey) => {
        const nextSpy = jest.spyOn(service["searchKeySubject"], "next");
        service.setSearchKey(searchKey);
        expect(nextSpy).toHaveBeenCalledWith(searchKey);
      }
    );

    it("should set lastFetchedElement", () => {
      const nextSpy = jest.spyOn(service["lastFetchedElementSubject"], "next");
      service.setLastFetchedElement(2);
      expect(nextSpy).toHaveBeenCalledWith(2);
    });
  });

  describe("function Object() { [native code] }", () => {
    it("should default fetch parent subject to false when not set", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        { ...FILTERS, fetchParent: false },
        PROJECT_ID
      );
    }));
    it("should not fetch custom final product when not initialized", fakeAsync(() => {
      initializeSubjects();
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProductById).not.toHaveBeenCalled();
    }));
    it("should fetch the final products page with the correct filters", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      setFetchParentSubject(FETCH_PARENT);
      tick(DEBOUNCE_TIME);
      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        FILTERS,
        PROJECT_ID
      );
    }));
    it("should fetch custom final product when customFinalProductId is specified", () => {
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);

      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
    });
    it("should fetch custom final product once again when projectIdSubject changes", fakeAsync(() => {
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setProjectIdSubject("projectId");
      tick();

      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        "projectId"
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledTimes(2);
    }));
    it("should fetch custom final product once again when customFinalProductIdSubject changes", fakeAsync(() => {
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setCustomFinalProductId("custom");
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        "custom",
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledTimes(2);
    }));
    it("should fetch the final products with correct validation level", fakeAsync(() => {
      initializeSubjects();
      setValidationLevel(["MQG"]);
      tick();

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
          validationLevelFilter: ["MQG"],
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProducts).toHaveBeenCalledTimes(2);
    }));

    it("should not include searchKey in the filters if undefined", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(undefined);
      tick(DEBOUNCE_TIME);
      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
        },
        PROJECT_ID
      );
    }));

    it("should fetch final products page again when projectIdSubject changes", fakeAsync(() => {
      initializeSubjects();
      setProjectIdSubject("newProjectId");
      tick();

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
        },
        "newProjectId"
      );
      expect(finalProductService.getFinalProducts).toHaveBeenCalledTimes(2);
    }));

    it("should fetch final products page again when branchCriteriaSubject changes", fakeAsync(() => {
      initializeSubjects();
      setBranchCriteriaSubject("newBranch");
      tick();

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          branchFilter: "newBranch",
          searchKey: undefined,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProducts).toHaveBeenCalledTimes(2);
    }));

    it("should fetch final products page again when pageIndexSubject changes", fakeAsync(() => {
      initializeSubjects();
      setPageIndexSubject(2);
      tick();

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
          page: 2,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProducts).toHaveBeenCalledTimes(2);
    }));
    it("should fetch final products page again when fetchParent changes", fakeAsync(() => {
      initializeSubjects();
      setFetchParentSubject(FETCH_PARENT);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          searchKey: undefined,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProducts).toHaveBeenCalledTimes(2);
    }));
    it("should emit the final products page value into a signal", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.finalProductsPage()).toEqual(FIRST_FINAL_PRODUCT_PAGE);
    }));
    it("should default the final products list to an empty array", () => {
      expect(service.finalProducts()).toEqual([]);
    });
    it("should aggregate finalProductsPage and customFinalProduct into the finalProducts signal", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect(service.finalProducts()).toEqual([
        CUSTOM_FINAL_PRODUCT,
        FIRST_FINAL_PRODUCT,
      ]);
    }));
    it("should propagate error through customFinalProductFailureSubject when fetching custom final product fails", fakeAsync(() => {
      const FAILURE_MESSAGE = "FAILURE_MESSAGE";
      let receivedFailure: Error | undefined = undefined;
      initializeSubjects();
      service["customFinalProductFailure$"].subscribe(
        (error) => (receivedFailure = error)
      );
      finalProductService.getFinalProductById.mockReturnValueOnce(
        throwError(() => new Error(FAILURE_MESSAGE))
      );
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect((receivedFailure as unknown as Error).message).toBe(
        FAILURE_MESSAGE
      );
    }));
    it("should load the finalProducts list with null customFinalProduct when it is not provided", fakeAsync(() => {
      initializeSubjects();
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
        },
        PROJECT_ID
      );
      expect(service.finalProducts()).toEqual([FIRST_FINAL_PRODUCT]);
      expect(finalProductService.getFinalProductById).not.toHaveBeenCalled();
    }));
    it("should load finalProducts list with undefined configurationCommitIdCriteria$ when it has not been initialized", fakeAsync(() => {
      initializeSubjects();
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
        },
        PROJECT_ID
      );
      expect(service.finalProducts()).toEqual([FIRST_FINAL_PRODUCT]);
    }));
    it("should remove duplicated items from the finalProducts list when customFinalProduct matches an existing final product", fakeAsync(() => {
      const finalProductsPage: FinalProducts = {
        content: [FIRST_FINAL_PRODUCT],
        number: 1,
        size: 2,
        last: true,
        totalElements: 2,
        totalPages: 2,
      };
      const FINAL_PRODUCT_API_RESPONSE: FinalProductApiResponse = {
        id: FIRST_FINAL_PRODUCT.id,
      } as unknown as FinalProductApiResponse;
      finalProductService.getFinalProductById.mockReturnValueOnce(
        of(FINAL_PRODUCT_API_RESPONSE)
      );
      finalProductService.getFinalProducts.mockReturnValueOnce(
        of(finalProductsPage)
      );
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect(service.finalProductDropdownOptions()).toEqual([
        {
          label: FIRST_FINAL_PRODUCT.configurationCommitId,
          value: FIRST_FINAL_PRODUCT,
        },
      ]);
    }));
    it("should set the custom final product to the beginning of the finalProducts list when dropdownSelectionMode is set to CUSTOM", fakeAsync(() => {
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setDropdownDefaultSelectionMode(DropdownDefaultSelectionMode.CUSTOM);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
        },
        PROJECT_ID
      );
      expect(service.finalProducts()).toEqual([
        CUSTOM_FINAL_PRODUCT,
        FIRST_FINAL_PRODUCT,
      ]);
    }));
    it("should sort final products by creation date when dropdownSelectionMode is set to LATEST", fakeAsync(() => {
      const newestFinalProduct = {
        createdOn: "2025-1-1",
      } as FinalProduct;
      const oldestFinalProduct = {
        createdOn: "2024-1-1",
      } as FinalProduct;
      const finalProductsPage: FinalProducts = {
        content: [oldestFinalProduct, newestFinalProduct],
        number: 1,
        size: 2,
        last: true,
        totalElements: 2,
        totalPages: 2,
      };
      finalProductService.getFinalProducts.mockReturnValueOnce(
        of(finalProductsPage)
      );
      initializeSubjects();
      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: undefined,
        },
        PROJECT_ID
      );
      expect(service.finalProducts()).toEqual([
        newestFinalProduct,
        oldestFinalProduct,
      ]);
    }));
    it("should include custom final product when its configurationCommitId matches the configurationCommitIdCriteria", fakeAsync(() => {
      const searchKey = "custom";
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: searchKey,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect(service.finalProducts()).toContain(CUSTOM_FINAL_PRODUCT);
    }));
    it("should include custom final product when its configurationCommitId matches the configurationCommitIdCriteria with a different case", fakeAsync(() => {
      const searchKey = "CUSTOM";
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: searchKey,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect(service.finalProducts()).toContain(CUSTOM_FINAL_PRODUCT);
    }));
    it("should not include custom final product when its configurationCommitId does not match the configurationCommitIdCriteria", fakeAsync(() => {
      const searchKey = "randomSearchKey";
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: searchKey,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect(service.finalProducts()).not.toContain(CUSTOM_FINAL_PRODUCT);
    }));
    it("should include custom final product when its tag includes the searchkey", fakeAsync(() => {
      const searchKey = "tag";
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: searchKey,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect(service.finalProducts()).toContain(CUSTOM_FINAL_PRODUCT);
    }));
    it("should include custom final product when its tag includes the searchkey with different case", fakeAsync(() => {
      const searchKey = "TAG";
      initializeSubjects();
      setCustomFinalProductId(CUSTOM_FINAL_PRODUCT_ID);
      setSearchKeySubject(searchKey);
      tick(DEBOUNCE_TIME);

      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        {
          ...FILTERS,
          fetchParent: false,
          searchKey: searchKey,
        },
        PROJECT_ID
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        CUSTOM_FINAL_PRODUCT_ID,
        PROJECT_ID
      );
      expect(service.finalProducts()).toContain(CUSTOM_FINAL_PRODUCT);
    }));
    it("should emit the dropdownDefaultSelectionMode into a signal", fakeAsync(() => {
      setDropdownDefaultSelectionMode(DropdownDefaultSelectionMode.CUSTOM);

      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        DropdownDefaultSelectionMode.CUSTOM
      );
    }));
    it("should set the dropdownDefaultSelectionMode default value to LATEST", fakeAsync(() => {
      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        DropdownDefaultSelectionMode.LATEST
      );
    }));
    it("should set empty page as initial value for final products page signal", () => {
      finalProductService.getFinalProducts.mockReturnValue(EMPTY);
      expect(service.finalProductsPage()).toEqual(EMPTY_PAGE);
    });

    it("should return empty page on failure to fetch final products", () => {
      finalProductService.getFinalProducts.mockReturnValueOnce(
        throwError(() => "failed")
      );
      initializeSubjects();
      service["finalProductsPage$"].subscribe((page) => {
        expect(page).toBeUndefined();
      });
      expect(service.finalProductDropdownOptions()).toEqual([]);
    });

    it("should set error message signal on failure to fetch final products", () => {
      finalProductService.getFinalProducts.mockReturnValueOnce(
        throwError(() => "failed")
      );
      initializeSubjects();
      expect(service.errorMessage()).toEqual("failed");
    });

    it("should set isLoading to true when fetching final products", () => {
      const isLoadingSpy = jest.spyOn(service.isLoadingData, "set");
      initializeSubjects();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    });

    it("should set isLoading to false on successfully fetching final products", () => {
      initializeSubjects();
      expect(finalProductService.getFinalProducts).toHaveBeenCalledTimes(1);
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should set isLoading to false on failure to fetch the final products", () => {
      finalProductService.getFinalProducts.mockReturnValueOnce(
        throwError(() => "failed")
      );
      initializeSubjects();
      expect(finalProductService.getFinalProducts).toHaveBeenCalledTimes(1);
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should initialize value for page index signal to zero", () => {
      expect(service.pageIndex()).toEqual(0);
    });

    it("should set value for page index signal to the values emitted by ", fakeAsync(() => {
      setPageIndexSubject(3);
      tick();
      expect(service.pageIndex()).toEqual(3);
    }));

    it("should emit selectedOption values into the signal", () => {
      service["selectedOptionSubject"].next(
        FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS[0]
      );
      expect(service.selectedOption()).toEqual(
        FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS[0]
      );
    });

    it("should emit searchKey criteria values into the signal", fakeAsync(() => {
      setSearchKeySubject(COMMIT_ID);
      tick(DEBOUNCE_TIME);
      expect(service.searchKey()).toEqual(COMMIT_ID);
    }));

    describe("populating the final product dropdown options", () => {
      it("should initialize final product options to empty array", () => {
        expect(service.finalProductDropdownOptions()).toEqual([]);
      });

      it("should concatenate new options to existing options", fakeAsync(() => {
        initializeSubjects();
        setSearchKeySubject(COMMIT_ID);
        tick(DEBOUNCE_TIME);
        expect(service.newFinalProductDropdownOptions()).toEqual(
          FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );
        expect(service.finalProductDropdownOptions()).toEqual(
          FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );

        finalProductService.getFinalProducts.mockReturnValue(
          of(SECOND_FINAL_PRODUCT_PAGE)
        );
        setPageIndexSubject(1);
        tick();

        expect(service.newFinalProductDropdownOptions()).toEqual(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );
        expect(service.finalProductDropdownOptions()).toEqual(
          ACCUMULATED_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );
      }));

      it("should replace the existing final product options with the new options when pageIndex is 0", fakeAsync(() => {
        initializeSubjects();
        setSearchKeySubject(COMMIT_ID);
        tick(DEBOUNCE_TIME);
        expect(service.newFinalProductDropdownOptions()).toEqual(
          FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );
        expect(service.finalProductDropdownOptions()).toEqual(
          FIRST_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );

        finalProductService.getFinalProducts.mockReturnValue(
          of(SECOND_FINAL_PRODUCT_PAGE)
        );
        setPageIndexSubject(1);
        setPageIndexSubject(0);
        tick();

        expect(service.newFinalProductDropdownOptions()).toEqual(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );
        expect(service.finalProductDropdownOptions()).toEqual(
          SECOND_FINAL_PRODUCT_DROPDOWN_OPTIONS
        );
      }));
    });

    describe("set dropdown height correctly", () => {
      it.each([
        [0, "40px"],
        [2, "80px"],
        [5, "200px"],
        [10, "200px"],
      ])(
        "should set dropdown height correctly",
        fakeAsync((nbOfFiP: number, expectedHeight: string) => {
          initializeSubjects();
          setSearchKeySubject(COMMIT_ID);
          tick(DEBOUNCE_TIME);

          finalProductService.getFinalProducts.mockReturnValue(
            of({
              content: Array.from(
                { length: nbOfFiP },
                (_, index) =>
                  ({ id: index.toString() } as unknown as FinalProduct)
              ),
              number: 0,
              size: 1,
              last: false,
              totalElements: 2,
              totalPages: 1,
            })
          );
          setPageIndexSubject(1);
          setPageIndexSubject(0);
          tick();
          expect(service.dropdownHeight()).toBe(expectedHeight);
        })
      );
    });
  });

  function initializeSubjects() {
    setBranchCriteriaSubject(BRANCH);
    setProjectIdSubject(PROJECT_ID);
  }

  function setFetchParentSubject(fetchParent: boolean) {
    service["fetchParentSubject"].next(fetchParent);
  }

  function setPageIndexSubject(index: number) {
    service["pageIndexSubject"].next(index);
  }

  function setLastFetchedElementSubject(last: number) {
    service["lastFetchedElementSubject"].next(last);
  }

  function setProjectIdSubject(projectId: string) {
    service["projectIdSubject"].next(projectId);
  }

  function setBranchCriteriaSubject(branch: string) {
    service["branchCriteriaSubject"].next(branch);
  }

  function setSearchKeySubject(searchKey: string | undefined) {
    service["searchKeySubject"].next(searchKey);
  }

  function setValidationLevel(validationLevel: string[]) {
    service["validationLevelSubject"].next(validationLevel);
  }

  function setCustomFinalProductId(customFinalProductId: string) {
    service["customFinalProductIdSubject"].next(customFinalProductId);
  }

  function setDropdownLabelMode(
    finalProductDropdownLabelMode: FinalProductDropdownInputLabelMode
  ) {
    service["dropdownLabelModeSubject"].next(finalProductDropdownLabelMode);
  }

  function setDropdownDefaultSelectionMode(
    dropdownDefaultSelectionMode: DropdownDefaultSelectionMode
  ) {
    service["dropdownDefaultSelectionModeSubject"].next(
      dropdownDefaultSelectionMode
    );
  }
});
