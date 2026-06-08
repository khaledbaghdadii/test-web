import { FinalProductSyncDetailsComponent } from "./final-product-sync-details.component";
import { SyncFinalProductRequest, SyncState } from "../../model/final-product";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { MockDirectives, ngMocks } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { FinalProductSyncDetails } from "../model/final-product-sync-details";
import { Storage } from "../../../storage/model/storage";
import { AssetLocationType } from "../../../location/model/asset-location-type";
import { StorageType } from "../../../storage/model/storage-type";
import { FormsModule } from "@angular/forms";
import {
  EnvironmentDefinition,
  EnvironmentDefinitionStatus,
} from "@mxflow/features/environment";

const projectId = "proj-id";
const finalProductId = "fp-id";

function getFinalProductSyncDetails(): FinalProductSyncDetails {
  const mockStorage: Storage = {
    id: "storage-id",
    baseUri: "http://example.com",
    name: "mock-storage",
    storageType: StorageType.NEXUS3,
    useCases: [],
    createdOn: new Date(),
  };

  const mockRequest: SyncFinalProductRequest = {
    id: "id",
    startDate: "2023-01-01T00:00:00Z",
    endDate: "2023-01-01T01:00:00Z",
    state: SyncState.SUCCESS,
    environmentDefinitionIds: ["env-id"],
    asset: {
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
    },
    lightPackage: true,
  };
  return {
    finalProductId: finalProductId,
    projectId: projectId,
    syncRequestDetails: mockRequest,
  };
}

describe("FinalProductSyncDetailsComponent", () => {
  let component: FinalProductSyncDetailsComponent;
  let fixture: ComponentFixture<FinalProductSyncDetailsComponent>;
  let mockAuthorizationService: jest.Mocked<
    Pick<AuthorizationService, "isAuthorized">
  >;

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [FinalProductSyncDetailsComponent, FormsModule],
      providers: [
        { provide: AuthorizationService, useValue: mockAuthorizationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsComponent);

    const syncDetails = getFinalProductSyncDetails();
    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should map SUCCESS to "success"', () => {
    expect(component.getStateSeverity(SyncState.SUCCESS)).toBe("success");
  });

  it('should map FAILED to "danger"', () => {
    expect(component.getStateSeverity(SyncState.FAILED)).toBe("danger");
  });

  it('should map IN_PROGRESS to "secondary"', () => {
    expect(component.getStateSeverity(SyncState.IN_PROGRESS)).toBe("secondary");
  });

  it('should map UNSTABLE to "warn"', () => {
    expect(component.getStateSeverity(SyncState.UNSTABLE)).toBe("warn");
  });

  it("should assign input finalProductSyncDetails correctly", () => {
    const mockStorage: Storage = {
      id: "storage-id",
      baseUri: "http://example.com",
      name: "mock-storage",
      storageType: StorageType.NEXUS3,
      useCases: [],
      createdOn: new Date(),
    };

    const mockRequest: SyncFinalProductRequest = {
      id: "id",
      startDate: "2023-01-01T00:00:00Z",
      endDate: "2023-01-01T01:00:00Z",
      state: SyncState.SUCCESS,
      environmentDefinitionIds: ["env-id"],
      asset: {
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
      },
      lightPackage: true,
    };
    const syncDetails = {
      finalProductId: "fp-id",
      projectId: "proj-id",
      syncRequestDetails: mockRequest,
    };

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    expect(component.finalProductSyncDetails().finalProductId).toBe("fp-id");
    expect(component.finalProductSyncDetails().syncRequestDetails.state).toBe(
      "SUCCESS"
    );
    expect(
      component.finalProductSyncDetails().syncRequestDetails.asset.locations[0]
        .fullPath
    ).toBe("/full/path");
  });
});

