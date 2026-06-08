import { FinalProductSyncDetailsViewComponent } from "./final-product-sync-details-view.component";
import { FinalProductSyncDetails } from "../model/final-product-sync-details";
import {
  FinalProduct,
  SyncFinalProductRequest,
  SyncState,
} from "../../model/final-product";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { MockDirectives, ngMocks } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { Storage } from "../../../storage/model/storage";
import { AssetLocationType } from "../../../location/model/asset-location-type";
import { StorageType } from "../../../storage/model/storage-type";
import { FinalProductSyncDetailsStateService } from "../final-product-sync-details/final-product-sync-details-state.service";
import { signal, Signal } from "@angular/core";
import { ToastMessageService } from "@mxflow/ui/alert";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { EnvironmentDefinition } from "@mxflow/features/environment";

type MockFinalProductSyncDetailsStateService = Pick<
  FinalProductSyncDetailsStateService,
  | "environmentDefinitions"
  | "fetchEnvironmentsLoading"
  | "errorMessage$"
  | "setProjectId"
>;

const projectId = "P1";
const finalProductId = "FP1";

function getMockAsset() {
  const mockStorage: Storage = {
    id: "storage-id",
    baseUri: "http://example.com",
    name: "mock-storage",
    storageType: StorageType.NEXUS3,
    useCases: [],
    createdOn: new Date(),
  };

  return {
    id: "asset-id",
    nickname: "asset-nickname",
    locations: [
      {
        fullPath: "/full/path",
        relativePath: "/rel/path",
        storage: mockStorage,
        type: AssetLocationType.PATH,
      },
    ],
  };
}

function getFinalProduct(): FinalProduct {
  return {
    id: finalProductId,
    projectId: projectId,
    branch: "branch",
    repositoryId: "repositoryId",
    tag: "tag",
    validationLevel: "validationLevel",
    version: "version",
    environmentDefinitionId: "environmentDefinitionId",
    configurationCommitId: "configurationCommitId",
    state: "available",
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
    createdOn: "createdOnDate",
    syncRequests: [],
  } as FinalProduct;
}

