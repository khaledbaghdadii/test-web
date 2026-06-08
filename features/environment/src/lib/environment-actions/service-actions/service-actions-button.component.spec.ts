import { ConfirmationService, MessageService } from "primeng/api";
import {
  concatMap,
  interval,
  merge,
  Observable,
  of,
  Subject,
  throwError,
} from "rxjs";
import { EnvironmentsState } from "../../store/environment/environments.state";
import {
  Environment,
  EnvironmentAction,
} from "../../service/models/environment.model";
import { EnvironmentStatus } from "../../environment-status/environment-status";
import { Store } from "@ngrx/store";
import { ServiceActionsButtonComponent } from "./service-actions-button.component";
import { EnvironmentActionsService } from "./environment-actions-service";
import { StartEnvironmentResponse } from "../../service/models/start-environment-response.model";
import { StopEnvironmentResponse } from "../../service/models/stop-environment-response.model";
import { TestBed } from "@angular/core/testing";
import { retrieveEnvironment } from "@mxflow/features/environment";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ToggleSwitchChangeEvent } from "primeng/toggleswitch";

const ENVIRONMENT_ID = "environmentId";
const PROJECT_ID = "projectId";
const START_REQUEST_ID = "startRequestId";
const ERROR_MESSAGE = "errorMessage";
const BRANCH = "branch";
const REVISION = "revision";
const OUTPUTS_REPOSITORY_URL = "outputsDirectoryUri";