describe("getLightPackageTooltip test", () => {
  let component: FinalProductSyncDetailsComponent;
  let fixture: ComponentFixture<FinalProductSyncDetailsComponent>;
  let mockAuthorizationService: jest.Mocked<
    Pick<AuthorizationService, "isAuthorized">
  >;

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [FinalProductSyncDetailsComponent, FormsModule],
      providers: [
        { provide: AuthorizationService, useValue: mockAuthorizationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsComponent);

    const syncDetails = getFinalProductSyncDetails();
    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should return correct tooltip for light package", () => {
    const tooltip = component.getLightPackageTooltip();
    expect(tooltip).toBe(
      "When enabled, only the client configurations are synced without the factory product artifacts."
    );
  });
});

describe("FinalProductSyncDetailsComponent Input Signals", () => {
  let component: FinalProductSyncDetailsComponent;
  let fixture: ComponentFixture<FinalProductSyncDetailsComponent>;
  let mockAuthorizationService: jest.Mocked<
    Pick<AuthorizationService, "isAuthorized">
  >;

  const mockEnvironmentDefinitions: EnvironmentDefinition[] = [
    {
      id: "env-id",
      name: "Environment 1",
      status: EnvironmentDefinitionStatus.ACTIVE,
    },
    {
      id: "env-id-2",
      name: "Environment 2",
      status: EnvironmentDefinitionStatus.ACTIVE,
    },
  ];

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [FinalProductSyncDetailsComponent, FormsModule],
      providers: [
        { provide: AuthorizationService, useValue: mockAuthorizationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsComponent);

    const syncDetails = getFinalProductSyncDetails();
    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("finalProductSyncDetails input", () => {
    it("should accept and store finalProductSyncDetails input", () => {
      const syncDetails = getFinalProductSyncDetails();
      fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);

      expect(component.finalProductSyncDetails()).toEqual(syncDetails);
    });

    it("should update when finalProductSyncDetails input changes", () => {
      const syncDetails1 = getFinalProductSyncDetails();
      fixture.componentRef.setInput("finalProductSyncDetails", syncDetails1);

      expect(component.finalProductSyncDetails()).toEqual(syncDetails1);

      const syncDetails2 = {
        ...syncDetails1,
        finalProductId: "new-fp-id",
      };
      fixture.componentRef.setInput("finalProductSyncDetails", syncDetails2);

      expect(component.finalProductSyncDetails()).toEqual(syncDetails2);
      expect(component.finalProductSyncDetails().finalProductId).toBe(
        "new-fp-id"
      );
    });
  });

  describe("environmentDefinitions input", () => {
    it("should accept and store environmentDefinitions input", () => {
      fixture.componentRef.setInput(
        "environmentDefinitions",
        mockEnvironmentDefinitions
      );

      expect(component.environmentDefinitions()).toEqual(
        mockEnvironmentDefinitions
      );
    });

    it("should accept empty array for environmentDefinitions", () => {
      fixture.componentRef.setInput("environmentDefinitions", []);

      expect(component.environmentDefinitions()).toEqual([]);
    });

    it("should update when environmentDefinitions input changes", () => {
      const definitions1 = [mockEnvironmentDefinitions[0]];
      fixture.componentRef.setInput("environmentDefinitions", definitions1);

      expect(component.environmentDefinitions()).toEqual(definitions1);

      const definitions2 = mockEnvironmentDefinitions;
      fixture.componentRef.setInput("environmentDefinitions", definitions2);

      expect(component.environmentDefinitions()).toEqual(definitions2);
    });
  });

  describe("fetchEnvironmentsLoading input", () => {
    it("should accept and store fetchEnvironmentsLoading as true", () => {
      fixture.componentRef.setInput("fetchEnvironmentsLoading", true);

      expect(component.fetchEnvironmentsLoading()).toBe(true);
    });

    it("should accept and store fetchEnvironmentsLoading as false", () => {
      fixture.componentRef.setInput("fetchEnvironmentsLoading", false);

      expect(component.fetchEnvironmentsLoading()).toBe(false);
    });

    it("should update when fetchEnvironmentsLoading input changes", () => {
      fixture.componentRef.setInput("fetchEnvironmentsLoading", true);

      expect(component.fetchEnvironmentsLoading()).toBe(true);

      fixture.componentRef.setInput("fetchEnvironmentsLoading", false);

      expect(component.fetchEnvironmentsLoading()).toBe(false);
    });
  });

  describe("showEnvironmentDefinitionNames input", () => {
    it("should accept and store showEnvironmentDefinitionNames as true", () => {
      fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

      expect(component.showEnvironmentDefinitionNames()).toBe(true);
    });

    it("should accept and store showEnvironmentDefinitionNames as false", () => {
      fixture.componentRef.setInput("showEnvironmentDefinitionNames", false);

      expect(component.showEnvironmentDefinitionNames()).toBe(false);
    });

    it("should update when showEnvironmentDefinitionNames input changes", () => {
      fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

      expect(component.showEnvironmentDefinitionNames()).toBe(true);

      fixture.componentRef.setInput("showEnvironmentDefinitionNames", false);

      expect(component.showEnvironmentDefinitionNames()).toBe(false);
    });
  });
});

