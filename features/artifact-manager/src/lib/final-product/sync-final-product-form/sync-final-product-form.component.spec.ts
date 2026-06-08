import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { SyncFinalProductFormComponent } from "./sync-final-product-form.component";
import { FinalProductStateService } from "../service/final-product-state.service";
import {
  GroupSelectionDropdownModule,
  InfraGroupsService,
} from "@mxflow/features/infra-management";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { BehaviorSubject, of } from "rxjs";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CommonModule, NgClass, NgTemplateOutlet } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { Button } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { APP_CONFIG } from "@mxflow/config";
import { FinalProduct } from "@mxflow/features/artifact-manager";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { Project } from "@mxflow/core/auth";
import { StoreModule } from "@ngrx/store";
import { signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { SyncFinalProductFormComponentService } from "./service/sync-final-product-form-component.service";
import { noSpacesValidator } from "../../shared/custom-validators/no-space-validators";

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
  syncRequests: [],
};

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";

const MOUSE_CLICK_EVENT = new MouseEvent("click", {
  bubbles: true,
  cancelable: true,
});

describe("SyncFinalProductFormComponent", () => {
  let component: SyncFinalProductFormComponent;
  let fixture: ComponentFixture<SyncFinalProductFormComponent>;
  let mockFinalProductStateService: any;
  let mockForm: FormGroup;
  let mockSyncFinalProductFormComponentService: SyncFinalProductFormComponentService;
  let mockInfraGroupsService: any;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(async () => {
    mockForm = new FormGroup({
      storageType: new FormControl({}),
      packageName: new FormControl({}),
      directoryName: new FormControl({}),
      version: new FormControl({}),
      infraGroup: new FormControl({}),
      environmentDefinitions: new FormControl(null),
      groupId: new FormControl({}),
      artifactId: new FormControl({}),
      classifier: new FormControl({}),
      packagingType: new FormControl({}),
      lightPackage: new FormControl(false),
    });
    mockSyncFinalProductFormComponentService = {
      initializeForm: jest.fn().mockReturnValue(mockForm),
      applyFormValidators: jest.fn(),
      subscribeToDestinationStorageTypeChanges: jest.fn(),
      syncFinalProduct: jest.fn().mockReturnValue(of(void 0)),
      setClassifier: jest.fn(),
    } as unknown as SyncFinalProductFormComponentService;
    mockFinalProductStateService = {
      finalProducts: new BehaviorSubject<any>(null),
      pageSize: new BehaviorSubject<number>(20),
      pageIndex: new BehaviorSubject<number>(0),
      fetchFinalProductsLoading: new BehaviorSubject<boolean>(false),
      isSyncFinalProductLoading: signal(false),
      isSyncFinalProductModalOpen: signal(false),
      selectedFinalProductToBeSynced: signal(undefined),
      projects: new BehaviorSubject<Project[] | undefined>(undefined),
      setPageSize: jest.fn(),
      setPageIndex: jest.fn(),
      setSelectedFinalProductToBeSynced: jest.fn(),
      syncFinalProduct: jest.fn(),
      setBranchNameSearchValue: jest.fn(),
      setValidationLevelSearchValue: jest.fn(),
      setConfigurationCommitIdSearchValue: jest.fn(),
      setSearchKeyValue: jest.fn(),
      setProjectIds: jest.fn(),
      setIsToolTypes: jest.fn(),
      setMxBundlesType: jest.fn(),
      setErrorMessage: jest.fn(),
      setIsSyncFinalProductModalOpen: jest.fn(),
      setSyncFinalProductLoading: jest.fn(),
    };

    mockInfraGroupsService = {
      getInfraGroups: jest.fn(),
      searchGroups: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        CommonModule,
        DialogModule,
        MandatoryFieldModule,
        Button,
        NgClass,
        FormsModule,
        ReactiveFormsModule,
        NgTemplateOutlet,
        InputTextModule,
        GroupSelectionDropdownModule,
        NoopAnimationsModule,
        StoreModule.forRoot({}),
      ],
      providers: [
        {
          provide: FinalProductStateService,
          useValue: mockFinalProductStateService,
        },
        { provide: InfraGroupsService, useValue: mockInfraGroupsService },
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    })
      .overrideComponent(SyncFinalProductFormComponent, {
        set: {
          providers: [
            {
              provide: SyncFinalProductFormComponentService,
              useValue: mockSyncFinalProductFormComponentService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SyncFinalProductFormComponent);
    component = fixture.componentInstance;
  });

  describe("test on init", () => {
    it("should initialize component", () => {
      component.finalProduct.set(FINAL_PRODUCT);

      component.ngOnInit();

      expect(
        mockSyncFinalProductFormComponentService.initializeForm
      ).toHaveBeenCalledWith(FINAL_PRODUCT);
      expect(
        mockSyncFinalProductFormComponentService.applyFormValidators
      ).toHaveBeenCalledWith(mockForm);
      expect(
        mockSyncFinalProductFormComponentService.subscribeToDestinationStorageTypeChanges
      ).toHaveBeenCalledWith(mockForm);
    });
  });
  describe("syncFinalProduct", () => {
    it("should sync final product and close form on success", () => {
      jest.spyOn(component, "closeSyncFinalProductForm");
      component.finalProduct.set(FINAL_PRODUCT);
      component.syncFinalProductForm = mockForm;

      component.syncFinalProduct();

      expect(
        mockSyncFinalProductFormComponentService.syncFinalProduct
      ).toHaveBeenCalledWith(FINAL_PRODUCT, mockForm);
      expect(component.closeSyncFinalProductForm).toHaveBeenCalled();
    });
  });
  describe("storage type and displayed fields test", () => {
    beforeEach(() => {
      component.isSyncFinalProductModalOpen.set(true);
      component.finalProduct.set(FINAL_PRODUCT);
      component.ngOnInit();
      fixture.detectChanges();
    });

    it("should render storage dropdown and show NFS fields by default, then show GAV fields when Maven selected", fakeAsync(() => {
      component.syncFinalProductForm.get("storageType")?.setValue("nfs");
      tick();
      fixture.detectChanges();
      expect(
        fixture.debugElement.query(By.css('[data-testid="directoryNameLabel"]'))
      ).toBeTruthy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="packageNameLabel"]'))
      ).toBeTruthy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="groupIdLabel"]'))
      ).toBeFalsy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="artifactIdLabel"]'))
      ).toBeFalsy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="versionLabel"]'))
      ).toBeFalsy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="packagingTypeLabel"]'))
      ).toBeFalsy();

      component.syncFinalProductForm.get("storageType")?.setValue("nexus3");
      tick();
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css('[data-testid="directoryNameLabel"]'))
      ).toBeFalsy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="packageNameLabel"]'))
      ).toBeFalsy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="groupIdLabel"]'))
      ).toBeTruthy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="artifactIdLabel"]'))
      ).toBeTruthy();
      expect(
        fixture.debugElement.query(By.css('[data-testid="versionLabel"]'))
      ).toBeTruthy();
    }));
  });

  describe("light package field", () => {
    beforeEach(() => {
      component.isSyncFinalProductModalOpen.set(true);
      component.finalProduct.set(FINAL_PRODUCT);
      component.ngOnInit();
      fixture.detectChanges();
    });

    it("should render the light package toggle switch, label and info icon", () => {
      const toggle = fixture.debugElement.query(
        By.css('[data-testid="lightPackageToggle"]')
      );
      const label = fixture.debugElement.query(
        By.css('[data-testid="lightPackageLabel"]')
      );
      const infoIcon = fixture.debugElement.query(
        By.css('[data-testid="lightPackageInfoIcon"]')
      );

      expect(toggle).toBeTruthy();
      expect(label).toBeTruthy();
      expect(label.nativeElement.textContent.trim()).toBe("Light Package");
      expect(infoIcon).toBeTruthy();
    });
  });

  describe("test input errors for spaces", () => {
    beforeEach(() => {
      component.isSyncFinalProductModalOpen.set(true);
      component.finalProduct.set(FINAL_PRODUCT);
      component.ngOnInit();
      fixture.detectChanges();
    });

    it("should show error for packageName if it contains spaces", fakeAsync(() => {
      component.syncFinalProductForm.get("storageType")?.setValue("nfs");
      const packageNameControl =
        component.syncFinalProductForm.get("packageName");
      packageNameControl?.setValidators([noSpacesValidator()]);
      packageNameControl?.setValue("invalid name");
      packageNameControl?.updateValueAndValidity();
      packageNameControl?.markAsTouched();
      packageNameControl?.markAsDirty();
      tick();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('[data-testid="packageNameError"]')
      );
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain(
        "Package Name must not contain spaces."
      );
    }));

    it("should show error for directoryName if it contains spaces", fakeAsync(() => {
      component.syncFinalProductForm.get("storageType")?.setValue("nfs");
      const directoryNameControl =
        component.syncFinalProductForm.get("directoryName");
      directoryNameControl?.setValidators([noSpacesValidator()]);
      directoryNameControl?.setValue("invalid name");
      directoryNameControl?.updateValueAndValidity();
      directoryNameControl?.markAsTouched();
      directoryNameControl?.markAsDirty();
      tick();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('[data-testid="directoryNameError"]')
      );
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain(
        "Directory Name must not contain spaces."
      );
    }));
    it("should show error for version if not provided", fakeAsync(() => {
      component.syncFinalProductForm.get("storageType")?.setValue("nexus3");
      const versionControl = component.syncFinalProductForm.get("version");
      versionControl?.setValidators([Validators.required]);
      versionControl?.setValue("");
      versionControl?.updateValueAndValidity();
      versionControl?.markAsTouched();
      versionControl?.markAsDirty();
      tick();
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(
        By.css('[data-testid="versionError"]')
      );
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain(
        "Version is required"
      );
    }));
  });
  describe("closeSyncFinalProductForm", () => {
    it("should close form and reset state and selected final product", () => {
      jest.spyOn(component, "resetSyncFinalProductForm");
      component.syncFinalProductForm = mockForm;

      component.closeSyncFinalProductForm();

      expect(
        mockFinalProductStateService.setIsSyncFinalProductModalOpen
      ).toHaveBeenCalledWith(false);
      expect(component.resetSyncFinalProductForm).toHaveBeenCalled();
      expect(
        mockFinalProductStateService.setSelectedFinalProductToBeSynced
      ).toHaveBeenCalledWith(undefined);
    });
  });
  describe("resetSyncFinalProductForm", () => {
    it("should reset the form", () => {
      jest.spyOn(mockForm, "reset");
      component.syncFinalProductForm = mockForm;

      component.resetSyncFinalProductForm();

      expect(mockForm.reset).toHaveBeenCalled();
    });
  });
  describe("onEnvironmentDefinitionSelected", () => {
    it("should call setClassifier when environment definitions are selected", () => {
      const environmentDefinitions = [
        { id: "envDefId", name: "Env Def" },
      ] as EnvironmentDefinition[];
      component.syncFinalProductForm = mockForm;

      component.onEnvironmentDefinitionSelected(environmentDefinitions);

      expect(
        mockSyncFinalProductFormComponentService.setClassifier
      ).toHaveBeenCalledWith(mockForm, environmentDefinitions);
    });

    it("should call setClassifier with empty array when no definitions selected", () => {
      component.syncFinalProductForm = mockForm;

      component.onEnvironmentDefinitionSelected([]);

      expect(
        mockSyncFinalProductFormComponentService.setClassifier
      ).toHaveBeenCalledWith(mockForm, []);
    });
  });
});
