import { CreateConfigurationImpactModalComponent } from "./create-configuration-impact-modal.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfigurationImpactService } from "../configuration-impact.service";
import { delay, of, throwError } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("CreateConfigurationImpactModalComponent", () => {
  let component: CreateConfigurationImpactModalComponent;
  let fixture: ComponentFixture<CreateConfigurationImpactModalComponent>;
  let toastMessageService: ToastMessageService;
  let configurationImpactService: ConfigurationImpactService;

  beforeEach(() => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;

    configurationImpactService = {
      create: jest.fn(() => of(CONFIGURATION_IMPACT_ID)),
    } as unknown as ConfigurationImpactService;

    TestBed.configureTestingModule({
      imports: [CreateConfigurationImpactModalComponent],
    }).overrideComponent(CreateConfigurationImpactModalComponent, {
      set: {
        providers: [
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
          {
            provide: ConfigurationImpactService,
            useValue: configurationImpactService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(CreateConfigurationImpactModalComponent);
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create configuration impact with form values on form submission", () => {
    component.createConfigurationImpactForm.setValue(
      CREATE_CONFIGURATION_IMPACT_REQUEST
    );

    component.onFormSubmission();

    expect(configurationImpactService.create).toHaveBeenCalledWith(
      PROJECT_ID,
      CREATE_CONFIGURATION_IMPACT_REQUEST
    );
  });

  it("should set is loading to true before creating configuration impact", () => {
    component.isLoading = false;
    jest
      .spyOn(configurationImpactService, "create")
      .mockReturnValue(of(CONFIGURATION_IMPACT_ID).pipe(delay(3000)));
    component.onFormSubmission();
    expect(component.isLoading).toBeTruthy();
  });

  it("should set isLoading to false upon successful creation", () => {
    component.isLoading = true;
    component.onFormSubmission();
    expect(component.isLoading).toBeFalsy();
  });

  it("should set is configuration impact created to true on creating configuration impact successfully", () => {
    component["isConfigurationImpactCreated"] = false;
    component.onFormSubmission();
    expect(component["isConfigurationImpactCreated"]).toBeTruthy();
  });

  it("should reset is configuration impact created to false when configuration impact is not created", () => {
    component["isConfigurationImpactCreated"] = true;
    component.onCancel();
    expect(component["isConfigurationImpactCreated"]).toBeFalsy();
  });

  it("should set isLoading to false upon error creation", () => {
    configurationImpactService.create = jest.fn(() =>
      throwError(() => new Error(""))
    );
    component.isLoading = true;
    component.onFormSubmission();
    expect(component.isLoading).toBeFalsy();
  });

  it("should show a success message upon successful creation", () => {
    component.createConfigurationImpactForm.setValue(
      CREATE_CONFIGURATION_IMPACT_REQUEST
    );

    component.onFormSubmission();
    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      `The Configuration Impact ${CREATE_CONFIGURATION_IMPACT_REQUEST.title} was created successfully.`
    );
  });

  it("should emit configuration impact created event upon successful creation", () => {
    component.createConfigurationImpactForm.setValue(
      CREATE_CONFIGURATION_IMPACT_REQUEST
    );
    const configurationImpactCreatedEmitter = jest.spyOn(
      component.configurationImpactCreated,
      "emit"
    );
    component.onFormSubmission();
    expect(configurationImpactCreatedEmitter).toHaveBeenCalledWith({
      id: CONFIGURATION_IMPACT_ID,
    });
  });

  it("should show an error message upon failing to create configuration impact", () => {
    const errorMessage = "error message";
    configurationImpactService.create = jest.fn(() => {
      return throwError(() => new Error(errorMessage));
    });
    component.isLoading = true;
    component.onFormSubmission();
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should emit cancel event on cancel if configuration impact is not created", () => {
    const cancelEventEmitter = jest.spyOn(
      component.createConfigurationImpactCancelled,
      "emit"
    );
    component.onCancel();
    expect(cancelEventEmitter).toHaveBeenCalled();
  });

  it("should reset form and emit onCancel event on cancel if configuration impact is not created", () => {
    const emitSpy = jest.spyOn(component.isVisibleChange, "emit");
    component["isConfigurationImpactCreated"] = false;
    component.onCancel();

    expect(component.createConfigurationImpactForm.value).toEqual({
      title: null,
      description: null,
      guiltyChange: null,
    });
    expect(emitSpy).toHaveBeenCalledWith(false);
  });

  it("should reset form and not emit onCancel event on cancel if configuration impact is created", () => {
    const emitSpy = jest.spyOn(component.isVisibleChange, "emit");
    component.createConfigurationImpactForm.setValue(
      CREATE_CONFIGURATION_IMPACT_REQUEST
    );
    component["isConfigurationImpactCreated"] = true;
    component.onCancel();

    expect(component.createConfigurationImpactForm.value).toEqual({
      title: null,
      description: null,
      guiltyChange: null,
    });
    expect(emitSpy).not.toHaveBeenCalledWith(false);
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

const CONFIGURATION_IMPACT_ID = "configuration impact id";
const PROJECT_ID = "projectId";
const CREATE_CONFIGURATION_IMPACT_REQUEST = {
  title: "Test Title",
  description: "Test Description",
  guiltyChange: "Test Guilty Change",
};
