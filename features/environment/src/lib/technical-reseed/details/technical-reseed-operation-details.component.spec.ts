import { TestBed } from "@angular/core/testing";
import { TechnicalReseedOperationDetailsComponent } from "./technical-reseed-operation-details.component";
import { Store } from "@ngrx/store";
import { ExecutionGroupsState } from "../../store/execution-group/execution-group.state";
import { of, Subject } from "rxjs";
import {
  ExecutionGroup,
  ExecutionGroupStatus,
} from "../execution-group-models";
import {
  TechnicalReseedOperation,
  TechnicalReseedOperationDetails,
  TechnicalReseedStatusEnum,
} from "../technical-reseed-models";
import { EnvironmentDefinitionsState } from "../../store/environment-definition/environment-definitions.state";
import {
  dropEnvironmentDefinitionsDetails,
  retrieveEnvironmentDefinitions,
} from "../../store/environment-definition/environment-definitions.action";

const PROJECT_ID = "projectId";
const EXECUTION_GROUP_ID = "executionGroupId";
const TECHNICAL_RESEED_ID = "technicalReseedId";
const ENVIRONMENT_DEFINITION_ID = "definitionId";

describe("TechnicalReseedOperationDetailsComponent", () => {
  let component: TechnicalReseedOperationDetailsComponent;
  let store: Store<unknown>;

  beforeEach(async () => {
    store = {
      select: jest
        .fn()
        .mockReturnValueOnce(of(getEnvironmentDefinitions()))
        .mockReturnValueOnce(
          of(getExecutionGroup(TechnicalReseedStatusEnum.RUNNING))
        ),
      dispatch: jest.fn(),
    } as unknown as Store<unknown>;

    await TestBed.configureTestingModule({
      providers: [
        TechnicalReseedOperationDetailsComponent,
        { provide: Store<ExecutionGroupsState>, useValue: store },
        { provide: Store<EnvironmentDefinitionsState>, useValue: store },
      ],
    }).compileComponents();

    component = TestBed.inject(TechnicalReseedOperationDetailsComponent);
    component.projectId = PROJECT_ID;
    component.executionGroupId = EXECUTION_GROUP_ID;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should dispatch retrieve environment definitions on init", () => {
    component.ngOnInit();
    expect(store.dispatch).toHaveBeenCalledWith(
      retrieveEnvironmentDefinitions({
        projectId: PROJECT_ID,
      })
    );
  });

  it("should select the environment definitions on init", () => {
    component.ngOnInit();
    expect(store.select).toHaveBeenCalled();
    expect(component.environmentDefinitions).toStrictEqual(
      getEnvironmentDefinitions()
    );
  });

  it("should set the icon and severity to info for running operations", () => {
    component.ngOnInit();
    expect(store.select).toHaveBeenCalled();
    const details: TechnicalReseedOperationDetails[] = getDetails(
      TechnicalReseedStatusEnum.RUNNING,
      "info",
      "pi pi-spinner pi-spin"
    );
    details[0].isContainerCollapsed = false;
    expect(component.technicalReseedOperations).toStrictEqual(details);
  });

  it("should set the icon and severity to secondary for pending operations", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    selectMock
      .mockReturnValueOnce(of(getEnvironmentDefinitions()))
      .mockReturnValueOnce(
        of(getExecutionGroup(TechnicalReseedStatusEnum.PENDING))
      );
    component.ngOnInit();
    expect(component.technicalReseedOperations).toStrictEqual(
      getDetails(TechnicalReseedStatusEnum.PENDING, "secondary", "pi pi-pause")
    );
  });

  it("should set the icon and severity to success for passed operations", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    selectMock
      .mockReturnValueOnce(of(getEnvironmentDefinitions()))
      .mockReturnValueOnce(
        of(getExecutionGroup(TechnicalReseedStatusEnum.PASSED))
      );
    component.ngOnInit();
    expect(component.technicalReseedOperations).toStrictEqual(
      getDetails(TechnicalReseedStatusEnum.PASSED, "success", "pi pi-check")
    );
  });

  it("should set the icon and severity to danger for failed operations", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    selectMock
      .mockReturnValueOnce(of(getEnvironmentDefinitions()))
      .mockReturnValueOnce(
        of(getExecutionGroup(TechnicalReseedStatusEnum.FAILED))
      );
    component.ngOnInit();
    expect(component.technicalReseedOperations).toStrictEqual(
      getDetails(TechnicalReseedStatusEnum.FAILED, "danger", "pi pi-times")
    );
  });

  it("should set the icon and severity to warn for aborted operations", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    selectMock
      .mockReturnValueOnce(of(getEnvironmentDefinitions()))
      .mockReturnValueOnce(
        of(getExecutionGroup(TechnicalReseedStatusEnum.ABORTED))
      );
    component.ngOnInit();
    expect(component.technicalReseedOperations).toStrictEqual(
      getDetails(
        TechnicalReseedStatusEnum.ABORTED,
        "warn",
        "pi pi-exclamation-triangle"
      )
    );
  });

  it("should set has operations to false if the group does not have technical reseed operations", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    selectMock
      .mockReturnValueOnce(of(getEnvironmentDefinitions()))
      .mockReturnValueOnce(
        of({
          isLimitReached: false,
          status: ExecutionGroupStatus.ENABLED,
          executionGroupId: EXECUTION_GROUP_ID,
          technicalReseedOperations: [],
        })
      );
    component.ngOnInit();
    expect(component.hasOperations).toBe(false);
  });

  it("should sort the operations by createdOn descending", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    const listReseeds: TechnicalReseedOperation[] = [
      getSortingDetails("2025-11-13T17:20:10.456Z", "id1"),
      getSortingDetails("2025-11-14T08:45:30.123Z", "id2"),
    ];

    selectMock
      .mockReturnValueOnce(of(getEnvironmentDefinitions()))
      .mockReturnValueOnce(
        of({
          isLimitReached: false,
          status: ExecutionGroupStatus.ENABLED,
          executionGroupId: EXECUTION_GROUP_ID,
          technicalReseedOperations: listReseeds,
        })
      );

    component.ngOnInit();

    const ids = component.technicalReseedOperations.map((o) => o.id);
    expect(ids).toEqual(["id2", "id1"]);
  });

  it("should collapse the panel if the operation is not running", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    selectMock
      .mockReturnValueOnce(of(getEnvironmentDefinitions()))
      .mockReturnValueOnce(
        of(getExecutionGroup(TechnicalReseedStatusEnum.PASSED))
      );
    component.ngOnInit();
    expect(component.technicalReseedOperations[0].isContainerCollapsed).toBe(
      true
    );
  });

  it("should unsubscribe from the observable on destroy", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    const subject = new Subject();
    selectMock
      .mockReturnValueOnce(subject.asObservable())
      .mockReturnValueOnce(subject.asObservable());

    component.ngOnInit();
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  it("should drop environment definitions on destroy", () => {
    component.ngOnDestroy();
    expect(store.dispatch).toHaveBeenCalledWith(
      dropEnvironmentDefinitionsDetails({ projectId: PROJECT_ID })
    );
  });

  describe("canShowDialog", () => {
    it("should return true for RUNNING status with progressMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.RUNNING,
        progressMessage: "Running: 50% complete",
      });
      expect(component.canShowDialog(operation)).toBe(true);
    });

    it("should return false for RUNNING status without progressMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.RUNNING,
      });
      expect(component.canShowDialog(operation)).toBe(false);
    });

    it("should return true for FAILED status with resultMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.FAILED,
        resultMessage: "Failed due to error XYZ",
      });
      expect(component.canShowDialog(operation)).toBe(true);
    });

    it("should return false for FAILED status without resultMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.FAILED,
      });
      expect(component.canShowDialog(operation)).toBe(false);
    });

    it("should return false for PASSED status", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.PASSED,
      });
      expect(component.canShowDialog(operation)).toBe(false);
    });

    it("should return false for PENDING status", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.PENDING,
      });
      expect(component.canShowDialog(operation)).toBe(false);
    });
  });

  describe("onStatusClicked", () => {
    it("should open dialog with progressMessage when RUNNING status is clicked with progressMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.RUNNING,
        progressMessage: "Running: 50% complete",
      });

      component.onStatusClicked(operation);

      expect(component.isDialogVisible).toBe(true);
      expect(component.dialogContent).toBe("Running: 50% complete");
      expect(component.selectedOperation).toBe(operation);
    });

    it("should not open dialog when RUNNING status is clicked without progressMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.RUNNING,
      });

      component.onStatusClicked(operation);

      expect(component.isDialogVisible).toBe(false);
      expect(component.dialogContent).toBeNull();
    });

    it("should open dialog with resultMessage when FAILED status is clicked with resultMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.FAILED,
        resultMessage: "Failed due to error XYZ",
      });

      component.onStatusClicked(operation);

      expect(component.isDialogVisible).toBe(true);
      expect(component.dialogContent).toBe("Failed due to error XYZ");
      expect(component.selectedOperation).toBe(operation);
    });

    it("should not open dialog when FAILED status is clicked without resultMessage", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.FAILED,
      });

      component.onStatusClicked(operation);

      expect(component.isDialogVisible).toBe(false);
      expect(component.dialogContent).toBeNull();
    });

    it("should not open dialog when PASSED status is clicked", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.PASSED,
      });

      component.onStatusClicked(operation);

      expect(component.isDialogVisible).toBe(false);
      expect(component.dialogContent).toBeNull();
    });

    it("should not open dialog when ABORTED status is clicked", () => {
      const operation = createOperation({
        status: TechnicalReseedStatusEnum.ABORTED,
      });

      component.onStatusClicked(operation);

      expect(component.isDialogVisible).toBe(false);
      expect(component.dialogContent).toBeNull();
    });
  });

  describe("hideDialog", () => {
    it("should hide dialog and clear content when called", () => {
      component.isDialogVisible = true;
      component.dialogContent = "Some message";

      component.hideDialog();

      expect(component.isDialogVisible).toBe(false);
      expect(component.dialogContent).toBeNull();
    });
  });

  function getExecutionGroup(
    status: TechnicalReseedStatusEnum
  ): ExecutionGroup {
    return {
      launchesAllowed: true,
      status: ExecutionGroupStatus.ENABLED,
      executionGroupId: EXECUTION_GROUP_ID,
      technicalReseedOperations: [
        {
          id: TECHNICAL_RESEED_ID,
          status: status,
          branch: "branch",
          sourceCommit: "sourceCommit",
          validationLevel: "validationLevel",
          maintenanceLevel: "FULL",
          environmentDefinitionId: ENVIRONMENT_DEFINITION_ID,
          dumpIds: ["dump1", "dump2"],
          environmentId: "environmentId",
          createdOn: "createdOn",
          resultMessage: "resultMessage",
          progressMessage: "progressMessage",
        },
      ],
    };
  }

  function getDetails(
    status: TechnicalReseedStatusEnum,
    severity: "success" | "secondary" | "info" | "warn" | "danger",
    icon: string
  ): TechnicalReseedOperationDetails[] {
    return [
      {
        statusTagIcon: icon,
        statusTagSeverity: severity,
        id: TECHNICAL_RESEED_ID,
        status: status,
        branch: "branch",
        sourceCommit: "sourceCommit",
        validationLevel: "validationLevel",
        maintenanceLevel: "FULL",
        environmentDefinitionId: ENVIRONMENT_DEFINITION_ID,
        createdOn: "createdOn",
        dumpIds: ["dump1", "dump2"],
        resultMessage: "resultMessage",
        progressMessage: "progressMessage",
        environmentDefinitionName: "environmentDefinitionName",
        environmentId: "environmentId",
        isContainerCollapsed: true,
      },
    ];
  }

  function getSortingDetails(
    createdOn: string,
    id: string
  ): TechnicalReseedOperation {
    return {
      branch: "branch",
      createdOn: createdOn,
      environmentDefinitionId: ENVIRONMENT_DEFINITION_ID,
      id: id,
      maintenanceLevel: "custom",
      sourceCommit: "commitId",
      status: TechnicalReseedStatusEnum.FAILED,
    };
  }

  function createOperation(
    overrides: Partial<TechnicalReseedOperationDetails> = {}
  ): TechnicalReseedOperationDetails {
    const defaults: TechnicalReseedOperationDetails = {
      id: "op-default",
      status: TechnicalReseedStatusEnum.PENDING,
      branch: "branch",
      sourceCommit: "sourceCommit",
      validationLevel: "validationLevel",
      maintenanceLevel: "FULL",
      environmentDefinitionId: ENVIRONMENT_DEFINITION_ID,
      environmentDefinitionName: "environmentDefinitionName",
      dumpIds: ["dump1", "dump2"],
      environmentId: "environmentId",
      statusTagIcon: "pi pi-pause",
      statusTagSeverity: "secondary",
      isContainerCollapsed: true,
    } as TechnicalReseedOperationDetails;

    return { ...defaults, ...overrides } as TechnicalReseedOperationDetails;
  }

  function getEnvironmentDefinitions() {
    return [
      {
        id: ENVIRONMENT_DEFINITION_ID,
        name: "environmentDefinitionName",
        status: "status",
      },
    ];
  }
});