describe("Services Actions button", () => {
  let component: ServiceActionsButtonComponent;
  let messageService: MessageService;
  let confirmationService: ConfirmationService;
  let store: Store<EnvironmentsState>;
  let environmentActionsService: jest.Mocked<EnvironmentActionsService>;
  let featureFlagResolver: FeatureFlagResolver;

  const observable = interval(100).pipe(concatMap(() => of({})));
  const subject = new Subject();

  beforeEach(() => {
    environmentActionsService = {
      startEnvironment: jest
        .fn()
        .mockReturnValue(of({ startRequestId: START_REQUEST_ID })),
      stopEnvironment: jest
        .fn()
        .mockReturnValue(of({ stopRequestId: START_REQUEST_ID })),
      excludeEnvironmentFromDailyShutdown: jest
        .fn()
        .mockReturnValue(of(void 0)),
    } as unknown as jest.Mocked<EnvironmentActionsService>;
    messageService = {
      add: jest.fn(() => {}),
    } as unknown as MessageService;
    confirmationService = {
      confirm: jest.fn(),
    } as unknown as ConfirmationService;
    store = {
      select: jest.fn(),
      dispatch: jest.fn(),
    } as unknown as Store<EnvironmentsState>;
    featureFlagResolver = {
      isFeatureEnabled: jest.fn(() => Promise.resolve(true)),
    } as unknown as FeatureFlagResolver;

    TestBed.configureTestingModule({
      providers: [
        ServiceActionsButtonComponent,
        { provide: Store<EnvironmentsState>, useValue: store },
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: MessageService, useValue: messageService },
        {
          provide: EnvironmentActionsService,
          useValue: environmentActionsService,
        },
        { provide: FeatureFlagResolver, useValue: featureFlagResolver },
      ],
    });
    component = TestBed.inject(ServiceActionsButtonComponent);
    component.projectId = PROJECT_ID;
    component.environmentId = ENVIRONMENT_ID;
  });

  describe("buttons enabled/disabled state", () => {
    it("should enable the buttons if the environment is ready", () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(of(getEnvironment(EnvironmentStatus.READY)));
      component.ngOnChanges();
      expect(component.disabled).toEqual(false);
      expect(component.viewDisabled).toEqual(false);
      expect(component.excludeDisabled).toEqual(false);
    });

    it("should keep the buttons disabled if the environment is not ready", () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(of(getEnvironment(EnvironmentStatus.CLEANED)));
      component.ngOnChanges();
      expect(component.disabled).toEqual(true);
      expect(component.viewDisabled).toEqual(true);
    });

    it("should disable the view services button if the environment is ready and if the functionality of viewing services is not supported", () => {
      const environmentMock = getEnvironment(EnvironmentStatus.READY);
      environmentMock.environmentActions = [];
      jest.spyOn(store, "select").mockReturnValue(of(environmentMock));
      component.ngOnChanges();

      expect(component.viewDisabled).toEqual(true);
    });

    it("should disable the exclude toggle if the environment status is not among the allowed statuses for exclusion", () => {
      const environmentMock = getEnvironment(EnvironmentStatus.READY);
      environmentMock.status = EnvironmentStatus.CLEAN_FAILED;
      jest.spyOn(store, "select").mockReturnValue(of(environmentMock));
      component.ngOnChanges();

      expect(component.excludeDisabled).toEqual(true);
    });
  });

  describe("start services", () => {
    it("should call confirmation service with correct parameters", () => {
      const confirmSpy = jest.spyOn(confirmationService, "confirm");

      component.onStartClicked({} as MouseEvent);

      expect(confirmSpy).toHaveBeenCalled();
    });

    it("should request the start of an environment", () => {
      component.startEnvironment();
      expect(environmentActionsService.startEnvironment).toHaveBeenCalledWith(
        PROJECT_ID,
        ENVIRONMENT_ID
      );
    });

    it("should notify the user that the request to start an environment succeeded", () => {
      component.startEnvironment();
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: "Success",
        detail: "The request to start the environment was sent successfully",
      });
    });

    it("should notify the user that the request to start an environment failed", () => {
      jest
        .spyOn(environmentActionsService, "startEnvironment")
        .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));
      component.startEnvironment();
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "The request to start the environment failed",
        detail: ERROR_MESSAGE,
      });
    });

    it("should close the observable of starting an environment when the component is destroyed", () => {
      const environmentResponseObservable = merge(
        subject,
        observable
      ) as Observable<StartEnvironmentResponse>;

      environmentActionsService.startEnvironment = jest
        .fn<Observable<StartEnvironmentResponse>, [string, string]>()
        .mockReturnValue(environmentResponseObservable);

      component.startEnvironment();
      expect(subject.observed).toBe(true);

      component.ngOnDestroy();
      expect(subject.observed).toBe(false);
    });
  });

  describe("stop services", () => {
    it("should request the stop of an environment", () => {
      component.onStopClicked();
      expect(environmentActionsService.stopEnvironment).toHaveBeenCalledWith(
        PROJECT_ID,
        ENVIRONMENT_ID
      );
    });

    it("should notify the user that the request to stop an environment succeeded", () => {
      component.onStopClicked();
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: "Success",
        detail: "The request to stop the environment was sent successfully",
      });
    });

    it("should notify the user that the request to stop an environment failed", () => {
      jest
        .spyOn(environmentActionsService, "stopEnvironment")
        .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));
      component.onStopClicked();
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "The request to stop the environment failed",
        detail: ERROR_MESSAGE,
      });
    });

    it("should close the observable of stopping an environment when the component is destroyed", () => {
      const environmentResponseObservable = merge(
        subject,
        observable
      ) as Observable<StopEnvironmentResponse>;

      environmentActionsService.stopEnvironment = jest
        .fn<Observable<StopEnvironmentResponse>, [string, string]>()
        .mockReturnValue(environmentResponseObservable);

      component.onStopClicked();
      expect(subject.observed).toBe(true);

      component.ngOnDestroy();
      expect(subject.observed).toBe(false);
    });
  });

  describe("view services", () => {
    describe("button tooltip Logic", () => {
      it("should set tooltip to 'Functionality is not supported' if the actions is not supported is false", () => {
        const environmentMock = getEnvironment(EnvironmentStatus.READY);
        environmentMock.environmentActions = [];
        jest.spyOn(store, "select").mockReturnValue(of(environmentMock));

        component.ngOnChanges();

        expect(component.viewTooltip).toBe(
          "Functionality available starting from v3.1.63."
        );
      });

      it("should set tooltip to 'Environment is not in a ready state' if environment status is not READY", () => {
        jest
          .spyOn(store, "select")
          .mockReturnValue(of(getEnvironment(EnvironmentStatus.EXECUTING)));

        component.ngOnChanges();

        expect(component.viewTooltip).toBe(
          "Environment is not in a ready state."
        );
      });

      it("should not set a tooltip and enable the button if functionality is supported and environment is READY", () => {
        jest
          .spyOn(store, "select")
          .mockReturnValue(of(getEnvironment(EnvironmentStatus.READY)));

        component.ngOnChanges();
        expect(component.viewTooltip).toBeUndefined();
      });
    });

    it("should open view services dialog correctly", () => {
      component.onViewClicked();
      expect(component.viewOpen).toBe(true);
      expect(component.viewDisabled).toBe(true);
    });

    it("should handle the close event of the view services dialog correctly", () => {
      component.onViewClicked();
      component.onViewClosed();
      expect(component.viewOpen).toBe(false);
      expect(component.viewDisabled).toBe(false);
    });

    it("should handle the services loaded event correctly", () => {
      component.onViewClicked();
      component.servicesLoaded({});
      expect(component.viewDisabled).toBe(false);
    });

    it("should handle the services loaded failure event correctly", () => {
      component.onViewClicked();
      component.servicesLoaded({ error: ERROR_MESSAGE, summary: "SUMMARY" });
      expect(component.viewDisabled).toBe(false);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "SUMMARY",
        detail: ERROR_MESSAGE,
      });
    });
  });

  describe("exclude from daily shutdown", () => {
    beforeEach(() => {
      const environmentMock = getEnvironment(EnvironmentStatus.READY);
      jest.spyOn(store, "select").mockReturnValue(of(environmentMock));
    });

    it("should have the exclude from daily shutdown menu item if the feature flag is enabled", async () => {
      component.ngOnChanges();
      await Promise.resolve();
      expect(component.excludeFeatureEnabled).toBe(true);
      expect(component.items[4].visible).toBe(true);
    });

    it("should request to exclude an environment if it is included", () => {
      component.onExcludeToggled({ checked: false } as ToggleSwitchChangeEvent);
      expect(
        environmentActionsService.excludeEnvironmentFromDailyShutdown
      ).toHaveBeenCalledWith(PROJECT_ID, ENVIRONMENT_ID, true);
      expect(component.excludeFromDailyShutdown).toBe(true);
    });

    it("should request to include an environment if it is excluded", () => {
      component.onExcludeToggled({ checked: true } as ToggleSwitchChangeEvent);
      expect(
        environmentActionsService.excludeEnvironmentFromDailyShutdown
      ).toHaveBeenCalledWith(PROJECT_ID, ENVIRONMENT_ID, false);
      expect(component.excludeFromDailyShutdown).toBe(false);
    });

    it("should dispatch an action to the store to fetch the environment details", () => {
      component.onExcludeToggled({ checked: false } as ToggleSwitchChangeEvent);

      expect(store.dispatch).toHaveBeenCalledWith(
        retrieveEnvironment({
          projectId: PROJECT_ID,
          id: ENVIRONMENT_ID,
        })
      );
    });

    it("should notify the user that the request to exclude an environment from daily shutdown succeeded", () => {
      component.onExcludeToggled({ checked: false } as ToggleSwitchChangeEvent);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: "Success",
        detail: "The environment is now excluded from daily shutdown",
      });
    });

    it("should notify the user that the request to include an environment in daily shutdown succeeded", () => {
      component.onExcludeToggled({ checked: true } as ToggleSwitchChangeEvent);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: "Success",
        detail: "The environment is now included in daily shutdown",
      });
    });

    it("should notify the user that the request to exclude an environment from daily shutdown failed", () => {
      jest
        .spyOn(environmentActionsService, "excludeEnvironmentFromDailyShutdown")
        .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));
      component.onExcludeToggled({ checked: false } as ToggleSwitchChangeEvent);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "Excluding the environment from daily shutdown failed",
        detail: ERROR_MESSAGE,
      });
    });

    it("should notify the user that the request to include an environment in daily shutdown failed", () => {
      jest
        .spyOn(environmentActionsService, "excludeEnvironmentFromDailyShutdown")
        .mockReturnValue(throwError(() => new Error(ERROR_MESSAGE)));
      component.onExcludeToggled({ checked: true } as ToggleSwitchChangeEvent);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "Including the environment in daily shutdown failed",
        detail: ERROR_MESSAGE,
      });
    });

    it("should close the observable of excluding an environment from daily shutdown when the component is destroyed", () => {
      const environmentResponseObservable = merge(
        subject,
        observable
      ) as Observable<void>;

      environmentActionsService.excludeEnvironmentFromDailyShutdown = jest
        .fn<Observable<void>, [string, string, boolean]>()
        .mockReturnValue(environmentResponseObservable);

      component.onExcludeToggled({ checked: false } as ToggleSwitchChangeEvent);
      expect(subject.observed).toBe(true);

      component.ngOnDestroy();
      expect(subject.observed).toBe(false);
    });
  });

  it("should close the observable for fetching the environment details upon changes when the component is destroyed", () => {
    const observable = interval(100).pipe(
      concatMap(() => of(getEnvironment(EnvironmentStatus.BROKEN)))
    );
    const subject = new Subject();

    const environmentResponseObservable = merge(
      subject,
      observable
    ) as Observable<Environment>;

    jest.spyOn(store, "select").mockReturnValue(environmentResponseObservable);
    component.ngOnChanges();
    expect(subject.observed).toBe(true);

    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  function getEnvironment(status: EnvironmentStatus) {
    return {
      id: ENVIRONMENT_ID,
      status: status,
      configurationIdentifier: {
        branch: BRANCH,
        revision: REVISION,
      },
      outputsDirectoryUri: OUTPUTS_REPOSITORY_URL,
      applications: [
        {
          directory: "directory",
          allocation: {
            ports: {
              start: 2000,
              end: 4000,
            },
            machine: {
              name: "sample-machine",
            },
          },
        },
      ],
      bundles: [
        {
          id: "bundleId",
          version: "bundleVersion",
          branch: "main",
          changelist: "13e432",
          artifacts: {
            name: "mx3.client",
            candidateUrls: ["url1", "url2"],
          },
        },
      ],
      environmentActions: [EnvironmentAction.MONITOR_SERVICES],
    } as unknown as Environment;
  }
});
