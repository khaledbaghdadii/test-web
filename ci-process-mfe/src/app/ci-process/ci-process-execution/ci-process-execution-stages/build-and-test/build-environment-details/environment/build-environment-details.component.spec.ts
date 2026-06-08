import { Store } from "@ngrx/store";
import { BuildEnvironmentDetailsComponent } from "./build-environment-details.component";
import {
  CopyPackageDetailsButtonComponent,
  DeployClientButtonComponent,
  dropEnvironmentDetails,
  Environment,
  EnvironmentsState,
  EnvironmentWorkspaceConfigurationEditorButtonComponent,
  retrieveEnvironment,
  ServiceActionsButtonComponent,
  ViewEnvironmentDetailsButtonComponent,
} from "@mxflow/features/environment";
import { v4 as uuidv4 } from "uuid";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { MockComponent } from "ng-mocks";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("BuildEnvironmentDetailsComponent", () => {
  let component: BuildEnvironmentDetailsComponent;

  let environmentStore: Partial<Store<EnvironmentsState>>;
  let featureFlagResolver: Partial<FeatureFlagResolver>;
  let toastMessageService: Partial<ToastMessageService>;

  beforeEach(() => {
    environmentStore = {
      dispatch: jest.fn(),
      select: jest.fn(() => of({})),
    };

    featureFlagResolver = {
      isFeatureEnabled: jest.fn(() => Promise.resolve(false)),
    };

    toastMessageService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [BuildEnvironmentDetailsComponent],
      imports: [
        MockComponent(EnvironmentWorkspaceConfigurationEditorButtonComponent),
        MockComponent(ServiceActionsButtonComponent),
        MockComponent(ViewEnvironmentDetailsButtonComponent),
        MockComponent(DeployClientButtonComponent),
        MockComponent(CopyPackageDetailsButtonComponent),
      ],
      providers: [
        { provide: Store<EnvironmentsState>, useValue: environmentStore },
        { provide: FeatureFlagResolver, useValue: featureFlagResolver },
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    }).compileComponents();

    component = TestBed.createComponent(
      BuildEnvironmentDetailsComponent
    ).componentInstance;
  });

  it("should fetch environment execution with correct parameters on init", () => {
    const environmentId = uuidv4();
    const projectId = uuidv4();
    component.projectId = projectId;
    component.environmentId = environmentId;
    component.ngOnInit();
    expect(environmentStore.dispatch).toHaveBeenCalledWith(
      retrieveEnvironment({
        projectId: projectId,
        id: environmentId,
      })
    );
  });

  it("should set environment property on init", () => {
    const mockEnvironment = { status: "READY" } as Environment;
    jest.spyOn(environmentStore, "select").mockReturnValue(of(mockEnvironment));

    component.ngOnInit();

    expect(component.environment).toBe(mockEnvironment);
  });

  it("should dispatch error message on environment fetch error", () => {
    const errorMessage = "Error fetching environment";
    jest
      .spyOn(environmentStore, "select")
      .mockReturnValue(throwError(() => errorMessage));

    component.ngOnInit();

    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should disable companion if environment status is not READY", () => {
    component.environment = { status: "BROKEN" } as unknown as Environment;
    component.ngOnChanges();
    expect(component.disableCompanion).toBe(true);
  });

  it("should enable companion if environment status is READY", () => {
    component.environment = { status: "READY" } as unknown as Environment;
    component.ngOnChanges();
    expect(component.disableCompanion).toBe(false);
  });

  it("should unsubscribe to observables that outlive the component", () => {
    let observable = interval(100).pipe(concatMap((value) => value.toString()));
    let subject = new Subject();

    let executionObservable = merge(subject, observable);

    jest.spyOn(environmentStore, "select").mockReturnValue(executionObservable);

    component.ngOnInit();

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });

  it("should drop the environment details from the store before closing the component", () => {
    component.environmentId = "id";

    component.ngOnDestroy();

    expect(environmentStore.dispatch).toHaveBeenCalledWith(
      dropEnvironmentDetails({ id: "id" })
    );
  });

  it("should fetch the configurator button feature flag and show the button if it was enabled", async () => {
    const projectId = "projectId";
    component.projectId = projectId;
    const featureFlagPromise = Promise.resolve(true);
    jest
      .spyOn(featureFlagResolver, "isFeatureEnabled")
      .mockReturnValueOnce(featureFlagPromise);

    component.ngOnInit();
    await featureFlagPromise;

    expect(featureFlagResolver.isFeatureEnabled).toHaveBeenCalledWith(
      projectId,
      component.WORKSPACE_CONFIGURATION_EDITOR_UI_FEATURE_FLAG
    );
    expect(component.isConfigurationEditorEnabled).toBe(true);
  });

  it("should not show the configurator button if it was disabled  by the feature flag", async () => {
    const featureFlagPromise = Promise.resolve(false);
    jest
      .spyOn(featureFlagResolver, "isFeatureEnabled")
      .mockReturnValueOnce(featureFlagPromise);

    component.ngOnInit();
    await featureFlagPromise;

    expect(component.isConfigurationEditorEnabled).toBe(false);
  });

  it("should not show the configurator button if it failed to fetch the feature flag", async () => {
    const featureFlagPromise = Promise.reject(new Error("errorMessage"));
    jest
      .spyOn(featureFlagResolver, "isFeatureEnabled")
      .mockReturnValueOnce(featureFlagPromise);

    component.ngOnInit();
    await featureFlagPromise.catch(() => {});

    expect(component.isConfigurationEditorEnabled).toBe(false);
  });
});
