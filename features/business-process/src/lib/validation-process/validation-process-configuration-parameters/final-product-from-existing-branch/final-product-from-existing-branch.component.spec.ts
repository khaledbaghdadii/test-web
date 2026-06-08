import {
  FinalProductFromExistingBranchComponent,
  MQGFromExistingBranchWarnings,
} from "./final-product-from-existing-branch.component";
import { FormControl } from "@angular/forms";
import { FinalProduct, RtpProduct } from "@mxflow/features/artifact-manager";
import {
  FinalProductResponse,
  LatestFinalProductFailureReason,
  LatestFinalProductServiceFetcher,
} from "./final-product-input/latest-final-product-service-fetcher.service";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import {
  concatMap,
  firstValueFrom,
  interval,
  merge,
  Observable,
  of,
  Subject,
} from "rxjs";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { InputAccessMode } from "../../../definition-input/input-access-mode";
import { DisplayMode } from "../../../definition-input/display-mode";
import {
  BusinessProcessFinalProductInput,
  BusinessProcessFinalProductSelectorComponent,
} from "@mxflow/ui/inputs";
import { DefinitionInputComponent } from "../../../definition-input/definition-input.component";
import { BranchInputComponent } from "@mxflow/features/scm";
import { By } from "@angular/platform-browser";
import { ToastMessageService } from "@mxflow/ui/alert";

const FINAL_PRODUCT = {
  optionalFinalProduct: {
    id: "finalProductId",
    configurationCommitId: "configCommitId",
    rtpProduct: {
      rtpCommitId: "rtpCommitId",
    } as unknown as RtpProduct,
  } as FinalProduct,
} as FinalProductResponse;

const FINAL_PRODUCT_WITHOUT_RTP_PRODUCT = {
  optionalFinalProduct: {
    id: "finalProductId",
    configurationCommitId: "configCommitId",
  } as FinalProduct,
} as FinalProductResponse;

const PROJECT_ID = "projectId";
const REPOSITORY_ID = "repositoryId";

