import { TestBed } from "@angular/core/testing";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Store } from "@ngrx/store";
import { of, Subject } from "rxjs";
import { TechnicalReseedStatusEnum } from "../technical-reseed-models";
import {
  ExecutionGroup,
  ExecutionGroupStatus,
} from "../execution-group-models";
import { ExecutionGroupsState } from "../../store/execution-group/execution-group.state";
import { LaunchTechnicalReseedComponent } from "./launch-technical-reseed.component";

const PROJECT_ID = "projectId";
const EXECUTION_GROUP_ID = "executionGroupId";

describe("Launch Technical Reseed Button Component", () => {
  let toastService: ToastMessageService;
  let store: Store<ExecutionGroupsState>;
  let component: LaunchTechnicalReseedComponent;

  beforeEach(() => {
    toastService = {
      showSuccess: jest.fn(() => {}),
      showError: jest.fn(() => {}),
    } as unknown as ToastMessageService;

    store = {
      select: jest.fn().mockReturnValue(of(getExecutionGroup())),
    } as unknown as Store<ExecutionGroupsState>;

    TestBed.configureTestingModule({
      providers: [
        LaunchTechnicalReseedComponent,
        { provide: ToastMessageService, useValue: toastService },
        { provide: Store<ExecutionGroupsState>, useValue: store },
      ],
    });

    component = TestBed.inject(LaunchTechnicalReseedComponent);
    component.projectId = PROJECT_ID;
  });

  it("should select the execution group details on init", () => {
    component.ngOnInit();
    expect(store.select).toHaveBeenCalled();
  });

  it("should disable the button if launches are not allowed", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        launchesAllowed: false,
        reason: "reason",
        status: ExecutionGroupStatus.DISABLED,
        executionGroupId: EXECUTION_GROUP_ID,
        technicalReseedOperations: [],
      })
    );
    component.ngOnInit();
    expect(component.disabled).toBe(true);
  });

  it("should set the tooltip message correctly if the button is disabled", () => {
    jest.spyOn(store, "select").mockReturnValue(
      of({
        launchesAllowed: false,
        reason: "reason",
        status: ExecutionGroupStatus.DISABLED,
        executionGroupId: EXECUTION_GROUP_ID,
        technicalReseedOperations: [],
      })
    );
    component.ngOnInit();
    expect(component.tooltip).toBe("reason");
  });

  it("should open the modal correctly once open technical reseed modal is clicked", () => {
    expect(component.modalOpen).toBe(false);
    component.openTechnicalReseedModal();
    expect(component.modalOpen).toBe(true);
  });

  it("should notify the user that the request to launch a technical reseed succeeded", () => {
    component.operationLaunched({});
    expect(toastService.showSuccess).toHaveBeenCalledWith(
      "Technical reseed operation launched successfully",
      "Success"
    );
  });

  it("should emit a reseed successful event if the request to launch a technical reseed succeeded", () => {
    const spy = jest.spyOn(component.reseedLaunchedSuccessfully, "emit");
    component.operationLaunched({});
    expect(spy).toHaveBeenCalled();
  });

  it("should notify the user that the request to launch a technical reseed failed", () => {
    component.operationLaunched({ error: "error", summary: "summary" });
    expect(toastService.showError).toHaveBeenCalledWith("error", "summary");
  });

  it("should unsubscribe to the observable of selecting details on destroy", () => {
    const selectMock = store.select as jest.Mock;
    selectMock.mockReset();

    const subject = new Subject();
    selectMock.mockReturnValue(subject.asObservable());

    component.ngOnInit();
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  function getExecutionGroup(): ExecutionGroup {
    return {
      launchesAllowed: true,
      status: ExecutionGroupStatus.ENABLED,
      executionGroupId: EXECUTION_GROUP_ID,
      technicalReseedOperations: [
        {
          id: "technicalReseedId",
          status: TechnicalReseedStatusEnum.RUNNING,
          branch: "branch",
          sourceCommit: "sourceCommit",
          validationLevel: "validationLevel",
          maintenanceLevel: "FULL",
          environmentDefinitionId: "definitionId",
          dumpIds: ["dump1", "dump2"],
          environmentId: "environmentId",
          createdOn: "createdOn",
        },
      ],
    };
  }
});