describe("environmentDefinitionNames computed signal", () => {
  let component: FinalProductSyncDetailsComponent;
  let fixture: ComponentFixture<FinalProductSyncDetailsComponent>;
  let mockAuthorizationService: jest.Mocked<
    Pick<AuthorizationService, "isAuthorized">
  >;

  const mockEnvironmentDefinitions: EnvironmentDefinition[] = [
    {
      id: "env-id",
      name: "Environment 1",
      status: EnvironmentDefinitionStatus.ACTIVE,
    },
    {
      id: "env-id-2",
      name: "Environment 2",
      status: EnvironmentDefinitionStatus.ACTIVE,
    },
    {
      id: "env-id-3",
      name: "Environment 3",
      status: EnvironmentDefinitionStatus.ACTIVE,
    },
  ];

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [FinalProductSyncDetailsComponent, FormsModule],
      providers: [
        { provide: AuthorizationService, useValue: mockAuthorizationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsComponent);

    const syncDetails = getFinalProductSyncDetails();
    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should return environment names for matching IDs", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.environmentDefinitionIds = [
      "env-id",
      "env-id-2",
    ];

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const names = component.environmentDefinitionNames();
    expect(names).toEqual(["Environment 1", "Environment 2"]);
  });

  it("should return only matching environment names", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.environmentDefinitionIds = ["env-id-3"];

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const names = component.environmentDefinitionNames();
    expect(names).toEqual(["Environment 3"]);
  });

  it("should return empty array when no IDs match", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.environmentDefinitionIds = [
      "non-existent-id",
    ];

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const names = component.environmentDefinitionNames();
    expect(names).toEqual([]);
  });

  it("should return empty array when environment definitions are empty", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.environmentDefinitionIds = ["env-id"];

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const names = component.environmentDefinitionNames();
    expect(names).toEqual([]);
  });

  it("should return empty array when syncRequestDetails is undefined", () => {
    type FinalProductSyncDetailsWithoutRequest = Omit<
      FinalProductSyncDetails,
      "syncRequestDetails"
    > & {
      syncRequestDetails?: SyncFinalProductRequest;
    };

    const syncDetails: FinalProductSyncDetailsWithoutRequest = {
      finalProductId: "fp-id",
      projectId: "proj-id",
    };

    fixture.componentRef.setInput(
      "finalProductSyncDetails",
      syncDetails as unknown as FinalProductSyncDetails
    );
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

    const names = component.environmentDefinitionNames();
    expect(names).toEqual([]);
  });

  it("should return empty array when environmentDefinitionIds is empty", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.environmentDefinitionIds = [];

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const names = component.environmentDefinitionNames();
    expect(names).toEqual([]);
  });

  it("should update when input signals change", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.environmentDefinitionIds = ["env-id"];

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

    expect(component.environmentDefinitionNames()).toEqual(["Environment 1"]);

    const updatedSyncDetails = {
      ...syncDetails,
      syncRequestDetails: {
        ...syncDetails.syncRequestDetails,
        environmentDefinitionIds: ["env-id", "env-id-3"],
      },
    };
    fixture.componentRef.setInput(
      "finalProductSyncDetails",
      updatedSyncDetails
    );

    expect(component.environmentDefinitionNames()).toEqual([
      "Environment 1",
      "Environment 3",
    ]);
  });

  it("should filter correctly with multiple matching IDs", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.environmentDefinitionIds = [
      "env-id",
      "env-id-2",
      "env-id-3",
    ];

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput(
      "environmentDefinitions",
      mockEnvironmentDefinitions
    );
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const names = component.environmentDefinitionNames();
    expect(names).toEqual(["Environment 1", "Environment 2", "Environment 3"]);
    expect(names.length).toBe(3);
  });
});

