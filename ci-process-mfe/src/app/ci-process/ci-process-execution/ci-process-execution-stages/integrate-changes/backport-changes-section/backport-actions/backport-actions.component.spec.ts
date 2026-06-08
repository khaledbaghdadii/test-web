import { v4 as uuidv4 } from "uuid";
import { CiProcessExecutionService } from "../../../../service/ci-process-execution.service";
import { CiProcessExecutionStateUpdaterService } from "../../../../ci-process-execution-details/ci-process-state-updater.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { of, throwError } from "rxjs";
import { BackportActionsComponent } from "./backport-actions.component";
import { RepushBackportMergeRequest } from "../../../../service/model/repush-backport-merge-request";

describe("Backport actions component test", () => {
  const processId = uuidv4();
  const projectId = uuidv4();
  const errorMessage = uuidv4();
  const mergeConfigurationId = uuidv4();

  let ciProcessService: CiProcessExecutionService;
  let processExecutionUpdater: CiProcessExecutionStateUpdaterService;
  let messageService: ToastMessageService;

  let component: BackportActionsComponent;

  beforeEach(() => {
    ciProcessService = {
      repushBackportMergeRequest: jest.fn(() => of(null)),
    } as unknown as CiProcessExecutionService;

    processExecutionUpdater = {
      reloadProcessDetails: jest.fn(),
    } as unknown as CiProcessExecutionStateUpdaterService;

    messageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    component = new BackportActionsComponent(
      ciProcessService,
      messageService,
      processExecutionUpdater
    );

    component.projectId = projectId;
    component.ciProcessExecutionId = processId;
    component.mergeConfigurationId = mergeConfigurationId;
  });

  describe("Repush Backport Merge Request", () => {
    it("should send a request to repush backport merge request", () => {
      component.repushBackportMergeRequest();

      expect(ciProcessService.repushBackportMergeRequest).toHaveBeenCalledWith({
        projectId: projectId,
        processExecutionId: processId,
        mergeConfigurationId: mergeConfigurationId,
      } as RepushBackportMergeRequest);
    });

    it("should update the execution state if the request was successful", () => {
      component.repushBackportMergeRequest();

      expect(processExecutionUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        processId,
        projectId,
        1000
      );
    });

    it("should show error if it fails to send request", () => {
      ciProcessService.repushBackportMergeRequest = jest.fn(() =>
        throwError(() => errorMessage)
      );
      component.repushBackportMergeRequest();

      expect(messageService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });
});
