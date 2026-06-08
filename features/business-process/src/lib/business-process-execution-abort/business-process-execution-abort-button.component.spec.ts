import { v4 as uuid } from "uuid";
import {
  BusinessProcessExecutionAbortButtonComponent,
  BusinessProcessExecutionAbortService,
  BusinessProcessExecutionStatus,
  BusinessProcessFamilies,
} from "@mxflow/features/business-process";
import { ToastMessageService } from "@mxflow/ui/alert";
import { of, Subject, throwError } from "rxjs";
import { EventEmitter } from "@angular/core";
import { ConfirmationService } from "primeng/api";
import { BusinessProcessResourcesService } from "../business-process-resources/business-process-resources.service";
import {
  BusinessProcessResource,
  ResourceType,
  ResourceUsageTags,
} from "../business-process-resources/business-process-resource";
import {
  AnalyticsTrackerService,
  EventCategory,
  EventAction,
} from "@mxflow/core/analytics-tracker";
import { TestBed } from "@angular/core/testing";

describe("Business process execution abort button component test", () => {
  const processId = uuid();
  const projectId = uuid();
  const errorMessage = uuid();

  let confirmationService: ConfirmationService;
  let abortService: BusinessProcessExecutionAbortService;
  let resourceService: BusinessProcessResourcesService;
  let toastService: ToastMessageService;
  let onAbortEventEmitter: EventEmitter<void>;
  let component: BusinessProcessExecutionAbortButtonComponent;
  let analyticsTracker: AnalyticsTrackerService;

  beforeEach(() => {
    abortService = {
      abort: jest.fn(() => of(undefined)),
    } as unknown as BusinessProcessExecutionAbortService;

    resourceService = {
      getBusinessProcessResources: jest.fn(() => of(getResources())),
    } as unknown as BusinessProcessResourcesService;

    toastService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    onAbortEventEmitter = {
      emit: jest.fn(),
    } as unknown as EventEmitter<void>;

    confirmationService = {
      confirm: jest.fn(),
    } as unknown as ConfirmationService;

    analyticsTracker = {
      trackEvent: jest.fn(),
    } as unknown as AnalyticsTrackerService;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: BusinessProcessExecutionAbortService,
          useValue: abortService,
        },
        { provide: BusinessProcessResourcesService, useValue: resourceService },
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: ToastMessageService, useValue: toastService },
        { provide: AnalyticsTrackerService, useValue: analyticsTracker },
      ],
    });

    component = TestBed.runInInjectionContext(
      () => new BusinessProcessExecutionAbortButtonComponent()
    );

    component.projectId = projectId;
    component.processId = processId;
    component.businessProcessAborted = onAbortEventEmitter;
  });

  describe("On init", () => {
    const assertStatusIsNotAbortable = (
      status: BusinessProcessExecutionStatus
    ): void => {
      component = TestBed.runInInjectionContext(
        () => new BusinessProcessExecutionAbortButtonComponent()
      );
      component.status = status;
      component.ngOnInit();
      expect(component.executionNotAbortable).toBe(true);
    };

    it("should set the disabled flag to false if the status is RUNNING", () => {
      component.status = BusinessProcessExecutionStatus.RUNNING;

      component.ngOnInit();

      expect(component.executionNotAbortable).toBe(false);
    });

    it("should set the disabled flag to false if the status is PENDING_INPUT", () => {
      component.status = BusinessProcessExecutionStatus.PENDING_INPUT;

      component.ngOnInit();

      expect(component.executionNotAbortable).toBe(false);
    });

    it("should set the disabled flag to true if the status is not RUNNING nor PENDING_INPUT", () => {
      const statuses = [
        BusinessProcessExecutionStatus.NOT_STARTED,
        BusinessProcessExecutionStatus.PASSED,
        BusinessProcessExecutionStatus.FAILED,
        BusinessProcessExecutionStatus.FAILED_TO_START,
        BusinessProcessExecutionStatus.STOPPED,
        BusinessProcessExecutionStatus.ABORTED,
        BusinessProcessExecutionStatus.ABORTING,
        BusinessProcessExecutionStatus.NA,
      ];
      statuses.forEach(assertStatusIsNotAbortable);
    });

    it("should set isAborting to false", () => {
      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });

    it("given a build and test process, when the component initialize, it should set the default cleaning development to true", () => {
      component.familyId = BusinessProcessFamilies.USER_STORY_BUILD_AND_TEST;
      component.ngOnInit();

      expect(component.deleteDevelopmentFormControl.value).toBe(true);
    });

    it("given a process that is not build and test, when the component initialize, it should set the default cleaning development to false", () => {
      const families = [
        BusinessProcessFamilies.VALIDATION_PROCESS,
        BusinessProcessFamilies.UPGRADE_PROCESS,
      ];

      families.forEach((family) => {
        component.familyId = family;
        component.ngOnInit();
        expect(component.deleteDevelopmentFormControl.value).toBe(false);
      });
    });
  });

  describe("Open abort dialog", () => {
    it("when user open the abort dialog, should show a loading button and disable it while the resource are being fetched", () => {
      const disabledChangedSpy = jest.spyOn(component.disabledChange, "emit");
      const subject = new Subject<BusinessProcessResource[]>();
      jest
        .spyOn(resourceService, "getBusinessProcessResources")
        .mockImplementation(jest.fn(() => subject.asObservable()));

      component.openAbortDialog({} as Event);
      expect(component.isLoading).toBe(true);
      expect(disabledChangedSpy).toHaveBeenCalledWith(true);
      subject.next(getResources());
      expect(component.isLoading).toBe(false);
      expect(disabledChangedSpy).toHaveBeenCalledWith(false);
    });

    it("given the component was successful to fetch resources, when user open the abort dialog, then the component should open the confirmation dialog with development id and stop loading", () => {
      const event = {
        target: {
          target: "value",
        } as unknown as EventTarget,
      } as unknown as Event;

      component.openAbortDialog(event);

      expect(confirmationService.confirm).toHaveBeenCalledWith({
        target: event.target,
        key: `${processId}-abort-dialog`,
        header: "Abort Business Process Execution",
        rejectButtonProps: {
          label: "Cancel",
          severity: "secondary",
          outlined: true,
        },
        acceptButtonProps: {
          label: "Abort",
          severity: "danger",
        },
        accept: expect.any(Function),
      });
      expect(component.developmentId).toBe("developmentId");
      expect(component.isLoading).toBe(false);
    });

    it("given the component failed to fetch resources, when user open the abort dialog, then the component should show an error, open the confirmation dialog without development id, and stop loading", () => {
      jest
        .spyOn(resourceService, "getBusinessProcessResources")
        .mockReturnValueOnce(throwError(() => new Error(errorMessage)));

      const event = {
        target: {
          target: "value",
        } as unknown as EventTarget,
      } as unknown as Event;

      component.openAbortDialog(event);

      expect(toastService.showError).toHaveBeenCalled();
      expect(confirmationService.confirm).toHaveBeenCalledWith({
        target: event.target,
        key: `${processId}-abort-dialog`,
        header: "Abort Business Process Execution",
        rejectButtonProps: {
          label: "Cancel",
          severity: "secondary",
          outlined: true,
        },
        acceptButtonProps: {
          label: "Abort",
          severity: "danger",
        },
        accept: expect.any(Function),
      });
      expect(component.developmentId).toBeUndefined();
      expect(component.isLoading).toBe(false);
    });
  });

  describe("Abort business process", () => {
    it("given user select to delete development, when user request to abort, the process should be aborted and clean development", () => {
      component.developmentId = "developmentId";
      component.deleteDevelopmentFormControl.setValue(true);

      component.abortBusinessProcess();

      expect(abortService.abort).toHaveBeenCalledWith({
        projectId: projectId,
        processId: processId,
        shouldCleanDevelopment: true,
        developmentId: "developmentId",
      });
    });

    it("given user does not select to delete development, when user request to abort, the process should be aborted without cleaning development", () => {
      component.developmentId = "developmentId";

      component.abortBusinessProcess();

      expect(abortService.abort).toHaveBeenCalledWith({
        projectId: projectId,
        processId: processId,
        shouldCleanDevelopment: false,
        developmentId: "developmentId",
      });
    });

    it("given process does not have a registered development id, when user request to abort, it should abort without cleaning development", () => {
      component.abortBusinessProcess();

      expect(abortService.abort).toHaveBeenCalledWith({
        projectId: projectId,
        processId: processId,
        shouldCleanDevelopment: false,
        developmentId: undefined,
      });
    });

    it("should show success message on successful abort with provided message", () => {
      const customSuccessMessage = uuid();
      component.successMessageText = customSuccessMessage;
      component.ngOnInit();
      component.abortBusinessProcess();

      expect(toastService.showSuccess).toHaveBeenCalledWith(
        customSuccessMessage
      );
    });

    it("should show success message on successful abort with default message if not message is provided", () => {
      component.ngOnInit();
      component.abortBusinessProcess();

      expect(toastService.showSuccess).toHaveBeenCalledWith(
        "Business process execution successfully aborted"
      );
    });

    it("should emit an event on successful abort", () => {
      component.ngOnInit();
      component.abortBusinessProcess();

      expect(onAbortEventEmitter.emit).toHaveBeenCalled();
    });

    it("should disable the abort button", () => {
      component.executionNotAbortable = false;
      component.ngOnInit();
      component.abortBusinessProcess();

      expect(component.executionNotAbortable).toBe(true);
    });

    it("should show error message if it fails to abort business process", () => {
      jest
        .spyOn(abortService, "abort")
        .mockReturnValueOnce(throwError(() => new Error(errorMessage)));

      component.ngOnInit();
      component.abortBusinessProcess();

      expect(toastService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should set isLoading to true while aborting", () => {
      let subject = new Subject<void>();
      jest
        .spyOn(abortService, "abort")
        .mockImplementation(jest.fn(() => subject.asObservable()));

      component.ngOnInit();
      component.abortBusinessProcess();

      expect(component.isLoading).toBe(true);
    });

    it("should set isLoading to false when aborting is successful", () => {
      component.ngOnInit();
      component.abortBusinessProcess();

      expect(component.isLoading).toBe(false);
    });

    it("should set isLoading to false when aborting fails", () => {
      jest
        .spyOn(abortService, "abort")
        .mockReturnValueOnce(throwError(() => new Error(errorMessage)));

      component.ngOnInit();
      component.abortBusinessProcess();

      expect(component.isLoading).toBe(false);
    });

    it("should track analytics event on successful abort", () => {
      component.familyId = BusinessProcessFamilies.USER_STORY_BUILD_AND_TEST;
      component.ngOnInit();
      component.abortBusinessProcess();

      expect(analyticsTracker.trackEvent).toHaveBeenCalledWith(
        EventCategory.BUTTON,
        EventAction.CLICK_BUTTON,
        `Abort Business Process - ${BusinessProcessFamilies.USER_STORY_BUILD_AND_TEST}`
      );
    });
  });

  function getResources(): BusinessProcessResource[] {
    return [
      {
        projectId: projectId,
        resourceId: "developmentId",
        resourceType: ResourceType.DEVELOPMENT,
        usageTags: [],
      },
      {
        projectId: projectId,
        resourceId: "anotherDevelopmentId",
        resourceType: ResourceType.DEVELOPMENT,
        usageTags: [ResourceUsageTags.BACKPORT],
      },
      {
        projectId: projectId,
        resourceId: "environmentId",
        resourceType: ResourceType.ENVIRONMENT,
        usageTags: [],
      },
    ];
  }
});
