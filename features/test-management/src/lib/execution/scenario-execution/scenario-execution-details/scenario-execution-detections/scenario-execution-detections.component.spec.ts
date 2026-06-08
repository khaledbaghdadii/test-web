import { ScenarioExecutionDetectionsComponent } from "./scenario-execution-detections.component";
import { of, tap, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import { signal, WritableSignal } from "@angular/core";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  BinaryImpactService,
  BinaryRegressionDataService,
  ConfigurationImpactService,
  ConfigurationRegressionService,
  FailureReason,
  FailureReasonDetailsTableComponent,
  FailureReasonsDataService,
  LiteBinaryImpact,
  LiteBinaryRegression,
  LiteConfigurationImpact,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";
import { ConfirmationService } from "primeng/api";
import { ActivatedRoute } from "@angular/router";
import { AnalysisObjectLink } from "../../../analysis-object-link/analysis-object-link";
import { AnalysisObjectUnlinkModalComponent } from "../../../analysis-object-link/analysis-object-unlink-modal/analysis-object-unlink-modal.component";
import { MockComponent } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { LinkedConfigurationRegressionDetailsTableComponent } from "./linked-configuration-regression-details-table/linked-configuration-regression-details-table.component";
import { LinkedConfigurationImpactDetailsTableComponent } from "./linked-configuration-impact-details-table/linked-configuration-impact-details-table.component";
import { LinkedBinaryRegressionDetailsTableComponent } from "./linked-binary-regression-details-table/linked-binary-regression-details-table.component";
import { LinkedBinaryImpactDetailsTableComponent } from "./linked-binary-impact-details-table/linked-binary-impact-details-table.component";

describe("ScenarioExecutionDetectionsComponent", () => {
  const errorMessage = "Could not load detections.";
  let component: ScenarioExecutionDetectionsComponent;
  let fixture: ComponentFixture<ScenarioExecutionDetectionsComponent>;
  let toastMessageServiceMock: jest.Mocked<ToastMessageService>;
  let failureReasonsDataService: jest.Mocked<FailureReasonsDataService>;
  let stateService: ScenarioExecutionStateManagementService;
  let configurationImpactsService: jest.Mocked<ConfigurationImpactService>;
  let configurationRegressionService: jest.Mocked<ConfigurationRegressionService>;
  let binaryRegressionService: jest.Mocked<BinaryRegressionDataService>;
  let binaryImpactService: jest.Mocked<BinaryImpactService>;

  const analysisObjectLinks: WritableSignal<AnalysisObjectLink[]> = signal([]);

  const projectId = "projectId";
  const scenarioExecutionId = "scenario-execution-1";
  const failureReasonId = "FAILURE_REASON_ID";
  const configurationRegressionId = "123";
  const configurationRegressionId2 = "padel";
  const binaryRegressionId = "binaryRegressionId";
  const binaryRegressionId2 = "binaryRegressionId2";
  const configurationImpactId = "configurationImpactId";
  const configurationImpactId2 = "configurationImpactId2";
  const binaryImpactId = "binaryImpactId";
  const binaryImpactId2 = "binaryImpactId2";

  const incidentId = "incidentId";
  const LITE_BINARY_IMPACT_1 = {
    id: binaryImpactId,
    title: "title1",
    owner: "owner",
    mxVersion: "mxVersion",
    projectId: "projectId",
    upgradeImpact: {
      id: "upgradeImpactId",
      externalIssue: {
        id: "upgradeImpactExternalIssueId",
        link: "upgradeImpactExternalIssueLink",
      },
    },
  };
  const LITE_BINARY_IMPACT_2 = {
    id: binaryImpactId2,
    title: "title2",
    owner: "owner",
    mxVersion: "mxVersion",
    projectId: "projectId",
    upgradeImpact: {
      id: "upgradeImpactId",
      externalIssue: {
        id: "upgradeImpactExternalIssueId",
        link: "upgradeImpactExternalIssueLink",
      },
    },
  };
  const dummyBinaryImpacts: LiteBinaryImpact[] = [
    LITE_BINARY_IMPACT_1,
    LITE_BINARY_IMPACT_2,
  ];
  const LITE_CONFIGURATION_REGRESSION_1 = {
    id: configurationRegressionId,
    title: "Regression 1 Title",
    guiltyChange: "Guilty Change for Regression 1",
    owner: "Owner 1",
    fix: "",
    projectId: "",
  };
  const LITE_CONFIGURATION_REGRESSION_2 = {
    id: configurationRegressionId2,
    title: "Regression 2 Title",
    guiltyChange: "Guilty Change for Regression 2",
    owner: "Owner 2",
    fix: "",
    projectId: "",
  };

  const dummyConfigurationRegressions: LiteConfigurationRegression[] = [
    LITE_CONFIGURATION_REGRESSION_1,
    LITE_CONFIGURATION_REGRESSION_2,
  ];
  const dummyFailureReasons: FailureReason[] = [
    {
      id: "failureReasonId1",
      title: "title1",
      description: "description1",
      isEnabled: true,
    },
    {
      id: "failureReasonId2",
      title: "title2",
      description: "description2",
      isEnabled: false,
    },
  ];
  const dummyLiteConfigurationImpacts: LiteConfigurationImpact[] = [
    {
      id: configurationImpactId,
      title: "Configuration Impact 1 Title",
      owner: "Owner 1",
      guiltyChange: "Guilty Change for Configuration Impact 1",
      projectId: projectId,
    },
  ];
  const LITE_BINARY_REGRESSION_2 = {
    id: binaryRegressionId2,
    title: "Binary Regression 2 Title",
    mxVersion: "Binary mx version 2",
    defect: {
      id: "id",
      link: "link",
    },
    owner: "Binary Owner 2",
    fix: "Binary fix 2",
    projectId: "Binary project 2",
  };
  const LITE_BINARY_REGRESSION_1 = {
    id: binaryRegressionId,
    title: "Binary Regression 1 Title",
    mxVersion: "Binary mx version 1",
    defect: {
      id: "id",
      link: "link",
    },
    owner: "Binary Owner 1",
    fix: "Binary fix 1",
    projectId: "Binary project 1",
  };
  const dummyBinaryRegressions: LiteBinaryRegression[] = [
    LITE_BINARY_REGRESSION_1,
    LITE_BINARY_REGRESSION_2,
  ];

  beforeEach(async () => {
    toastMessageServiceMock = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    failureReasonsDataService = {
      getFailureReasons: jest.fn(() => of(dummyFailureReasons)),
    } as unknown as jest.Mocked<FailureReasonsDataService>;

    configurationImpactsService = {
      fetchByIds: jest.fn(() => of([])),
    } as unknown as jest.Mocked<ConfigurationImpactService>;

    configurationRegressionService = {
      fetchByIds: jest.fn(() => of([])),
    } as unknown as jest.Mocked<ConfigurationRegressionService>;

    binaryRegressionService = {
      fetchByIds: jest.fn(() => of([])),
    } as unknown as jest.Mocked<BinaryRegressionDataService>;

    binaryImpactService = {
      fetchByIds: jest.fn(() => of([])),
    } as unknown as jest.Mocked<BinaryImpactService>;

    analysisObjectLinks.set([]);

    stateService = {
      projectId: signal(projectId),
      scenarioExecutionId: signal(scenarioExecutionId),
      analysisObjectLinksLoading: signal(false),
      analysisObjectLinks: analysisObjectLinks,
      getScenarioExecutionAnalysisObjectLinks$: jest.fn(() => of([])),
      unlink: jest.fn(() => of([])),
    } as unknown as ScenarioExecutionStateManagementService;

    await TestBed.configureTestingModule({
      declarations: [ScenarioExecutionDetectionsComponent],
      providers: [
        ConfirmationService,
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({
              projectId,
              scenarioExecutionId,
            }),
          },
        },
        { provide: ToastMessageService, useValue: toastMessageServiceMock },
        {
          provide: FailureReasonsDataService,
          useValue: failureReasonsDataService,
        },
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: stateService,
        },
        {
          provide: ConfigurationImpactService,
          useValue: configurationImpactsService,
        },
        {
          provide: ConfigurationRegressionService,
          useValue: configurationRegressionService,
        },
        {
          provide: BinaryRegressionDataService,
          useValue: binaryRegressionService,
        },
        {
          provide: BinaryImpactService,
          useValue: binaryImpactService,
        },
      ],
      imports: [
        HeaderTitleModule,
        MockComponent(LinkedConfigurationRegressionDetailsTableComponent),
        MockComponent(LinkedConfigurationImpactDetailsTableComponent),
        MockComponent(LinkedBinaryRegressionDetailsTableComponent),
        MockComponent(LinkedBinaryImpactDetailsTableComponent),
        MockComponent(FailureReasonDetailsTableComponent),
        MockComponent(AnalysisObjectUnlinkModalComponent),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionDetectionsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
    expect(component).toBeDefined();
  });

  it("should refresh analysis object links when selected", () => {
    let refreshedAnalysisObjectLinks = false;
    jest
      .spyOn(stateService, "getScenarioExecutionAnalysisObjectLinks$")
      .mockImplementation(() => {
        return of([]).pipe(
          tap(() => {
            refreshedAnalysisObjectLinks = true;
          })
        );
      });
    component.isSelected = true;
    fixture.detectChanges();
    expect(
      stateService.getScenarioExecutionAnalysisObjectLinks$
    ).toHaveBeenCalled();
    expect(refreshedAnalysisObjectLinks).toBeTruthy();
  });

  it("should not refresh analysis object links when not selected", () => {
    component.isSelected = false;
    fixture.detectChanges();
    expect(
      stateService.getScenarioExecutionAnalysisObjectLinks$
    ).not.toHaveBeenCalled();
  });

  it("should have analysis object unlink modal", () => {
    const unlinkModal = fixture.debugElement.query(
      By.css("mxevolve-analysis-object-unlink-modal")
    );
    expect(unlinkModal).toBeTruthy();
  });

  describe("configuration impacts", () => {
    it("should fetch distinct scenario configuration impacts on initialization", () => {
      configurationImpactsService.fetchByIds.mockReturnValue(
        of(dummyLiteConfigurationImpacts)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationImpactsService.fetchByIds).toHaveBeenCalledWith(
        projectId,
        [configurationImpactId]
      );
      expect(component.configurationImpacts()).toEqual(
        dummyLiteConfigurationImpacts
      );
      expect(component.isConfigurationImpactTableLoading()).toBe(false);
    });

    it("should not fetch configuration impacts if the scenario does not have links to configuration impacts", () => {
      configurationImpactsService.fetchByIds.mockReturnValue(
        of(dummyLiteConfigurationImpacts)
      );

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationImpactsService.fetchByIds).not.toHaveBeenCalled();
      expect(component.configurationImpacts()).toEqual([]);
      expect(component.isConfigurationImpactTableLoading()).toBe(false);
    });

    it("should not attempt to fetch configuration impacts if analysis objects linked to the scenario are of different types", () => {
      configurationImpactsService.fetchByIds.mockReturnValue(
        of(dummyLiteConfigurationImpacts)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: incidentId,
          analysisObjectType: AnalysisObjectType.INCIDENT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationImpactsService.fetchByIds).not.toHaveBeenCalled();

      expect(component.configurationImpacts()).toEqual([]);
      expect(component.isConfigurationImpactTableLoading()).toBe(false);
    });

    it("should pass multiple configuration impact ids to be fetched if multiple configuration impacts are linked to the scenario", () => {
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationImpactId2,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationImpactsService.fetchByIds).toHaveBeenCalledWith(
        projectId,
        [configurationImpactId, configurationImpactId2]
      );
    });

    it("should reset the configuration impacts loading to false if analysis object links were updated to empty list", () => {
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      component.isSelected = true;
      fixture.detectChanges();
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(false);

      fixture.detectChanges();

      expect(component.isConfigurationImpactTableLoading()).toEqual(false);
    });

    it("should not fetch configuration impacts if the component is not selected", () => {
      component.isSelected = false;
      fixture.detectChanges();
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(configurationImpactsService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should set configuration impacts to loading and empty list if the analysis object links are loading", () => {
      component.isSelected = true;
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(component.isConfigurationImpactTableLoading()).toBe(true);
      expect(component.configurationImpacts()).toEqual([]);
      expect(configurationImpactsService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should stop listening to subscription in case the component is destroyed", () => {
      configurationImpactsService.fetchByIds.mockReturnValue(
        of(dummyLiteConfigurationImpacts)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);
      component.ngOnDestroy();
      component.isSelected = true;
      fixture.detectChanges();
      expect(configurationImpactsService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should handle error when fetching scenario configuration impacts", () => {
      component.analysisObjectLinks$ = throwError(() => new Error("error"));

      component.isSelected = true;
      fixture.detectChanges();

      expect(component.configurationImpacts()).toEqual([]);
      expect(component.isConfigurationImpactTableLoading()).toBe(false);
    });

    it("should display error when fetching scenario configuration impacts fails", () => {
      configurationImpactsService.fetchByIds.mockReturnValue(
        throwError(() => new Error("Error"))
      );
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        errorMessage
      );
    });
  });

  describe("binary regressions", () => {
    it("should fetch distinct scenario binary regressions on initialization", () => {
      binaryRegressionService.fetchByIds.mockReturnValue(
        of(dummyBinaryRegressions)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      const binaryRegressionIds = [binaryRegressionId];
      expect(binaryRegressionService.fetchByIds).toHaveBeenCalledWith(
        binaryRegressionIds
      );
      expect(component.binaryRegressions()).toEqual(dummyBinaryRegressions);
      expect(component.isBinaryRegressionTableLoading()).toBe(false);
    });

    it("should not fetch binary regressions if the scenario does not have links to binary regressions", () => {
      binaryRegressionService.fetchByIds.mockReturnValue(
        of(dummyBinaryRegressions)
      );

      component.isSelected = true;
      fixture.detectChanges();

      expect(binaryRegressionService.fetchByIds).not.toHaveBeenCalled();
      expect(component.binaryRegressions()).toEqual([]);
      expect(component.isBinaryRegressionTableLoading()).toBe(false);
    });

    it("should not attempt to fetch binary regressions if analysis objects linked to the scenario are of different types", () => {
      binaryRegressionService.fetchByIds.mockReturnValue(
        of(dummyBinaryRegressions)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: incidentId,
          analysisObjectType: AnalysisObjectType.INCIDENT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(binaryRegressionService.fetchByIds).not.toHaveBeenCalled();

      expect(component.binaryRegressions()).toEqual([]);
      expect(component.isBinaryRegressionTableLoading()).toBe(false);
    });

    it("should pass multiple binary regression ids to be fetched if multiple binary regressions are linked to the scenario", () => {
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: binaryRegressionId2,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      const binaryRegressionIds = [binaryRegressionId, binaryRegressionId2];
      expect(binaryRegressionService.fetchByIds).toHaveBeenCalledWith(
        binaryRegressionIds
      );
    });

    it("should reset the binary regressions loading to false if analysis object links were updated to empty list", () => {
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      component.isSelected = true;
      fixture.detectChanges();
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(false);

      fixture.detectChanges();

      expect(component.isBinaryRegressionTableLoading()).toEqual(false);
    });

    it("should not fetch binary regressions if the component is not selected", () => {
      component.isSelected = false;
      fixture.detectChanges();
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(binaryRegressionService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should set binary regressions to loading and empty list if the analysis object links are loading", () => {
      component.isSelected = true;
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(component.isBinaryRegressionTableLoading()).toBe(true);
      expect(component.binaryRegressions()).toEqual([]);
      expect(binaryRegressionService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should stop listening to subscription in case the component is destroyed", () => {
      binaryRegressionService.fetchByIds.mockReturnValue(
        of(dummyBinaryRegressions)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);
      component.ngOnDestroy();
      component.isSelected = true;
      fixture.detectChanges();
      expect(binaryRegressionService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should handle error when fetching scenario binary regressions", () => {
      binaryRegressionService.fetchByIds.mockReturnValue(
        throwError(() => new Error("Error"))
      );

      component.isSelected = true;

      expect(component.binaryRegressions()).toEqual([]);
      expect(component.isBinaryRegressionTableLoading()).toBe(false);
    });

    it("should display error when fetching scenario binary regressions fails", () => {
      binaryRegressionService.fetchByIds.mockReturnValue(
        throwError(() => new Error("Error"))
      );
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        errorMessage
      );
    });
  });

  describe("binary impacts", () => {
    it("should fetch distinct scenario binary impacts on initialization", () => {
      binaryImpactService.fetchByIds.mockReturnValue(of(dummyBinaryImpacts));

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(binaryImpactService.fetchByIds).toHaveBeenCalledWith(projectId, [
        binaryImpactId,
      ]);
      expect(component.binaryImpacts()).toEqual(dummyBinaryImpacts);
      expect(component.isBinaryImpactTableLoading()).toBe(false);
    });

    it("should not fetch binary impacts if the scenario does not have links to binary impacts", () => {
      binaryImpactService.fetchByIds.mockReturnValue(of(dummyBinaryImpacts));

      component.isSelected = true;
      fixture.detectChanges();

      expect(binaryImpactService.fetchByIds).not.toHaveBeenCalled();
      expect(component.binaryImpacts()).toEqual([]);
      expect(component.isBinaryImpactTableLoading()).toBe(false);
    });

    it("should not attempt to fetch binary impacts if analysis objects linked to the scenario are of different types", () => {
      binaryImpactService.fetchByIds.mockReturnValue(of(dummyBinaryImpacts));

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: incidentId,
          analysisObjectType: AnalysisObjectType.INCIDENT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(binaryImpactService.fetchByIds).not.toHaveBeenCalled();

      expect(component.binaryImpacts()).toEqual([]);
      expect(component.isBinaryImpactTableLoading()).toBe(false);
    });

    it("should pass multiple binary impact ids to be fetched if multiple binary impacts are linked to the scenario", () => {
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: binaryImpactId2,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(binaryImpactService.fetchByIds).toHaveBeenCalledWith(projectId, [
        binaryImpactId,
        binaryImpactId2,
      ]);
    });

    it("should reset the binary impacts loading to false if analysis object links were updated to empty list", () => {
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      component.isSelected = true;
      fixture.detectChanges();
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(false);

      fixture.detectChanges();

      expect(component.isBinaryImpactTableLoading()).toEqual(false);
    });

    it("should not fetch binary impacts if the component is not selected", () => {
      component.isSelected = false;
      fixture.detectChanges();
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(binaryImpactService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should set binary impacts to loading and empty list if the analysis object links are loading", () => {
      component.isSelected = true;
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(component.isBinaryImpactTableLoading()).toBe(true);
      expect(component.binaryImpacts()).toEqual([]);
      expect(binaryImpactService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should stop listening to subscription in case the component is destroyed", () => {
      binaryImpactService.fetchByIds.mockReturnValue(of(dummyBinaryImpacts));

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);
      component.ngOnDestroy();
      component.isSelected = true;
      fixture.detectChanges();
      expect(binaryImpactService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should handle error when fetching scenario binary impacts", () => {
      binaryImpactService.fetchByIds.mockReturnValue(
        throwError(() => new Error("Error"))
      );

      component.isSelected = true;

      expect(component.binaryImpacts()).toEqual([]);
      expect(component.isBinaryImpactTableLoading()).toBe(false);
    });

    it("should display error when fetching scenario binary impacts fails", () => {
      binaryImpactService.fetchByIds.mockReturnValue(
        throwError(() => new Error("Error"))
      );
      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        errorMessage
      );
    });
  });

  describe("configuration regressions", () => {
    it("should fetch distinct scenario configuration regressions on initialization", () => {
      configurationRegressionService.fetchByIds.mockReturnValue(
        of(dummyConfigurationRegressions)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationRegressionService.fetchByIds).toHaveBeenCalledWith(
        projectId,
        [configurationRegressionId]
      );
      expect(component.configurationRegressions()).toEqual(
        dummyConfigurationRegressions
      );
      expect(component.isConfigurationRegressionTableLoading()).toBe(false);
    });

    it("should not fetch configuration regressions if the scenario does not have links to configuration regressions", () => {
      configurationRegressionService.fetchByIds.mockReturnValue(
        of(dummyConfigurationRegressions)
      );

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationRegressionService.fetchByIds).not.toHaveBeenCalled();
      expect(component.configurationRegressions()).toEqual([]);
      expect(component.isConfigurationRegressionTableLoading()).toBe(false);
    });

    it("should not attempt to fetch configuration regressions if analysis objects linked to the scenario are of different types", () => {
      configurationRegressionService.fetchByIds.mockReturnValue(
        of(dummyConfigurationRegressions)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: binaryRegressionId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: incidentId,
          analysisObjectType: AnalysisObjectType.INCIDENT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationRegressionService.fetchByIds).not.toHaveBeenCalled();

      expect(component.configurationRegressions()).toEqual([]);
      expect(component.isConfigurationRegressionTableLoading()).toBe(false);
    });

    it("should pass multiple configuration regression ids to be fetched if multiple configuration regressions are linked to the scenario", () => {
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationRegressionId2,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(configurationRegressionService.fetchByIds).toHaveBeenCalledWith(
        projectId,
        [configurationRegressionId, configurationRegressionId2]
      );
    });

    it("should reset the configuration regressions loading to false if analysis object links were updated to empty list", () => {
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      component.isSelected = true;
      fixture.detectChanges();
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(false);

      fixture.detectChanges();

      expect(component.isConfigurationRegressionTableLoading()).toEqual(false);
    });

    it("should not fetch configuration regressions if the component is not selected", () => {
      component.isSelected = false;
      fixture.detectChanges();
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(configurationRegressionService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should set configuration regressions to loading and empty list if the analysis object links are loading", () => {
      component.isSelected = true;
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(component.isConfigurationRegressionTableLoading()).toBe(true);
      expect(component.configurationRegressions()).toEqual([]);
      expect(configurationRegressionService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should stop listening to subscription in case the component is destroyed", () => {
      configurationRegressionService.fetchByIds.mockReturnValue(
        of(dummyConfigurationRegressions)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);
      component.ngOnDestroy();
      component.isSelected = true;
      fixture.detectChanges();
      expect(configurationRegressionService.fetchByIds).not.toHaveBeenCalled();
    });

    it("should handle error when fetching scenario configuration regressions", () => {
      component.analysisObjectLinks$ = throwError(() => new Error("error"));

      component.isSelected = true;
      fixture.detectChanges();

      expect(component.configurationRegressions()).toEqual([]);
      expect(component.isConfigurationRegressionTableLoading()).toBe(false);
    });

    it("should display error when fetching scenario configuration regressions fails", () => {
      configurationRegressionService.fetchByIds.mockReturnValue(
        throwError(() => new Error("Error"))
      );
      analysisObjectLinks.set([
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        errorMessage
      );
    });

    it("should handle error when fetching scenario configuration regressions", () => {
      configurationRegressionService.fetchByIds.mockReturnValueOnce(
        throwError(() => new Error("Error"))
      );
      component.isSelected = true;
      fixture.detectChanges();
      expect(component.isConfigurationRegressionTableLoading()).toBe(false);
      expect(component.configurationRegressions()).toEqual([]);
      expect(component.isSelected).toBeTruthy();
    });
  });

  describe.each([
    [AnalysisObjectType.CONFIGURATION_IMPACT, configurationImpactId],
    [AnalysisObjectType.BINARY_REGRESSION, binaryRegressionId],
    [AnalysisObjectType.BINARY_IMPACT, binaryImpactId],
    [AnalysisObjectType.CONFIGURATION_REGRESSION, configurationRegressionId],
  ])("unlinking %s", (analysisObjectType, analysisObjectId) => {
    it("should set modal visible to true when unlink request is received", () => {
      component.openUnlinkModal(analysisObjectId, analysisObjectType);
      fixture.detectChanges();
      const unlinkModal = fixture.debugElement.query(
        By.css("mxevolve-analysis-object-unlink-modal")
      );
      expect(unlinkModal.componentInstance.isVisible).toEqual(true);
    });

    it("should set modal analysis object type to the correct one", () => {
      component.openUnlinkModal(analysisObjectId, analysisObjectType);
      fixture.detectChanges();
      const unlinkModal = fixture.debugElement.query(
        By.css("mxevolve-analysis-object-unlink-modal")
      );
      expect(unlinkModal.componentInstance.analysisObjectType).toEqual(
        analysisObjectType
      );
    });

    it("should set analysis object id in the unlink modal", () => {
      component.openUnlinkModal(analysisObjectId, analysisObjectType);
      fixture.detectChanges();
      const unlinkModal = fixture.debugElement.query(
        By.css("mxevolve-analysis-object-unlink-modal")
      );
      expect(unlinkModal.componentInstance.analysisObjectId).toEqual(
        analysisObjectId
      );
    });
  });

  describe("failure reasons", () => {
    it("should fetch distinct scenario failure reasons on initialization", () => {
      const failureReasonId1 = "failureReasonId1";
      const failureReasonId2 = "failureReasonId2";
      failureReasonsDataService.getFailureReasons.mockReturnValue(
        of([
          {
            id: failureReasonId1,
          } as unknown as FailureReason,
          {
            id: failureReasonId2,
          } as unknown as FailureReason,
        ])
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: failureReasonId1,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: failureReasonId1,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(failureReasonsDataService.getFailureReasons).toHaveBeenCalled();
      expect(component.failureReasons()).toEqual([
        {
          id: failureReasonId1,
        } as unknown as FailureReason,
      ]);
    });

    it("should set the loading to false after fetching failure reasons", () => {
      failureReasonsDataService.getFailureReasons.mockReturnValue(
        of(dummyFailureReasons)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(component.isFailureReasonsTableLoading()).toBe(false);
    });

    it("should not fetch failure reasons if no analysis objects are linked to the scenario", () => {
      component.analysisObjectLinks$ = of([]);
      failureReasonsDataService.getFailureReasons.mockReturnValue(
        of(dummyFailureReasons)
      );

      component.isSelected = true;
      fixture.detectChanges();

      expect(
        failureReasonsDataService.getFailureReasons
      ).not.toHaveBeenCalled();
      expect(component.failureReasons()).toEqual([]);
      expect(component.isFailureReasonsTableLoading()).toBe(false);
    });

    it("should not fetch failure reasons if analysis objects linked to the scenario are from different types", () => {
      failureReasonsDataService.getFailureReasons.mockReturnValue(
        of(dummyFailureReasons)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: binaryImpactId,
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationImpactId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: configurationRegressionId,
          analysisObjectType: AnalysisObjectType.CONFIGURATION_REGRESSION,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: incidentId,
          analysisObjectType: AnalysisObjectType.INCIDENT,
        } as unknown as AnalysisObjectLink,
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.BINARY_REGRESSION,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(
        failureReasonsDataService.getFailureReasons
      ).not.toHaveBeenCalled();
      expect(component.failureReasons()).toEqual([]);
      expect(component.isFailureReasonsTableLoading()).toBe(false);
    });

    it("should reset the failure reasons loading to false if analysis object links were updated to empty list", () => {
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      component.isSelected = true;
      fixture.detectChanges();
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(false);

      fixture.detectChanges();

      expect(component.isFailureReasonsTableLoading()).toEqual(false);
    });

    it("should not fetch failure reasons if the component is not selected", () => {
      component.isSelected = false;
      fixture.detectChanges();
      analysisObjectLinks.set([
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(
        failureReasonsDataService.getFailureReasons
      ).not.toHaveBeenCalled();
    });

    it("should set failure reasons to loading if the analysis object links are loading", () => {
      component.isSelected = true;
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      analysisObjectLinks.set([
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(component.isFailureReasonsTableLoading()).toBe(true);
    });

    it("should set failure reasons to empty list if the analysis object links are loading", () => {
      component.isSelected = true;
      (
        stateService.analysisObjectLinksLoading as unknown as WritableSignal<boolean>
      ).set(true);
      analysisObjectLinks.set([
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);
      fixture.detectChanges();
      expect(component.failureReasons()).toEqual([]);
    });

    it("should stop listening to subscription in case the component is destroyed", () => {
      failureReasonsDataService.getFailureReasons.mockReturnValue(
        of(dummyFailureReasons)
      );

      analysisObjectLinks.set([
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);
      component.ngOnDestroy();
      component.isSelected = true;
      fixture.detectChanges();
      expect(
        failureReasonsDataService.getFailureReasons
      ).not.toHaveBeenCalled();
    });

    it("should handle error when fetching scenario failure reasons", () => {
      failureReasonsDataService.getFailureReasons.mockReturnValue(
        throwError(() => new Error("Error"))
      );

      component.isSelected = true;

      expect(component.failureReasons()).toEqual([]);
      expect(component.isFailureReasonsTableLoading()).toBe(false);
    });

    it("should display error when fetching scenario failure reasons fails", () => {
      failureReasonsDataService.getFailureReasons.mockReturnValue(
        throwError(() => new Error("Error"))
      );
      analysisObjectLinks.set([
        {
          analysisObjectId: failureReasonId,
          analysisObjectType: AnalysisObjectType.FAILURE_REASON,
        } as unknown as AnalysisObjectLink,
      ]);

      component.isSelected = true;
      fixture.detectChanges();

      expect(toastMessageServiceMock.showError).toHaveBeenCalledWith(
        errorMessage
      );
    });
  });
});
