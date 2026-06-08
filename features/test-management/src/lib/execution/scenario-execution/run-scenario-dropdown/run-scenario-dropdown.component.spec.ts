import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { RunScenarioDropdownComponent } from "./run-scenario-dropdown.component";
import { Store } from "@ngrx/store";
import { of, throwError } from "rxjs";
import { ScenarioDefinitionService } from "../../../definition/scenario-definition/scenario-definition.service";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { RejectionReasonMapperService } from "../actions/repush/rejection-reason-mapper/rejection-reason-mapper.service";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ScenarioExecutionGroupActionPermissionApiModel } from "../model/scenario-execution-group-action-permission-api-model";
import { ScenarioDefinitionSingleSelectorComponent } from "@mxflow/test-management/definition";

describe("RunScenarioDropdownComponent", () => {
  let component: RunScenarioDropdownComponent;
  let fixture: ComponentFixture<RunScenarioDropdownComponent>;
  let mockStore: jest.Mocked<Store>;
  let mockScenarioDefinitionService: jest.Mocked<ScenarioDefinitionService>;
  let mockScenarioExecutionService: jest.Mocked<ScenarioExecutionService>;
  let mockRejectionReasonMapper: jest.Mocked<RejectionReasonMapperService>;

  const projectId = "projectId";
  const subContextId = "subContextId";
  const branchName = "branchName";
  const executionGroupId = "scenarioExecutionGroupId";
  const warningMessageMap = { WARNING_KEY: "Warning message" };

  const mockScenarioDefinitions = [
    { id: "scenarioDefinitionId1", name: "scenario_name_1" },
    { id: "scenarioDefinitionId2", name: "Scenario_name_2" },
  ];

  const mockScenarioExecutionEligibility = {
    actionAllowed: true,
    rejectionReasons: [],
    warnings: [],
  } as unknown as ScenarioExecutionGroupActionPermissionApiModel;

  beforeEach(async () => {
    mockStore = {
      select: jest.fn().mockReturnValue(of(projectId)),
    } as unknown as jest.Mocked<Store>;

    mockScenarioDefinitionService = {
      getScenarioDefinitions: jest
        .fn()
        .mockReturnValue(of(mockScenarioDefinitions)),
    } as unknown as jest.Mocked<ScenarioDefinitionService>;

    mockScenarioExecutionService = {
      isExecutionAllowed: jest
        .fn()
        .mockReturnValue(of(mockScenarioExecutionEligibility)),
      runScenario: jest.fn().mockReturnValue(of({})),
    } as unknown as jest.Mocked<ScenarioExecutionService>;

    mockRejectionReasonMapper = {
      map: jest.fn().mockReturnValue("Rejection message"),
    } as unknown as jest.Mocked<RejectionReasonMapperService>;

    await TestBed.configureTestingModule({
      imports: [RunScenarioDropdownComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Store, useValue: mockStore },
        {
          provide: ScenarioDefinitionService,
          useValue: mockScenarioDefinitionService,
        },
        {
          provide: ScenarioExecutionService,
          useValue: mockScenarioExecutionService,
        },
        {
          provide: RejectionReasonMapperService,
          useValue: mockRejectionReasonMapper,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(RunScenarioDropdownComponent, {
        remove: {
          imports: [ScenarioDefinitionSingleSelectorComponent],
          providers: [
            ScenarioDefinitionService,
            ScenarioExecutionService,
            RejectionReasonMapperService,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RunScenarioDropdownComponent);
    component = fixture.componentInstance;

    component.subContextId = subContextId;
    component.branchName = branchName;
    component.executionGroupId = executionGroupId;
    component.warningMessageMap = warningMessageMap;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize form on ngOnInit", fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.runScenarioForm).toBeDefined();
    expect(component.runScenarioForm.get("scenarioDefinitionId")).toBeTruthy();
  }));

  it("should have scenarioDefinitionId as null on init", fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(
      component.runScenarioForm.get("scenarioDefinitionId")?.value
    ).toBeNull();
  }));

  it("should have scenarioDefinitionId field with required validator", fakeAsync(() => {
    component.ngOnInit();
    tick();
    const scenarioDefinitionIdControl = component.runScenarioForm.get(
      "scenarioDefinitionId"
    );

    scenarioDefinitionIdControl?.setValue(null);
    expect(scenarioDefinitionIdControl?.valid).toBe(false);
    expect(scenarioDefinitionIdControl?.errors?.["required"]).toBeTruthy();

    scenarioDefinitionIdControl?.setValue("scenarioDefinitionId1");
    expect(scenarioDefinitionIdControl?.valid).toBe(true);
    expect(scenarioDefinitionIdControl?.errors).toBeNull();
  }));

  it("should load scenario definitions on init", fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(
      mockScenarioDefinitionService.getScenarioDefinitions
    ).toHaveBeenCalledWith(projectId);
    expect(component.scenarioDefinitions).toEqual(mockScenarioDefinitions);
    expect(component.isLoading).toBe(false);
  }));

  it("should check execution permission on init", fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(
      mockScenarioExecutionService.isExecutionAllowed
    ).toHaveBeenCalledWith(projectId, executionGroupId);
    expect(component.isExecutionAllowed).toBe(true);
  }));

  it("should disable form when execution is not allowed", fakeAsync(() => {
    mockScenarioExecutionService.isExecutionAllowed.mockReturnValue(
      of({
        actionAllowed: false,
        rejectionReasons: ["REASON_1"],
        warnings: [],
      } as unknown as ScenarioExecutionGroupActionPermissionApiModel)
    );

    component.ngOnInit();
    tick();
    expect(component.isExecutionAllowed).toBe(false);
    expect(
      component.runScenarioForm.get("scenarioDefinitionId")?.disabled
    ).toBe(true);
  }));

  it("should set rejection message when there are rejection reasons", fakeAsync(() => {
    mockScenarioExecutionService.isExecutionAllowed.mockReturnValue(
      of({
        actionAllowed: false,
        rejectionReasons: ["REASON_1"],
        warnings: [],
      } as unknown as ScenarioExecutionGroupActionPermissionApiModel)
    );

    component.ngOnInit();
    tick();
    expect(mockRejectionReasonMapper.map).toHaveBeenCalledWith(["REASON_1"]);
    expect(component.rejectionReasonMessage).toBe("Rejection message");
  }));

  it("should set warning message when there are warnings", fakeAsync(() => {
    mockScenarioExecutionService.isExecutionAllowed.mockReturnValue(
      of({
        actionAllowed: true,
        rejectionReasons: [],
        warnings: ["WARNING_KEY"],
      } as unknown as ScenarioExecutionGroupActionPermissionApiModel)
    );

    component.ngOnInit();
    tick();
    expect(component.warningMessage).toBe("Warning message");
  }));

  it("should emit error when loading fails", fakeAsync(() => {
    const errorSpy = jest.spyOn(component.errorEventEmitter, "emit");
    mockScenarioExecutionService.isExecutionAllowed.mockReturnValue(
      throwError(() => new Error("Test error"))
    );

    component.ngOnInit();
    tick();
    expect(errorSpy).toHaveBeenCalledWith("Test error");
    expect(component.isLoading).toBe(false);
  }));

  it("should open modal when enableKeepServices is true", () => {
    component.enableKeepServices = true;
    component.runScenarioExecution();
    expect(component.showModal).toBe(true);
  });

  it("should run scenario directly when enableKeepServices is false", fakeAsync(() => {
    component.enableKeepServices = false;
    component.ngOnInit();
    tick();
    component.runScenarioForm
      .get("scenarioDefinitionId")
      ?.setValue("scenario-1");

    component.runScenarioExecution();
    tick();

    expect(mockScenarioExecutionService.runScenario).toHaveBeenCalled();
  }));

  it("should close modal and reset keepServices", () => {
    component.showModal = true;
    component.keepServices = true;

    component.closeModal();

    expect(component.showModal).toBe(false);
    expect(component.keepServices).toBe(false);
  });

  it("should update keepServices on checkbox change", () => {
    component.onCheckKeepServicesChanged(true);
    expect(component.keepServices).toBe(true);

    component.onCheckKeepServicesChanged(false);
    expect(component.keepServices).toBe(false);
  });

  it("should emit scenarioPushed when scenario runs successfully", fakeAsync(() => {
    const scenarioPushedSpy = jest.spyOn(component.scenarioPushed, "emit");
    component.ngOnInit();
    tick();
    component.runScenarioForm
      .get("scenarioDefinitionId")
      ?.setValue("scenario-1");

    component.runScenario();
    tick();

    expect(scenarioPushedSpy).toHaveBeenCalled();
  }));

  it("should emit error when scenario run fails", fakeAsync(() => {
    const errorSpy = jest.spyOn(component.errorEventEmitter, "emit");
    mockScenarioExecutionService.runScenario.mockReturnValue(
      throwError(() => new Error("Run failed"))
    );

    component.ngOnInit();
    tick();
    component.runScenarioForm
      .get("scenarioDefinitionId")
      ?.setValue("scenario-1");

    component.runScenario();
    tick();

    expect(errorSpy).toHaveBeenCalledWith("Run failed");
  }));

  it("should build correct run scenario request", fakeAsync(() => {
    component.ngOnInit();
    tick();
    component.projectId = projectId;
    component.runScenarioForm
      .get("scenarioDefinitionId")
      ?.setValue("scenario-1");
    component.machineGroupId = "machine-group-1";
    component.keepServices = true;
    component.disableConfigurationEditor = false;
    component.supportReconActivities = false;
    component.qualityLevel = "CQG";
    component.validationScopeEnabled = true;
    component.incidentEnabled = true;

    component.runScenario();
    tick();

    expect(mockScenarioExecutionService.runScenario).toHaveBeenCalledWith(
      projectId,
      expect.objectContaining({
        scenarioDefinitionId: "scenario-1",
        subContextId: subContextId,
        branchName: branchName,
        executionGroupId: executionGroupId,
        machineGroupId: "machine-group-1",
        stopServices: false,
        disableConfigurationEditor: false,
        supportReconActivities: false,
        validationScopeEnabled: true,
        incidentEnabled: true,
        qualityLevel: "CQG",
      })
    );
  }));

  it("should build run scenario request with false supportReconActivities when not provided", fakeAsync(() => {
    component.ngOnInit();
    tick();
    component.projectId = projectId;
    component.runScenarioForm
      .get("scenarioDefinitionId")
      ?.setValue("scenario-1");
    component.supportReconActivities = undefined;

    component.runScenario();
    tick();

    expect(mockScenarioExecutionService.runScenario).toHaveBeenCalledWith(
      projectId,
      expect.objectContaining({
        supportReconActivities: false,
      })
    );
  }));

  it("should complete destroy$ subject on ngOnDestroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "complete");
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });
});
