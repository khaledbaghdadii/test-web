import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StorageType } from "../../storage/model/storage-type";
import {
  AssetLocation,
  AssetLocationType,
  FinalProductDetailsViewComponent,
  StorageUseCase,
} from "@mxflow/features/artifact-manager";
import { FinalProduct, SyncState } from "../model/final-product";
import { Storage } from "../../storage/model/storage";
import { By } from "@angular/platform-browser";
import { Component, signal } from "@angular/core";
import { AuthorizationService } from "@mxflow/core/auth";
import { of } from "rxjs";
import { FinalProductSyncDetailsStateService } from "./final-product-sync-details/final-product-sync-details-state.service";
import { FinalProductSyncDetailsViewComponent } from "./final-product-sync-details-view/final-product-sync-details-view.component";
import { FinalProductFailureDetailsComponent } from "./final-product-failure-details/final-product-failure-details.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { MessageService } from "primeng/api";

const MOCK_STORAGE: Storage = {
  id: "storage_id",
  baseUri: "base-uri",
  name: "name",
  storageType: StorageType.HTTP,
  useCases: [
    StorageUseCase.CLIENT_CONFIGURATIONS,
    StorageUseCase.FACTORY_PRODUCTS,
  ],
  createdOn: new Date(),
  createdBy: "User1",
};
const MOCK_ASSET_LOCATION: AssetLocation = {
  storage: MOCK_STORAGE,
  relativePath: "/path",
  fullPath: "/full/path",
  type: AssetLocationType.PATH,
};
const MOCK_FINAL_PRODUCT: FinalProduct = {
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
  createdOn: "2026-01-13T10:00:00Z",
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
  mxBundles: [{ id: "id", type: "type" }],
  isTools: [{ id: "id", type: "type", name: "name" }],
  syncRequests: [
    {
      id: "id",
      state: SyncState.SUCCESS,
      startDate: "2026-01-13T09:00:00Z",
      endDate: "2026-01-13T09:30:00Z",
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

@Component({
  template: ` <mxevolve-final-product-details-view
    [finalProduct]="finalProduct"
  ></mxevolve-final-product-details-view>`,
  standalone: true,
  imports: [FinalProductDetailsViewComponent],
})
class TestHostComponent {
  finalProduct: FinalProduct = MOCK_FINAL_PRODUCT;
}

describe("FinalProductDetailsViewComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  const mockAuthorizationService = {
    isAuthorized: jest.fn().mockReturnValue(of(true)),
  };

  beforeEach(async () => {
    const mockSyncDetailsStateService = {
      environmentDefinitions: signal([]),
      fetchEnvironmentsLoading: signal(false),
      errorMessage$: of(),
      setProjectId: jest.fn(),
    } as unknown as FinalProductSyncDetailsStateService;

    const mockToastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      clearErrors: jest.fn(),
    } as unknown as ToastMessageService;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: AuthorizationService, useValue: mockAuthorizationService },
        {
          provide: FinalProductSyncDetailsStateService,
          useValue: mockSyncDetailsStateService,
        },
        {
          provide: MessageService,
          useValue: {
            add: jest.fn(),
            clear: jest.fn(),
          } as unknown as MessageService,
        },
        {
          provide: ToastMessageService,
          useValue: mockToastMessageService,
        },
      ],
    })
      .overrideComponent(FinalProductSyncDetailsViewComponent, {
        set: {
          template: "",
          providers: [],
        },
      })
      .overrideComponent(FinalProductFailureDetailsComponent, {
        set: {
          template: "",
          providers: [],
        },
      })
      .overrideComponent(TestHostComponent, {
        set: {
          providers: [
            {
              provide: AuthorizationService,
              useValue: mockAuthorizationService,
            },
            {
              provide: FinalProductSyncDetailsStateService,
              useValue: mockSyncDetailsStateService,
            },
            {
              provide: MessageService,
              useValue: {
                add: jest.fn(),
                clear: jest.fn(),
              } as unknown as MessageService,
            },
            {
              provide: ToastMessageService,
              useValue: mockToastMessageService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  describe("hasSyncRequests", () => {
    it("should return true when syncRequests has items", () => {
      const component = new FinalProductDetailsViewComponent();
      component.finalProduct = MOCK_FINAL_PRODUCT;
      expect(component.hasSyncRequests).toBe(true);
    });

    it("should return false when syncRequests is empty", () => {
      const component = new FinalProductDetailsViewComponent();
      component.finalProduct = { ...MOCK_FINAL_PRODUCT, syncRequests: [] };
      expect(component.hasSyncRequests).toBe(false);
    });
  });

  describe("isFailed", () => {
    it("should return true when state is FAILED (uppercase)", () => {
      const component = new FinalProductDetailsViewComponent();
      component.finalProduct = { ...MOCK_FINAL_PRODUCT, state: "FAILED" };
      expect(component.isFailed).toBe(true);
    });

    it("should return true when state is failed (lowercase)", () => {
      const component = new FinalProductDetailsViewComponent();
      component.finalProduct = { ...MOCK_FINAL_PRODUCT, state: "failed" };
      expect(component.isFailed).toBe(true);
    });

    it("should return false when state is not failed", () => {
      const component = new FinalProductDetailsViewComponent();
      component.finalProduct = { ...MOCK_FINAL_PRODUCT, state: "available" };
      expect(component.isFailed).toBe(false);
    });
  });

  describe("template rendering", () => {
    it("should display 'No details available' when no sync requests and state is not failed", () => {
      hostComponent.finalProduct = {
        ...MOCK_FINAL_PRODUCT,
        syncRequests: [],
        state: "available",
      };
      fixture.detectChanges();

      const noDetailsElement = fixture.debugElement.query(By.css("p"));
      expect(noDetailsElement?.nativeElement.textContent).toContain(
        "No details available"
      );

      const tabs = fixture.debugElement.query(By.css("p-tabs"));
      expect(tabs).toBeNull();

      const syncDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-sync-details-view")
      );
      const failureDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-failure-details-view")
      );
      expect(syncDetailsView).toBeNull();
      expect(failureDetailsView).toBeNull();
    });

    it("should display only Sync Details tab when sync requests exist", () => {
      hostComponent.finalProduct = {
        ...MOCK_FINAL_PRODUCT,
        state: "available",
      };
      fixture.detectChanges();

      const syncDetailsTab = fixture.debugElement.query(
        By.css('p-tab[value="0"]')
      );
      const failureDetailsTab = fixture.debugElement.query(
        By.css('p-tab[value="1"]')
      );

      expect(syncDetailsTab).toBeTruthy();
      expect(syncDetailsTab.nativeElement.textContent).toContain(
        "Sync Details"
      );
      expect(failureDetailsTab).toBeNull();

      const syncDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-sync-details-view")
      );
      const failureDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-failure-details-view")
      );
      expect(syncDetailsView).toBeTruthy();
      expect(failureDetailsView).toBeNull();
    });

    it("should display only Failure Details tab when state is FAILED", () => {
      hostComponent.finalProduct = {
        ...MOCK_FINAL_PRODUCT,
        syncRequests: [],
        state: "FAILED",
      };
      fixture.detectChanges();

      const syncDetailsTab = fixture.debugElement.query(
        By.css('p-tab[value="0"]')
      );
      const failureDetailsTab = fixture.debugElement.query(
        By.css('p-tab[value="1"]')
      );

      expect(syncDetailsTab).toBeNull();
      expect(failureDetailsTab).toBeTruthy();
      expect(failureDetailsTab.nativeElement.textContent).toContain(
        "Failure Details"
      );

      const syncDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-sync-details-view")
      );
      const failureDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-failure-details-view")
      );
      expect(syncDetailsView).toBeNull();
      expect(failureDetailsView).toBeTruthy();
    });

    it("should display both Sync Details and Failure Details tabs when sync requests exist and state is FAILED", () => {
      hostComponent.finalProduct = {
        ...MOCK_FINAL_PRODUCT,
        state: "FAILED",
      };
      fixture.detectChanges();

      const syncDetailsTab = fixture.debugElement.query(
        By.css('p-tab[value="0"]')
      );
      const failureDetailsTab = fixture.debugElement.query(
        By.css('p-tab[value="1"]')
      );

      expect(syncDetailsTab).toBeTruthy();
      expect(syncDetailsTab.nativeElement.textContent).toContain(
        "Sync Details"
      );
      expect(failureDetailsTab).toBeTruthy();
      expect(failureDetailsTab.nativeElement.textContent).toContain(
        "Failure Details"
      );

      const syncDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-sync-details-view")
      );
      const failureDetailsView = fixture.debugElement.query(
        By.css("mxevolve-final-product-failure-details-view")
      );
      expect(syncDetailsView).toBeTruthy();
      expect(failureDetailsView).toBeTruthy();
    });
  });
});