describe("Final product from existing branch", () => {
  let component: FinalProductFromExistingBranchComponent;
  let fixture: ComponentFixture<FinalProductFromExistingBranchComponent>;
  let latestFinalProductFetcher: LatestFinalProductServiceFetcher;
  let toastService: Partial<ToastMessageService>;

  beforeEach(async () => {
    latestFinalProductFetcher = {
      getLatestFinalProductOnBranch: jest.fn(() =>
        Promise.resolve(FINAL_PRODUCT)
      ),
    } as unknown as LatestFinalProductServiceFetcher;

    toastService = {
      showError: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FinalProductFromExistingBranchComponent],
      providers: [
        { provide: ToastMessageService, useValue: toastService },
        {
          provide: LatestFinalProductServiceFetcher,
          useValue: latestFinalProductFetcher,
        },
      ],
    })
      .overrideComponent(FinalProductFromExistingBranchComponent, {
        remove: {
          imports: [
            DefinitionInputComponent,
            BranchInputComponent,
            BusinessProcessFinalProductSelectorComponent,
          ],
        },
        add: {
          imports: [
            MockDefinitionInputComponent,
            MockBranchInputComponent,
            MockBusinessProcessFinalProductSelectorComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FinalProductFromExistingBranchComponent);
    component = fixture.componentInstance;

    component.projectId = PROJECT_ID;
    component.repositoryId = REPOSITORY_ID;
    component.archivalBranchNameFormControl = new FormControl();
    component.archivalBranchNameFormControl.disable();
    component.finalProductIdFromControl = new FormControl();
    component.finalProductIdFromControl.disable();
    component.configCommitIdFromControl = new FormControl();
    component.configCommitIdFromControl.disable();
    component.rtpCommitIdFromControl = new FormControl();
    component.rtpCommitIdFromControl.disable();
    component.repositoryIdFormControl = new FormControl();
  });

  it("When component is initialized it should enable archival branch name selection", () => {
    component.ngOnInit();

    expect(component.archivalBranchNameFormControl.enabled).toBe(true);
  });

  describe("Archival branch input validation", () => {
    it("the archival branch input should be initialized with correct project id, repository id, form control, and initial value", () => {
      component.projectId = "projectId";
      component.repositoryIdFormControl.setValue("repositoryId");
      component.archivalBranchNameFormControl.setValue("archivalBranch");

      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.query(
        By.css("mxevolve-branch-input")
      ).componentInstance as MockBranchInputComponent;

      expect(archivalBranchInputComponent.projectId).toBe("projectId");
      expect(archivalBranchInputComponent.repoId).toBe("repositoryId");
      expect(archivalBranchInputComponent.branchNameFormControl).toBe(
        component.archivalBranchNameFormControl
      );
      expect(archivalBranchInputComponent.initialValue).toBe("archivalBranch");
    });

    it("the archival branch input should validate that the provided branch does exists", () => {
      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.query(
        By.css("mxevolve-branch-input")
      ).componentInstance as MockBranchInputComponent;

      expect(archivalBranchInputComponent.branchShouldExist).toBe(true);
    });

    it("given the archival branch initial value is invalid, then show a toast message with an error", () => {
      fixture.detectChanges();

      const archivalBranchInputComponent = fixture.debugElement.query(
        By.css("mxevolve-branch-input")
      ).componentInstance as MockBranchInputComponent;

      archivalBranchInputComponent.initialInvalid.emit();

      expect(toastService.showError).toHaveBeenCalledWith(
        "The branch name available in the BP definition doesn't exist in the repository. Please check the name and try again with an existing branch."
      );
    });
  });

  describe("When archival branch name is preselected", () => {
    beforeEach(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
    });

    it("should enable final product id selection", fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeTruthy();
    }));

    it("should fetch the latest final product with correct project id", fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(
        latestFinalProductFetcher.getLatestFinalProductOnBranch
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: PROJECT_ID,
        })
      );
    }));

    it("should fetch the latest final product with correct repository id", fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(
        latestFinalProductFetcher.getLatestFinalProductOnBranch
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          repositoryId: REPOSITORY_ID,
        })
      );
    }));

    it("should fetch the latest final product with correct branch name filter", fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(
        latestFinalProductFetcher.getLatestFinalProductOnBranch
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          branchName: "archivalBranchName",
        })
      );
    }));

    it("should set the final product id from the latest final product on the selected archival branch name", fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.id
      );
    }));

    it("should set the configuration commit id from the latest final product on the selected archival branch name", fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.configCommitIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.configurationCommitId
      );
    }));

    it("should set the rtp commit id from the latest final product on the selected archival branch name", fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.rtpProduct?.rtpCommitId
      );
    }));

    it("should emit that no warning exists", fakeAsync(() => {
      component.ngOnInit();
      let currentWarning: MQGFromExistingBranchWarnings =
        MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND;
      component.warning$.subscribe((warning) => (currentWarning = warning));
      tick();

      expect(currentWarning).toEqual(MQGFromExistingBranchWarnings.NO_WARNING);
    }));

    it("Given no rtp product exists it should set the rtp commit id from the config commit id from the latest final product on the selected archival branch name", fakeAsync(() => {
      setupLatestFinalProductWithoutRtpProduct();
      initializeComponent();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.configurationCommitId
      );
    }));

    it("Given no final product is found it should emit a warning that no final product is found on the archival branch", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => (currentWarning = warning));
      tick();

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND
      );
    }));

    it("Given no final product is found it should disable final product id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("Given no final product is found it should clear final product id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("Given no final product is found it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given no final product is found it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given archival branch name is not valid it should emit a warning that the archival branch name is not valid", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => {
        currentWarning = warning;
      });
      tick();

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.INVALID_BRANCH_NAME
      );
    }));

    it("Given archival branch name is not valid it should disable final product id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("Given archival branch name is not valid it should clear final product id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("Given archival branch name is not valid it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given archival branch name is not valid it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given an unexpected error occurred it should emit a warning that the archival branch name is not valid", fakeAsync(() => {
      latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
        Promise.resolve({
          failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
        })
      );

      initializeComponent();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => {
        currentWarning = warning;
      });
      tick();

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.UNEXPECTED_FAILURE
      );
    }));

    it("Given an unexpected error occurred it should disable final product id selection", fakeAsync(() => {
      latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
        Promise.resolve({
          failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
        })
      );

      initializeComponent();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("Given an unexpected error occurred it should clear final product id selection", fakeAsync(() => {
      latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
        Promise.resolve({
          failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
        })
      );

      initializeComponent();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("Given an unexpected error occurred it should clear rtp commit id selection", fakeAsync(() => {
      latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
        Promise.resolve({
          failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
        })
      );

      initializeComponent();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given an unexpected error occurred it should clear configuration commit id selection", fakeAsync(() => {
      latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
        Promise.resolve({
          failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
        })
      );

      initializeComponent();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.ngOnInit();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));
  });

  describe("Given final product is preselected", () => {
    it("And given no final product is found it should emit a warning that no final product is found on the archival branch", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => (currentWarning = warning));
      tick();

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND
      );
    }));

    it("And given no final product is found it should disable final product id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("And given no final product is found it should clear final product id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("And given no final product is found it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("And given no final product is found it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      setComponentFormControlValues();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given archival branch name is not valid it should emit a warning that the archival branch name is not valid", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => {
        currentWarning = warning;
      });
      tick();

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.INVALID_BRANCH_NAME
      );
    }));

    it("Given archival branch name is not valid it should disable final product id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("Given archival branch name is not valid it should clear final product id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("Given archival branch name is not valid it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given archival branch name is not valid it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given an unexpected error occurs it should emit a warning that the archival branch name is not valid", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      setComponentFormControlValues();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => {
        currentWarning = warning;
      });
      tick();

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.UNEXPECTED_FAILURE
      );
    }));

    it("Given an unexpected error occurs it should disable final product id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      setComponentFormControlValues();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("Given an unexpected error occurs it should clear final product id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      setComponentFormControlValues();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("Given an unexpected error occurs it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      setComponentFormControlValues();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given an unexpected error occurs it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      setComponentFormControlValues();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("Given a different latest final product is found it should emit a warning that preselected final product is different from the current latest final product", fakeAsync(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();

      let warningValue = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => {
        warningValue = warning;
      });
      tick();

      expect(warningValue).toEqual(
        MQGFromExistingBranchWarnings.PRESELECTED_FINAL_PRODUCT_DIFFERENT_FROM_LATEST
      );
    }));

    it("Given a different latest final product is found it should keep the preselected value of the final product id", fakeAsync(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(
        "someoldfinalproductid"
      );
    }));

    it("Given a different latest final product is found it should keep the preselected value of the rtp commit id", fakeAsync(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(
        "someoldrtpcommitid"
      );
    }));

    it("Given a different latest final product is found it should keep the preselected value of the config commit id", fakeAsync(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("someoldfinalproductid");
      component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
      component.configCommitIdFromControl.setValue("someoldconfigcommitid");
      component.ngOnInit();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(
        "someoldconfigcommitid"
      );
    }));
  });

  describe("Given archival branch name is not preselected", () => {
    it("should disable final product id selection", () => {
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    });

    it("should clear final product id selection", () => {
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    });

    it("should clear rtp commit id selection", () => {
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    });

    it("should clear configuration commit id selection", () => {
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    });

    it("should emit that no warning exists", fakeAsync(() => {
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      let currentWarning: MQGFromExistingBranchWarnings =
        MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND;
      component.warning$.subscribe((warning) => (currentWarning = warning));
      tick();

      expect(currentWarning).toEqual(MQGFromExistingBranchWarnings.NO_WARNING);
    }));
  });

  describe("Given archival branch name is selected", () => {
    it("should enable final product id selection", fakeAsync(() => {
      component.ngOnInit();

      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(component.finalProductIdFromControl.enabled).toBeTruthy();
    }));

    it("should fetch the latest final product with correct project id", fakeAsync(() => {
      component.ngOnInit();

      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(
        latestFinalProductFetcher.getLatestFinalProductOnBranch
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: PROJECT_ID,
        })
      );
    }));

    it("should fetch the latest final product with correct repository id", fakeAsync(() => {
      component.ngOnInit();

      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(
        latestFinalProductFetcher.getLatestFinalProductOnBranch
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          repositoryId: REPOSITORY_ID,
        })
      );
    }));

    it("should fetch the latest final product with correct branch name filter", fakeAsync(() => {
      component.ngOnInit();

      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(
        latestFinalProductFetcher.getLatestFinalProductOnBranch
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          branchName: "archivalBranchName",
        })
      );
    }));

    it("should set the final product id from the latest final product on the selected archival branch name", fakeAsync(() => {
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(component.finalProductIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.id
      );
    }));

    it("should set the configuration commit id from the latest final product on the selected archival branch name", fakeAsync(() => {
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(component.configCommitIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.configurationCommitId
      );
    }));

    it("should set the rtp commit id from the latest final product on the selected archival branch name", fakeAsync(() => {
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(component.rtpCommitIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.rtpProduct?.rtpCommitId
      );
    }));

    it("should emit that no warning exists", fakeAsync(() => {
      component.ngOnInit();
      let currentWarning: MQGFromExistingBranchWarnings =
        MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND;
      component.warning$.subscribe((warning) => (currentWarning = warning));
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(currentWarning).toEqual(MQGFromExistingBranchWarnings.NO_WARNING);
    }));

    it("And given no rtp product exists it should set the rtp commit id from the config commit id from the latest final product on the selected archival branch name", fakeAsync(() => {
      setupLatestFinalProductWithoutRtpProduct();
      initializeComponent();
      component.ngOnInit();

      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(component.rtpCommitIdFromControl.value).toBe(
        FINAL_PRODUCT.optionalFinalProduct?.configurationCommitId
      );
    }));

    it("And given no final product is found it should emit a warning that no final product is found on the archival branch", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => (currentWarning = warning));
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND
      );
    }));

    it("And given no final product is found it should disable final product id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("And given no final product is found it should clear final product id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("And given no final product is found it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("And given no final product is found it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithNoFinalProductFound();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("And given archival branch name is not valid it should emit a warning that the archival branch name is not valid", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => {
        currentWarning = warning;
      });
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.INVALID_BRANCH_NAME
      );
    }));

    it("And given archival branch name is not valid it should disable final product id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("And given archival branch name is not valid it should clear final product id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("And given archival branch name is not valid it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("And given archival branch name is not valid it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("And given an unexpected error occurred it should emit a warning that the archival branch name is not valid", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      let currentWarning = MQGFromExistingBranchWarnings.NO_WARNING;
      component.warning$.subscribe((warning) => {
        currentWarning = warning;
      });
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick(500);

      expect(currentWarning).toEqual(
        MQGFromExistingBranchWarnings.UNEXPECTED_FAILURE
      );
    }));

    it("And given an unexpected error occurred it should disable final product id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("And given an unexpected error occurred it should clear final product id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("And given an unexpected error occurred it should clear rtp commit id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("And given an unexpected error occurred it should clear configuration commit id selection", fakeAsync(() => {
      setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct();
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));
  });

  describe("When archival branch name is cleared", () => {
    beforeEach(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");
      component.finalProductIdFromControl.setValue("finalProductId");
      component.rtpCommitIdFromControl.setValue("rtpCommitId");
      component.configCommitIdFromControl.setValue("configCommitId");
    });

    it("should disable final product id selection", fakeAsync(() => {
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue(undefined);
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("should clear final product id selection", fakeAsync(() => {
      component.ngOnInit();

      component.archivalBranchNameFormControl.setValue(undefined);
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("should clear rtp commit id selection", fakeAsync(() => {
      component.ngOnInit();
      component.archivalBranchNameFormControl.setValue(undefined);
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should clear configuration commit id selection", fakeAsync(() => {
      component.ngOnInit();

      component.archivalBranchNameFormControl.setValue(undefined);
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should emit that no warning exists", fakeAsync(() => {
      component.ngOnInit();
      let currentWarning: MQGFromExistingBranchWarnings =
        MQGFromExistingBranchWarnings.NO_FINAL_PRODUCT_FOUND;
      component.warning$.subscribe((warning) => (currentWarning = warning));
      component.archivalBranchNameFormControl.setValue(undefined);
      tick();

      expect(currentWarning).toEqual(MQGFromExistingBranchWarnings.NO_WARNING);
    }));
  });

  describe("Upon destruction", () => {
    it("should disable archival branch name selection", fakeAsync(() => {
      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.archivalBranchNameFormControl.enabled).toBeFalsy();
    }));

    it("should disable final product selection", fakeAsync(() => {
      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.finalProductIdFromControl.enabled).toBeFalsy();
    }));

    it("should clear the archival branch name preselected value", fakeAsync(() => {
      component.archivalBranchNameFormControl.setValue("archivalBranchName");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.archivalBranchNameFormControl.value).toEqual(undefined);
    }));

    it("should clear final product id", fakeAsync(() => {
      component.finalProductIdFromControl.setValue("finalProductId");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.finalProductIdFromControl.value).toEqual(undefined);
    }));

    it("should clear configuration commit id", fakeAsync(() => {
      component.configCommitIdFromControl.setValue("configCommitId");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.configCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should clear the rtp commit id", fakeAsync(() => {
      component.rtpCommitIdFromControl.setValue("rtpCommitId");

      component.ngOnInit();

      component.ngOnDestroy();
      tick();

      expect(component.rtpCommitIdFromControl.value).toEqual(undefined);
    }));

    it("should end all subscriptions to the archival branch name form control", () => {
      const observable = interval(100).pipe(concatMap(() => of("value")));
      const subject = new Subject();

      const archivalBranchNamValueChanges = merge(
        subject,
        observable
      ) as Observable<string>;

      component.archivalBranchNameFormControl = {
        valueChanges: archivalBranchNamValueChanges,
        enable: jest.fn(),
        disable: jest.fn(),
        value: "value",
        setValue: jest.fn(),
      } as unknown as FormControl;

      component.ngOnInit();

      expect(subject.observed).toBe(true);

      component.ngOnDestroy();

      expect(subject.observed).toBe(false);
    });

    it("should end all subscriptions to the final product id form control", () => {
      const observable = interval(100).pipe(concatMap(() => of("value")));
      const subject = new Subject();

      const finalProductIdValueChanges = merge(
        subject,
        observable
      ) as Observable<string>;

      component.archivalBranchNameFormControl = {
        valueChanges: finalProductIdValueChanges,
        enable: jest.fn(),
        disable: jest.fn(),
        value: "value",
        setValue: jest.fn(),
      } as unknown as FormControl;

      component.ngOnInit();

      expect(subject.observed).toBe(true);

      component.ngOnDestroy();

      expect(subject.observed).toBe(false);
    });

    it("should end all subscriptions to the fetched latest final product", () => {
      const observable = interval(100).pipe(concatMap(() => of({})));
      const subject = new Subject();

      const latestFinalProduct = merge(
        subject,
        observable
      ) as Observable<FinalProductResponse>;

      latestFinalProductFetcher = {
        getLatestFinalProductOnBranch: jest.fn(() =>
          firstValueFrom(latestFinalProduct)
        ),
      } as unknown as LatestFinalProductServiceFetcher;

      initializeComponent();

      component.ngOnInit();

      component.ngOnDestroy();

      expect(subject.observed).toBe(false);
    });
  });

  describe("Force showing fields", () => {
    it("should force show the archival branch name if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["archivalBranchName"];
      component.ngOnInit();
      expect(component.forceShowArchivalBranch).toBeTruthy();
    });
    it("should not force show archival branch name if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowArchivalBranch).toBeFalsy();
    });
    it("should force show the final product id if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["finalProductId"];
      component.ngOnInit();
      expect(component.forceShowFinalProductId).toBeTruthy();
    });
    it("should not force show the final product id if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowFinalProductId).toBeFalsy();
    });
    it("should force show the rtp commit id if it was provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = ["rtpCommitId"];
      component.ngOnInit();
      expect(component.forceShowRtpCommitId).toBeTruthy();
    });
    it("should not force show rtp commit id if it was not provided in prefilled inputs to show", () => {
      component.prefilledInputsToShow = [];
      component.ngOnInit();
      expect(component.forceShowRtpCommitId).toBeFalsy();
    });
  });

  function setupLatestFinalProductWithoutRtpProduct() {
    latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
      Promise.resolve(FINAL_PRODUCT_WITHOUT_RTP_PRODUCT)
    );
  }

  function setupComponentWithNoFinalProductFound() {
    latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
      Promise.resolve({
        failureReason: LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND,
      })
    );

    initializeComponent();
  }

  function setupComponentWithInvalidBranchNameOnFetchingLatestFinalProduct() {
    latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
      Promise.resolve({
        failureReason: LatestFinalProductFailureReason.INVALID_BRANCH_NAME,
      })
    );

    initializeComponent();
  }

  function setupComponentWithUnexpectedFailureOnFetchingLatestFinalProduct() {
    latestFinalProductFetcher.getLatestFinalProductOnBranch = jest.fn(() =>
      Promise.resolve({
        failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
      })
    );

    initializeComponent();
  }

  function initializeComponent() {
    component.projectId = PROJECT_ID;
    component.repositoryId = REPOSITORY_ID;
    component.archivalBranchNameFormControl = new FormControl();
    component.finalProductIdFromControl = new FormControl();
    component.configCommitIdFromControl = new FormControl();
    component.rtpCommitIdFromControl = new FormControl();
  }

  function setComponentFormControlValues() {
    component.archivalBranchNameFormControl.setValue("archivalBranchName");
    component.finalProductIdFromControl.setValue("someoldfinalproductid");
    component.rtpCommitIdFromControl.setValue("someoldrtpcommitid");
    component.configCommitIdFromControl.setValue("someoldconfigcommitid");
    component.ngOnInit();
  }
});

