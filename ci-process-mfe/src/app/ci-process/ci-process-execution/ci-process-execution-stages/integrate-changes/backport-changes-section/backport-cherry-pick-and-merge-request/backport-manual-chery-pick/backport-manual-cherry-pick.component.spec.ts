import { v4 as uuidv4 } from "uuid";
import { CommitDetails, ScmService } from "@mxflow/features/scm";
import { ConfirmationService } from "primeng/api";
import { CiProcessExecutionService } from "../../../../../service/ci-process-execution.service";
import { CiProcessExecutionStateUpdaterService } from "../../../../../ci-process-execution-details/ci-process-state-updater.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { of, throwError } from "rxjs";
import { Backport, CherryPickStatus } from "@mxflow/features/business-process";
import { BackportManualCherryPickComponent } from "./backport-manual-cherry-pick.component";
import { TestBed } from "@angular/core/testing";

describe("Backport manual cherry pick component", () => {
  const projectId = uuidv4();
  const processId = uuidv4();
  const repositoryId = uuidv4();
  const errorMessage = uuidv4();
  const cherryPickBranchName = uuidv4();
  const destinationBranchName = uuidv4();
  const requester = uuidv4();
  const latestMergeJobId = uuidv4();
  const mergeConfigurationId = uuidv4();
  const developmentId = uuidv4();

  let scmService: ScmService;
  let confirmationService: ConfirmationService;
  let ciProcessService: CiProcessExecutionService;
  let processExecutionUpdater: CiProcessExecutionStateUpdaterService;
  let messageService: ToastMessageService;

  let component: BackportManualCherryPickComponent;

  beforeEach(() => {
    ciProcessService = {
      commitsCherryPicked: jest.fn(() => of(null)),
    } as unknown as CiProcessExecutionService;

    processExecutionUpdater = {
      reloadProcessDetails: jest.fn(),
    } as unknown as CiProcessExecutionStateUpdaterService;

    scmService = {
      getCommitDifferences: jest.fn(() => of(getCommitDifference())),
    } as unknown as ScmService;

    confirmationService = {
      confirm: jest.fn(),
    } as unknown as ConfirmationService;

    messageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    TestBed.configureTestingModule({
      providers: [
        { provide: ScmService, useValue: scmService },
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: CiProcessExecutionService, useValue: ciProcessService },
        {
          provide: CiProcessExecutionStateUpdaterService,
          useValue: processExecutionUpdater,
        },
        { provide: ToastMessageService, useValue: messageService },
        BackportManualCherryPickComponent,
      ],
    });

    component = TestBed.inject(BackportManualCherryPickComponent);

    component.projectId = projectId;
    component.ciProcessExecutionId = processId;
    component.repositoryId = repositoryId;
    component.backport = getBackport();
  });

  describe("On init", () => {
    it("should fetch the commit difference between backport cherry pick branch and destination branch", () => {
      component.ngOnInit();

      expect(scmService.getCommitDifferences).toHaveBeenCalledWith({
        projectId: projectId,
        repositoryId: repositoryId,
        sourceBranch: cherryPickBranchName,
        destinationBranch: destinationBranchName,
      });
    });

    it("should set cherry pick disabled to false if there is commit difference", () => {
      component.ngOnInit();

      expect(component.cherryPickDoneDisabled).toStrictEqual(false);
    });

    it("should set cherry pick disabled to true if there is no commit difference", () => {
      scmService.getCommitDifferences = jest.fn(() => of([]));
      component.ngOnInit();

      expect(component.cherryPickDoneDisabled).toStrictEqual(true);
    });

    it("should show error if it fails to fetch commits difference", () => {
      scmService.getCommitDifferences = jest
        .fn()
        .mockReturnValue(throwError(() => errorMessage));
      component.ngOnInit();

      expect(messageService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("Commits Cherry Picked", () => {
    it("should confirm that the commits are cherry picked", () => {
      component.confirmCommitsCherryPicked({} as Event);

      expect(confirmationService.confirm).toHaveBeenCalled();
    });

    it("should send a request that the commits are cherry picked", () => {
      component.commitsCherryPicked();

      expect(ciProcessService.commitsCherryPicked).toHaveBeenCalledWith({
        projectId: projectId,
        processExecutionId: processId,
        mergeConfigurationId: mergeConfigurationId,
      });
    });

    it("should update the execution state if the request was successful", () => {
      component.commitsCherryPicked();

      expect(processExecutionUpdater.reloadProcessDetails).toHaveBeenCalledWith(
        processId,
        projectId,
        1000
      );
    });

    it("should show error if it fails to send request", () => {
      jest
        .spyOn(ciProcessService, "commitsCherryPicked")
        .mockReturnValue(throwError(() => errorMessage));

      component.commitsCherryPicked();

      expect(messageService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });

  function getBackport(): Backport {
    return {
      mergeConfigurationId: mergeConfigurationId,
      startDate: "startDate",
      endDate: "endDate",
      willPublishFinalProduct: false,
      initializeDevelopmentState: {
        cherryPickBranchName: cherryPickBranchName,
        destinationBranchName: destinationBranchName,
        developmentId: developmentId,
        startDate: "startDate",
        endDate: "endDate",
      },
      applyBackportDevelopmentState: {
        startDate: "startDate",
        endDate: "endDate",
        requester: "requester",
        cherryPickStatus: CherryPickStatus.AUTOMATIC_CHERRY_PICK_IN_PROGRESS,
      },
      mergeDevelopmentState: {
        startDate: "startDate",
        endDate: "endDate",
        mergeJobIds: [],
        latestMergeJobId: latestMergeJobId,
        requester: requester,
        canRepush: true,
      },
      finalProductPublishing: {
        id: "finalProductId",
        publishingStartDate: "startDate",
        publishingEndDate: "endDate",
      },
    };
  }

  function getCommitDifference(): CommitDetails[] {
    return [{} as CommitDetails];
  }
});
