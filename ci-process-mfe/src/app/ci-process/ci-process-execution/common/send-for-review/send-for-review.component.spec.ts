import { Store } from "@ngrx/store";
import { CiProcessExecutionService } from "../../service/ci-process-execution.service";
import { SendForReviewComponent } from "./send-for-review.component";
import { EventEmitter } from "@angular/core";
import { of, throwError } from "rxjs";
import {
  BuildAndTestProcessExecution,
  BusinessProcessDefinition,
} from "@mxflow/features/business-process";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import {
  DestinationBranchDropdownComponent,
  MergeConfiguration,
  ReviewersAutoCompleteComponent,
} from "@mxflow/features/scm-management";
import { TestBed } from "@angular/core/testing";
import { MockComponent } from "ng-mocks";

const PROJECT_ID = "projectId";
const REPOSITORY_ID = "repositoryId";
const ERROR_MESSAGE = "errorMessage";
const PROCESS_ID = "processId";
const REVIEWER_NAME = "reviewerName";
const REVIEWER = [{ name: REVIEWER_NAME }];
const MERGE_REQUEST_TITLE = "TITLE";
const BACKPORT_MERGE_CONFIGURATION_ID = "backportDestinationBranch";
const DEVELOPMENT_ID = "developmentId";
const CONFIGURATION_PARENT_BRANCH = "configurationParentBranch";
const MERGE_CONFIGURATION_ID = "mergeConfigurationId";
const DEFINITION_1_ID = "definition-1";
const DEFINITION_2_ID = "definition-2";
const DEFINITION_1_REPOSITORY_ID = "repo-1";
const DEFINITION_1_MERGE_CONFIG_ID = "merge-config-1";
const DEFINITION_1_INFRA_GROUP = "infra-group-1";
const DEFINITION_2_REPOSITORY_ID = "repo-2";
const DEFINITION_2_MERGE_CONFIG_ID = "merge-config-2";
const DEFINITION_2_INFRA_GROUP = "infra-group-2";

