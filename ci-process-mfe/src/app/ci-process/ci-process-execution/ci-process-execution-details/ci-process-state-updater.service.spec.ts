import { CiProcessExecutionStateUpdaterService } from "./ci-process-state-updater.service";
import { Store } from "@ngrx/store";
import { Router } from "@angular/router";
import { CI_PROCESS_MFE_PATH } from "@mxflow/config";
import { CiProcessExecutionAction } from "../state";
import { fakeAsync, tick } from "@angular/core/testing";

describe("when reloading the state of the ci process in the store", () => {
  let store: Store;

  let router: Router;

  let service: CiProcessExecutionStateUpdaterService;

  beforeEach(() => {
    store = {
      dispatch: jest.fn(),
    } as unknown as Store;

    router = {
      navigateByUrl: jest.fn(),
    } as unknown as Router;

    service = new CiProcessExecutionStateUpdaterService(store, router);
  });

  it("should navigate to the details page of the process", fakeAsync(() => {
    service.reloadProcessDetails("processId", "projectId");
    tick(500);
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      `/app/projectId/business-process/${CI_PROCESS_MFE_PATH}/execution/processId`
    );
  }));

  it("should dispatch an action to refetch the data from the server", fakeAsync(() => {
    let callback = jest.fn();
    service.reloadProcessDetails("processId", "projectId", 1000, callback);
    tick(1000);
    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessExecutionAction.getCiProcessExecution({
        id: "processId",
        projectId: "projectId",
      })
    );
    expect(callback).toHaveBeenCalled();
  }));

  it("should not dispatch any action to the store before the specified delay", fakeAsync(() => {
    let callback = jest.fn();
    service.reloadProcessDetails("processId", "projectId", 1000, callback);
    tick(900);
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    tick(100);
  }));
});