describe("FinalProductSyncDetailsViewComponent (signals)", () => {
  let component: FinalProductSyncDetailsViewComponent;
  let fixture: ComponentFixture<FinalProductSyncDetailsViewComponent>;

  let mockStateService: {
    environmentDefinitions: Signal<EnvironmentDefinition[]>;
    fetchEnvironmentsLoading: Signal<boolean>;
    errorMessage$: Subject<string>;
    setProjectId: jest.Mock;
  } & MockFinalProductSyncDetailsStateService;

  let mockToastMessageService: {
    showError: jest.Mock;
  };

  beforeEach(async () => {
    mockStateService = {
      environmentDefinitions: signal([]),
      fetchEnvironmentsLoading: signal(false),
      errorMessage$: new Subject<string>(),
      setProjectId: jest.fn(),
    };

    mockToastMessageService = {
      showError: jest.fn(),
    };

    const appConfig = {
      gatewayUrl: "http://localhost/",
    } as Partial<AppConfig> as AppConfig;

    await TestBed.configureTestingModule({
      imports: [FinalProductSyncDetailsViewComponent],
    })
      .overrideComponent(FinalProductSyncDetailsViewComponent, {
        set: {
          providers: [
            {
              provide: APP_CONFIG,
              useValue: appConfig,
            },
            {
              provide: AuthorizationService,
              useValue: {
                isAuthorized: jest.fn().mockReturnValue(of(true)),
              },
            },
            {
              provide: FinalProductSyncDetailsStateService,
              useValue: mockStateService,
            },
            {
              provide: ToastMessageService,
              useValue: mockToastMessageService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsViewComponent);
    component = fixture.componentInstance;
  });

  it("should compute latestFinalProductSyncDetails as null when syncRequests is empty", () => {
    const finalProduct = {
      id: "FP1",
      projectId: "P1",
      syncRequests: [],
    } as unknown as FinalProduct;

    fixture.componentRef.setInput("finalProduct", finalProduct);
    fixture.detectChanges();

    expect(component.latestFinalProductSyncDetails()).toBeNull();
  });

  it("should pick the most recent syncRequest by startDate", () => {
    const older: SyncFinalProductRequest = {
      id: "1",
      startDate: "2021-01-01T00:00:00Z",
      endDate: "2021-01-01T01:00:00Z",
      state: SyncState.SUCCESS,
      environmentDefinitionIds: ["envA"],
      asset: getMockAsset(),
      lightPackage: false,
    };
    const newer: SyncFinalProductRequest = {
      id: "2",
      startDate: "2022-01-01T00:00:00Z",
      endDate: "2022-01-01T01:00:00Z",
      state: SyncState.SUCCESS,
      environmentDefinitionIds: ["envB"],
      asset: getMockAsset(),
      lightPackage: false,
    };

    const finalProduct = {
      id: "FP1",
      projectId: "P1",
      syncRequests: [older, newer],
    } as unknown as FinalProduct;

    fixture.componentRef.setInput("finalProduct", finalProduct);
    fixture.detectChanges();

    expect(component.latestFinalProductSyncDetails()).toEqual({
      finalProductId: "FP1",
      projectId: "P1",
      syncRequestDetails: newer,
    } as FinalProductSyncDetails);
  });

  it("should sort syncRequests descending in finalProductWithSortedSyncRequests", () => {
    const newer: SyncFinalProductRequest = {
      id: "2",
      startDate: "2022-01-01T00:00:00Z",
      endDate: "2022-01-01T01:00:00Z",
      state: SyncState.SUCCESS,
      environmentDefinitionIds: ["envB"],
      asset: getMockAsset(),
      lightPackage: false,
    };
    const older: SyncFinalProductRequest = {
      id: "1",
      startDate: "2021-01-01T00:00:00Z",
      endDate: "2021-01-01T01:00:00Z",
      state: SyncState.SUCCESS,
      environmentDefinitionIds: ["envA"],
      asset: getMockAsset(),
      lightPackage: false,
    };

    const finalProduct = {
      id: "FP1",
      projectId: "P1",
      syncRequests: [older, newer],
    } as unknown as FinalProduct;

    fixture.componentRef.setInput("finalProduct", finalProduct);
    fixture.detectChanges();

    expect(
      component.finalProductWithSortedSyncRequests()?.syncRequests?.[0]
    ).toEqual(newer);
  });

  it("should call stateService.setProjectId from the constructor effect when finalProduct is set", () => {
    const finalProduct = getFinalProduct();

    fixture.componentRef.setInput("finalProduct", finalProduct);
    fixture.detectChanges();

    expect(mockStateService.setProjectId).toHaveBeenCalledWith(projectId);
  });

  it("should hide environment names and show toast when stateService emits an error", () => {
    const finalProduct = getFinalProduct();

    fixture.componentRef.setInput("finalProduct", finalProduct);
    fixture.detectChanges();

    mockStateService.errorMessage$.next("Boom");
    fixture.detectChanges();

    expect(component.showEnvironmentDefinitionNames()).toBe(false);
    expect(mockToastMessageService.showError).toHaveBeenCalledWith("Boom");
  });

  it("should get final product sync details (pure function)", () => {
    const older: SyncFinalProductRequest = {
      id: "1",
      startDate: "2021-01-01T00:00:00Z",
      endDate: "2021-01-01T01:00:00Z",
      state: SyncState.SUCCESS,
      environmentDefinitionIds: ["envA"],
      asset: getMockAsset(),
      lightPackage: false,
    };
    const finalProduct = {
      id: "FP1",
      projectId: "P1",
      syncRequests: [older],
    } as unknown as FinalProduct;

    expect(
      component.getFinalProductSyncDetails(finalProduct, older)
    ).toStrictEqual({
      finalProductId: "FP1",
      projectId: "P1",
      syncRequestDetails: older,
    } as FinalProductSyncDetails);
  });
});

describe("FinalProductSyncDetailsViewComponent", () => {
  let fixture: ComponentFixture<FinalProductSyncDetailsViewComponent>;
  let mockAuthorizationService: jest.Mocked<
    Pick<AuthorizationService, "isAuthorized">
  >;

  let mockStateService: {
    environmentDefinitions: Signal<EnvironmentDefinition[]>;
    fetchEnvironmentsLoading: Signal<boolean>;
    errorMessage$: Subject<string>;
    setProjectId: jest.Mock;
  } & MockFinalProductSyncDetailsStateService;

  let mockToastMessageService: {
    showError: jest.Mock;
  };

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn().mockReturnValue(of(true)),
    };

    mockStateService = {
      environmentDefinitions: signal([]),
      fetchEnvironmentsLoading: signal(false),
      errorMessage$: new Subject<string>(),
      setProjectId: jest.fn(),
    };

    mockToastMessageService = {
      showError: jest.fn(),
    };

    const appConfig = {
      gatewayUrl: "http://localhost/",
    } as Partial<AppConfig> as AppConfig;

    await TestBed.configureTestingModule({
      imports: [
        FinalProductSyncDetailsViewComponent,
        MockDirectives(ShowElementIfAuthorizedDirective),
      ],
      schemas: [],
    })
      .overrideComponent(FinalProductSyncDetailsViewComponent, {
        set: {
          providers: [
            {
              provide: APP_CONFIG,
              useValue: appConfig,
            },
            {
              provide: AuthorizationService,
              useValue: mockAuthorizationService,
            },
            {
              provide: FinalProductSyncDetailsStateService,
              useValue: mockStateService,
            },
            {
              provide: ToastMessageService,
              useValue: mockToastMessageService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsViewComponent);
  });

  it("should have correct authorization on container div", () => {
    fixture.componentRef.setInput("finalProduct", getFinalProduct());
    renderShowIfAuthorizedDirectives();
    fixture.detectChanges();
    const div = fixture.debugElement.query(
      By.css('[data-testid="sync-details-view-container"]')
    );
    expect(div).toBeTruthy();
    const showElementDirective = ngMocks.findInstance(
      div,
      ShowElementIfAuthorizedDirective
    );
    expect(showElementDirective.showElementIfAuthorized).toEqual({
      action: "read",
      attributes: {},
      package: "artifact_management",
      resource: "final_product",
      projectId: projectId,
    });
  });
});

function renderShowIfAuthorizedDirectives() {
  const showElementIfAuthorizedDirectives = ngMocks.findInstances(
    ShowElementIfAuthorizedDirective
  );
  showElementIfAuthorizedDirectives.forEach((authDirective) =>
    ngMocks.render(authDirective, authDirective)
  );
}