describe("Send For Review Component Test", () => {
  let store: Partial<Store>;
  let ciProcessService: Partial<CiProcessExecutionService>;
  let component: SendForReviewComponent;

  beforeEach(() => {
    ciProcessService = {
      sendChangesForReview: jest.fn(() => of({})),
      proceedWithPredefinedInputs: jest.fn(() => of({})),
    };

    store = {
      pipe: jest.fn(() => of(getBuildAndTestProcessExecution())),
      dispatch: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [
        SendForReviewComponent,
        MockComponent(ReviewersAutoCompleteComponent),
        MockComponent(DestinationBranchDropdownComponent),
      ],
      providers: [
        { provide: Store, useValue: store },
        { provide: CiProcessExecutionService, useValue: ciProcessService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SendForReviewComponent);
    component = fixture.componentInstance;

    component.projectId = PROJECT_ID;
    component.repositoryId = REPOSITORY_ID;
    component.processId = PROCESS_ID;
    component.showModalEvenEmitter = new EventEmitter();
    component.hideModalEvenEmitter = new EventEmitter();
  });

  describe("On Service Initialization Tests", () => {
    it("should get ci process execution from store", async () => {
      component.ngOnInit();

      expect(store.pipe).toHaveBeenCalledWith(getCiProcessExecution);

      expect(component.repositoryId).toEqual(REPOSITORY_ID);
      expect(component.supportsResourceManagement).toEqual(true);
      expect(component.developmentId).toEqual(DEVELOPMENT_ID);
    });

    it("when the user is sending changes for review it should resolve the destination branch as the input parent branch", async () => {
      component.ngOnInit();

      expect(component.configurationParentBranch).toEqual(
        CONFIGURATION_PARENT_BRANCH
      );
    });

    it("should subscribe on the show modal emitter", async () => {
      const spy = jest.spyOn(component.showModalEvenEmitter, "subscribe");
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it("should subscribe on the hide modal emitter", async () => {
      const spy = jest.spyOn(component.hideModalEvenEmitter, "subscribe");
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    it("should define correct form control in form group", async () => {
      component.ngOnInit();

      expect(
        component.sendForReviewForm.controls["mergeRequestTitle"]
      ).toBeDefined();
      expect(
        component.sendForReviewForm.controls["destinationBranch"]
      ).toBeDefined();
      expect(component.sendForReviewForm.controls["reviewer"]).toBeDefined();
      expect(component.sendForReviewForm.controls["backport"]).toBeDefined();
      expect(
        component.sendForReviewForm.controls["backportMergeConfigurations"]
      ).toBeDefined();
      expect(
        component.sendForReviewForm.controls["backportDefinitions"]
      ).toBeDefined();
    });

    it("given that the user is prompted to send changes for review, then we should initialize deleting development option with a default value to true", async () => {
      component.ngOnInit();

      expect(
        component.sendForReviewForm.controls["deleteDevelopment"]
      ).toBeDefined();
      expect(
        component.sendForReviewForm.controls["deleteDevelopment"].value
      ).toBeTruthy();
    });
  });

  describe("Send For Review Tests", () => {
    it("should send changes for review when requested by user", async () => {
      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: false,
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(ciProcessService.sendChangesForReview).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        ciProcessExecutionId: PROCESS_ID,
        mergeJobTitle: MERGE_REQUEST_TITLE,
        mergeJobReviewers: [REVIEWER_NAME],
        backportChanges: false,
        mergeConfigurationId: MERGE_CONFIGURATION_ID,
        backportMergeConfigurationIds: [],
        backportInputs: [],
        shouldCleanDevelopment: true,
        developmentId: DEVELOPMENT_ID,
        supportsResourceManagement: true,
      });
    });

    it("given that the user wants to backport the changes made and he is on version 1, only when the user selects the backport branches, then the system will allow the user to send his changes for review", async () => {
      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: true,
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(ciProcessService.sendChangesForReview).not.toHaveBeenCalled();
      expect(component.sendForReviewForm.valid).toBe(false);

      component.sendForReviewForm.controls[
        "backportMergeConfigurations"
      ].setValue([getBackportMergeConfiguration()]);
      component.sendForReview();

      expect(component.sendForReviewForm.valid).toBe(true);
      expect(ciProcessService.sendChangesForReview).toHaveBeenCalledWith(
        expect.objectContaining({
          backportMergeConfigurationIds: [BACKPORT_MERGE_CONFIGURATION_ID],
        })
      );
    });

    it("given that the user wants to backport the changes made, only when user selects on-demand backport definitions, then system will allow sending changes for review", async () => {
      store.pipe = jest.fn(() =>
        of({
          ...getBuildAndTestProcessExecution(),
          ciVersion: 2,
        })
      );

      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: true,
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(ciProcessService.sendChangesForReview).not.toHaveBeenCalled();
      expect(component.sendForReviewForm.valid).toBe(false);

      const definitions = getOnDemandBackportDefinitions();
      component.sendForReviewForm.controls["backportDefinitions"].setValue(
        definitions
      );
      component.sendForReview();

      expect(component.sendForReviewForm.valid).toBe(true);
      expect(ciProcessService.sendChangesForReview).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        ciProcessExecutionId: PROCESS_ID,
        mergeJobTitle: MERGE_REQUEST_TITLE,
        mergeJobReviewers: [REVIEWER_NAME],
        backportChanges: true,
        mergeConfigurationId: MERGE_CONFIGURATION_ID,
        backportMergeConfigurationIds: [],
        backportInputs: [
          {
            definitionId: DEFINITION_1_ID,
            repositoryId: DEFINITION_1_REPOSITORY_ID,
            mergeConfigurationId: DEFINITION_1_MERGE_CONFIG_ID,
            buildAndTestInfraGroupId: DEFINITION_1_INFRA_GROUP,
          },
          {
            definitionId: DEFINITION_2_ID,
            repositoryId: DEFINITION_2_REPOSITORY_ID,
            mergeConfigurationId: DEFINITION_2_MERGE_CONFIG_ID,
            buildAndTestInfraGroupId: DEFINITION_2_INFRA_GROUP,
          },
        ],
        shouldCleanDevelopment: true,
        developmentId: DEVELOPMENT_ID,
        supportsResourceManagement: true,
      });
    });

    it("given that user does not want to backport the changes made, then the system will allow the user to send changes for review without providing the backport branches since no backport will take place", async () => {
      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: false,
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(
        component.sendForReviewForm.controls["backportMergeConfigurations"]
          .value
      ).toEqual([]);
      expect(component.sendForReviewForm.valid).toBe(true);
      expect(ciProcessService.sendChangesForReview).toHaveBeenCalledWith(
        expect.objectContaining({
          backportInputs: [],
        })
      );
    });

    it("given that the user was originally wanting to backport his changes, then decided not to backport and he is on version 1, then the system should allow the user to send changes to review without the backport branches", async () => {
      component.ngOnInit();

      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: true,
        deleteDevelopment: true,
      });
      component.sendForReviewForm.controls["backport"].setValue(false);

      component.sendForReview();

      expect(
        component.sendForReviewForm.controls["backportMergeConfigurations"]
          .value
      ).toEqual([]);
      expect(
        component.sendForReviewForm.controls["backportMergeConfigurations"]
          .valid
      ).toBe(true);

      expect(component.sendForReviewForm.valid).toBe(true);
      expect(ciProcessService.sendChangesForReview).toHaveBeenCalledWith(
        expect.objectContaining({
          backportMergeConfigurationIds: [],
        })
      );
    });

    it("given user was originally wanting to backport, then decided not to backport, system should allow sending changes without definitions", async () => {
      store.pipe = jest.fn(() =>
        of({
          ...getBuildAndTestProcessExecution(),
          ciVersion: 2,
        })
      );

      component.ngOnInit();

      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: true,
        deleteDevelopment: true,
      });
      component.sendForReviewForm.controls["backport"].setValue(false);

      component.sendForReview();

      expect(
        component.sendForReviewForm.controls["backportDefinitions"].value
      ).toEqual([]);
      expect(
        component.sendForReviewForm.controls["backportDefinitions"].valid
      ).toBe(true);

      expect(component.sendForReviewForm.valid).toBe(true);
      expect(ciProcessService.sendChangesForReview).toHaveBeenCalledWith(
        expect.objectContaining({
          backportInputs: [],
        })
      );
    });

    it("should emit merge request created when changes are sent for review", async () => {
      component.mergeRequestCreated = {
        emit: jest.fn(),
      } as unknown as EventEmitter<void>;
      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: false,
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(component.mergeRequestCreated.emit).toHaveBeenCalledWith();
    });

    it("should set the submit loading to false when sending changes for review", async () => {
      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backportMergeConfigurations: [getBackportMergeConfiguration()],
        backport: true,
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(component.submitLoading).toEqual(false);
    });

    it("should should set loading to false when failing to send changes for review", async () => {
      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backportMergeConfigurations: [getBackportMergeConfiguration()],
        backport: true,
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(component.submitLoading).toEqual(false);
    });

    it("should set correct error message when failing to send changes for review", async () => {
      jest
        .spyOn(ciProcessService, "sendChangesForReview")
        .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));

      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        reviewer: REVIEWER,
        mergeRequestTitle: MERGE_REQUEST_TITLE,
        destinationBranch: getMergeConfiguration(),
        backport: false,
        deleteDevelopment: true,
      });
      component.sendForReview();

      expect(component.errorMessage).toEqual(ERROR_MESSAGE);
    });
    it("should display invalid inputs when form is invalid and send for review is clicked", async () => {
      component.ngOnInit();
      component.sendForReviewForm.patchValue({
        mergeRequestTitle: "",
        destinationBranch: null,
        reviewer: [],
        backport: false,
        backportMergeConfigurations: [],
        deleteDevelopment: true,
      });

      const markAsDirtySpy = jest.spyOn(
        component.sendForReviewForm.controls["mergeRequestTitle"],
        "markAsDirty"
      );
      const updateValueAndValiditySpy = jest.spyOn(
        component.sendForReviewForm.controls["mergeRequestTitle"],
        "updateValueAndValidity"
      );

      component.sendForReview();

      expect(markAsDirtySpy).toHaveBeenCalled();
      expect(updateValueAndValiditySpy).toHaveBeenCalledWith({
        onlySelf: true,
      });
      expect(ciProcessService.sendChangesForReview).not.toHaveBeenCalled();
    });
  });

  describe("Proceed with Predefined Inputs Tests", () => {
    it("should proceed with predefined inputs when hasPredefinedMergeRequestInputs is true", async () => {
      component.ngOnInit();
      component.hasPredefinedMergeRequestInputs = true;
      component.sendForReviewForm.patchValue({
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(ciProcessService.proceedWithPredefinedInputs).toHaveBeenCalledWith(
        {
          projectId: PROJECT_ID,
          ciProcessExecutionId: PROCESS_ID,
          shouldCleanDevelopment: true,
          developmentId: DEVELOPMENT_ID,
          supportsResourceManagement: true,
        }
      );
    });

    it("should emit merge request created when proceeding with predefined inputs", async () => {
      component.mergeRequestCreated = {
        emit: jest.fn(),
      } as unknown as EventEmitter<void>;
      component.ngOnInit();
      component.hasPredefinedMergeRequestInputs = true;
      component.sendForReviewForm.patchValue({
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(component.mergeRequestCreated.emit).toHaveBeenCalledWith();
    });

    it("should set submit loading to false when proceeding with predefined inputs succeeds", async () => {
      component.ngOnInit();
      component.hasPredefinedMergeRequestInputs = true;
      component.sendForReviewForm.patchValue({
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(component.submitLoading).toEqual(false);
    });

    it("should set submit loading to false when proceeding with predefined inputs fails", async () => {
      jest
        .spyOn(ciProcessService, "proceedWithPredefinedInputs")
        .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));

      component.ngOnInit();
      component.hasPredefinedMergeRequestInputs = true;
      component.sendForReviewForm.patchValue({
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(component.submitLoading).toEqual(false);
    });

    it("should set correct error message when proceeding with predefined inputs fails", async () => {
      jest
        .spyOn(ciProcessService, "proceedWithPredefinedInputs")
        .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));

      component.ngOnInit();
      component.hasPredefinedMergeRequestInputs = true;
      component.sendForReviewForm.patchValue({
        deleteDevelopment: true,
      });

      component.sendForReview();

      expect(component.errorMessage).toEqual(ERROR_MESSAGE);
    });

    it("should use deleteDevelopment form value when proceeding with predefined inputs", async () => {
      component.ngOnInit();
      component.hasPredefinedMergeRequestInputs = true;
      component.sendForReviewForm.patchValue({
        deleteDevelopment: false,
      });

      component.sendForReview();

      expect(ciProcessService.proceedWithPredefinedInputs).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldCleanDevelopment: false,
        })
      );
    });

    it("should not load destination merge configuration since it will be computed on the backend", () => {
      const execution = getBuildAndTestProcessExecution();
      execution.hasPredefinedMergeRequestInputs = true;
      store.pipe = jest.fn(() => of(execution));

      component.ngOnInit();

      expect(component.destinationBranchLoading).toBe(false);
    });
  });

  describe("Modal and Error Handling Tests", () => {
    it("should hide modal and reset form when cancel button is clicked", async () => {
      component.ngOnInit();
      component.isModalVisible = true;
      const resetFormSpy = jest.spyOn(component.sendForReviewForm, "reset");

      component.onCancel();

      expect(component.isModalVisible).toBe(false);
      expect(resetFormSpy).toHaveBeenCalled();
    });

    it("should show the error message to the user when an error occurs while selecting destination branch", async () => {
      component.ngOnInit();
      const errorMessage = "Destination branch error";

      component.destinationBranchError(errorMessage);

      expect(component.errorMessage).toBe(errorMessage);
    });

    it("should show the error message to the user when an error occurs in the auto complete", async () => {
      component.ngOnInit();
      const errorMessage = "Auto complete error";

      component.handleAutoCompleteError(errorMessage);

      expect(component.errorMessage).toBe(errorMessage);
    });

    it("should hide the loading of the destination branch when it is loaded", async () => {
      component.ngOnInit();
      component.destinationBranchLoading = true;

      component.destinationBranchLoadingFinished();

      expect(component.destinationBranchLoading).toBe(false);
    });

    it("should show the error to the user when an error occurs while selecting backport destination branches", async () => {
      component.ngOnInit();
      const errorMessage = "Backport destination branch error";

      component.backportDestinationBranchError(errorMessage);

      expect(component.errorMessage).toBe(errorMessage);
    });

    it("should hide the loading of the backport destination branches when they are loaded", async () => {
      component.ngOnInit();
      component.backportDestinationBranchLoading = true;

      component.backportDestinationBranchLoadingFinished();

      expect(component.backportDestinationBranchLoading).toBe(false);
    });
  });

  function getBuildAndTestProcessExecution(): BuildAndTestProcessExecution {
    return {
      input: {
        repositoryId: REPOSITORY_ID,
        configurationParentBranch: CONFIGURATION_PARENT_BRANCH,
      },
      supportsResourceManagement: true,
      ciVersion: 1,
      createBranchStage: {
        developmentId: DEVELOPMENT_ID,
      },
    } as BuildAndTestProcessExecution;
  }

  function getMergeConfiguration(): MergeConfiguration {
    return {
      id: MERGE_CONFIGURATION_ID,
    } as MergeConfiguration;
  }

  function getBackportMergeConfiguration(): MergeConfiguration {
    return {
      id: BACKPORT_MERGE_CONFIGURATION_ID,
    } as MergeConfiguration;
  }

  function getOnDemandBackportDefinitions(): BusinessProcessDefinition[] {
    return [
      {
        id: DEFINITION_1_ID,
        name: "Backport Definition 1",
        providedInputs: [
          { inputId: "repositoryId", value: DEFINITION_1_REPOSITORY_ID },
          {
            inputId: "mergeConfigurationId",
            value: DEFINITION_1_MERGE_CONFIG_ID,
          },
          {
            inputId: "buildAndTestInfraGroup",
            value: DEFINITION_1_INFRA_GROUP,
          },
        ],
      } as BusinessProcessDefinition,
      {
        id: DEFINITION_2_ID,
        name: "Backport Definition 2",
        providedInputs: [
          { inputId: "repositoryId", value: DEFINITION_2_REPOSITORY_ID },
          {
            inputId: "mergeConfigurationId",
            value: DEFINITION_2_MERGE_CONFIG_ID,
          },
          {
            inputId: "buildAndTestInfraGroup",
            value: DEFINITION_2_INFRA_GROUP,
          },
        ],
      } as BusinessProcessDefinition,
    ];
  }
});
