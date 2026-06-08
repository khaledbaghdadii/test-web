import { CreateConfigurationRegressionModalComponent } from "./create-configuration-regression-modal.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfigurationRegressionService } from "../configuration-regression.service";
import { delay, of, throwError } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";

const CONFIGURATION_REGRESSION_ID = "configuration regression id";
const PROJECT_ID = "projectId";
const CREATE_CONFIGURATION_REGRESSION_REQUEST = {
  title: "Test Title",
  description: "Test Description",
  guiltyChange: "Test Guilty Change",
  fix: "fix",
};
describe("CreateConfigurationRegressionModalComponent", () => {
  let component: CreateConfigurationRegressionModalComponent;
  let fixture: ComponentFixture<CreateConfigurationRegressionModalComponent>;
  let toastMessageService: ToastMessageService;
  let configurationRegressionService: ConfigurationRegressionService;

  beforeEach(() => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;

    configurationRegressionService = {
      create: jest.fn(() => of(CONFIGURATION_REGRESSION_ID)),
    } as unknown as ConfigurationRegressionService;

    TestBed.configureTestingModule({
      imports: [CreateConfigurationRegressionModalComponent],
    }).overrideComponent(CreateConfigurationRegressionModalComponent, {
      set: {
        providers: [
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
          {
            provide: ConfigurationRegressionService,
            useValue: configurationRegressionService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(
      CreateConfigurationRegressionModalComponent
    );
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create configuration regression with form values on form submission", () => {
    component.createConfigurationRegressionForm.setValue(
      CREATE_CONFIGURATION_REGRESSION_REQUEST
    );

    component.onFormSubmission();

    expect(configurationRegressionService.create).toHaveBeenCalledWith(
      PROJECT_ID,
      CREATE_CONFIGURATION_REGRESSION_REQUEST
    );
  });

  it("should set is loading to true before creating configuration regression", () => {
    component.isLoading = false;
    jest
      .spyOn(configurationRegressionService, "create")
      .mockReturnValue(of(CONFIGURATION_REGRESSION_ID).pipe(delay(3000)));
    component.onFormSubmission();
    expect(component.isLoading).toBeTruthy();
  });

  it("should set isLoading to false upon successful creation", () => {
    component.isLoading = true;
    component.onFormSubmission();
    expect(component.isLoading).toBeFalsy();
  });

  it("should set isConfigurationRegressionCreated to true upon successful creation", () => {
    component["isConfigurationRegressionCreated"] = false;
    component.onFormSubmission();
    expect(component["isConfigurationRegressionCreated"]).toBeTruthy();
  });

  it("should set isLoading to false upon error creation", () => {
    configurationRegressionService.create = jest.fn(() =>
      throwError(() => new Error(""))
    );
    component.isLoading = true;
    component.onFormSubmission();
    expect(component.isLoading).toBeFalsy();
  });

  it("should show a success message upon successful creation", () => {
    component.createConfigurationRegressionForm.setValue(
      CREATE_CONFIGURATION_REGRESSION_REQUEST
    );

    component.onFormSubmission();
    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      `The Configuration Regression ${CREATE_CONFIGURATION_REGRESSION_REQUEST.title} was created successfully.`
    );
  });

  it("should emit configuration regression created event upon successful creation", () => {
    component.createConfigurationRegressionForm.setValue(
      CREATE_CONFIGURATION_REGRESSION_REQUEST
    );
    const configurationRegressionCreatedEmitter = jest.spyOn(
      component.configurationRegressionCreated,
      "emit"
    );
    component.onFormSubmission();
    expect(configurationRegressionCreatedEmitter).toHaveBeenCalledWith({
      id: CONFIGURATION_REGRESSION_ID,
    });
  });

  it("should show an error message upon failing to create configuration regression", () => {
    const errorMessage = "error message";
    configurationRegressionService.create = jest.fn(() => {
      return throwError(() => new Error(errorMessage));
    });
    component.isLoading = true;
    component.onFormSubmission();
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should emit cancel event on cancel only when a configuration regression is not created", () => {
    const cancelEventEmitter = jest.spyOn(
      component.createConfigurationRegressionCancelled,
      "emit"
    );
    component.onCancel();
    expect(cancelEventEmitter).toHaveBeenCalled();
  });

  it("should reset form and emit onCancel event on cancel only when a configuration regression is not created", () => {
    const emitSpy = jest.spyOn(component.isVisibleChange, "emit");
    component.onCancel();

    expect(component.createConfigurationRegressionForm.value).toEqual({
      title: null,
      description: null,
      guiltyChange: null,
      fix: null,
    });
    expect(emitSpy).toHaveBeenCalledWith(false);
  });

  it("should not emit onCancel event on cancel when a configuration regression is created", () => {
    const emitSpy = jest.spyOn(
      component.createConfigurationRegressionCancelled,
      "emit"
    );
    component["isConfigurationRegressionCreated"] = true;
    component.onCancel();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it("should reset form on cancel when a configuration regression is created", () => {
    const mockFormValue = {
      title: "Test Title",
      description: "Test Description",
      guiltyChange: "Test Guilty Change",
      fix: "fix",
    };
    component.createConfigurationRegressionForm.setValue(mockFormValue);
    component["isConfigurationRegressionCreated"] = true;
    component.onCancel();
    expect(component.createConfigurationRegressionForm.value).toEqual({
      title: null,
      description: null,
      guiltyChange: null,
      fix: null,
    });
  });

  it("should reset isConfigurationRegressionCreated to false if a configuration regression is created", () => {
    component["isConfigurationRegressionCreated"] = true;
    component.onCancel();
    expect(component["isConfigurationRegressionCreated"]).toBeFalsy();
  });

  it("if is visible changes value to true it should emit the new value", () => {
    const isVisibleChangeEmitter = jest.spyOn(
      component.isVisibleChange,
      "emit"
    );
    component.isVisible = false;
    component.isVisible = true;
    expect(isVisibleChangeEmitter).toHaveBeenLastCalledWith(true);
  });

  it("if is visible changes value to false, it should emit new value", () => {
    const isVisibleChangeEmitter = jest.spyOn(
      component.isVisibleChange,
      "emit"
    );
    component.isVisible = true;
    component.isVisible = false;
    expect(isVisibleChangeEmitter).toHaveBeenLastCalledWith(false);
  });
});