@Component({
  selector: "mxevolve-definition-input",
  template: "<ng-content></ng-content>",
})
class MockDefinitionInputComponent {
  @Input({ required: true }) inputFormControlName: string;
  @Input({ required: true }) inputFormControl: FormControl;
  @Input() label: string;
  @Input({ required: true }) description: string;
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input({ required: true }) displayMode: DisplayMode;
  @Input() tooltip: string;
  @Input() forceShow = false;
}

@Component({
  selector: "mxevolve-branch-input",
  template: "",
})
class MockBranchInputComponent {
  @Input() branchShouldExist = true;
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) repoId!: string;
  @Input({ required: true }) branchNameFormControl!: FormControl;
  @Input() initialValue: string = "";
  @Output() initialInvalid = new EventEmitter<void>();
}

@Component({
  selector: "mxevolve-business-process-final-product-selector",
  template: "",
})
class MockBusinessProcessFinalProductSelectorComponent {
  @Input({ required: true }) finalProductSelectionFormControl: FormControl<
    BusinessProcessFinalProductInput | undefined
  >;
  @Input({ required: true }) finalProductSelectionFormControlName: string;
  @Input({ required: true }) projectId: string;
  @Input() originBranchName: string;
  @Input() businessProcessQualityLevel: string;
  @Input() showAsTags: boolean;
}