describe("FinalProductSyncDetailsComponent with TestBed", () => {
  let fixture: ComponentFixture<FinalProductSyncDetailsComponent>;
  let mockAuthorizationService: jest.Mocked<
    Pick<AuthorizationService, "isAuthorized">
  >;

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn().mockReturnValue(of(true)),
    };
    await TestBed.configureTestingModule({
      imports: [
        FinalProductSyncDetailsComponent,
        MockDirectives(ShowElementIfAuthorizedDirective),
        FormsModule,
      ],
      schemas: [],
    })
      .overrideComponent(FinalProductSyncDetailsComponent, {
        set: {
          providers: [
            {
              provide: AuthorizationService,
              useValue: mockAuthorizationService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsComponent);

    const syncDetails = getFinalProductSyncDetails();
    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);

    fixture.detectChanges();
  });

  it("should have correct authorization on container div", () => {
    const syncDetails = getFinalProductSyncDetails();
    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    renderShowIfAuthorizedDirectives();
    fixture.detectChanges();
    const div = fixture.debugElement.query(
      By.css('[data-testid="sync-details-container"]')
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

describe("Warning field rendering", () => {
  let fixture: ComponentFixture<FinalProductSyncDetailsComponent>;
  let mockAuthorizationService: jest.Mocked<
    Pick<AuthorizationService, "isAuthorized">
  >;

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn().mockReturnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [FinalProductSyncDetailsComponent, FormsModule],
      providers: [
        { provide: AuthorizationService, useValue: mockAuthorizationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalProductSyncDetailsComponent);
  });

  it("should show Warning field when state is UNSTABLE and failureMessage is present", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.state = SyncState.UNSTABLE;
    syncDetails.syncRequestDetails.failureMessage = "Some warning message";

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const warningLabel = fixture.nativeElement.textContent;
    expect(warningLabel).toContain("Warning");
  });

  it("should not show Warning field when state is SUCCESS", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.state = SyncState.SUCCESS;
    syncDetails.syncRequestDetails.failureMessage = undefined;

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const warningLabel = fixture.nativeElement.textContent;
    expect(warningLabel).not.toContain("Warning");
  });

  it("should not show Warning field when state is UNSTABLE but failureMessage is null", () => {
    const syncDetails = getFinalProductSyncDetails();
    syncDetails.syncRequestDetails.state = SyncState.UNSTABLE;
    syncDetails.syncRequestDetails.failureMessage = undefined;

    fixture.componentRef.setInput("finalProductSyncDetails", syncDetails);
    fixture.componentRef.setInput("environmentDefinitions", []);
    fixture.componentRef.setInput("fetchEnvironmentsLoading", false);
    fixture.componentRef.setInput("showEnvironmentDefinitionNames", true);
    fixture.detectChanges();

    const warningLabel = fixture.nativeElement.textContent;
    expect(warningLabel).not.toContain("Warning");
  });
});
