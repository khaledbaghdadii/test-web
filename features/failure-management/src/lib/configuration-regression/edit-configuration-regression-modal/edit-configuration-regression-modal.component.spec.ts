import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfigurationRegression } from "../model/configuration-regression";
import { ConfigurationRegressionService } from "../configuration-regression.service";
import { EditConfigurationRegressionModalComponent } from "./edit-configuration-regression-modal.component";
import { of, throwError } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";

const projectId = "projectId";
const configurationRegressionId = "configurationRegressionId";
const title = "title";
const fix = "fix";
const description = "description";
const guiltyChange = "guiltyChange";
const owner = "owner";
const creationDate = new Date();
const errorMessage = "errorMessage";
describe("Edit configuration regression modal component", () => {
  let component: EditConfigurationRegressionModalComponent;
  let fixture: ComponentFixture<EditConfigurationRegressionModalComponent>;
  let toastMessageService: ToastMessageService;
  let configurationRegressionService: ConfigurationRegressionService;

  beforeEach(() => {
    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as ToastMessageService;
    configurationRegressionService = {
      update: jest.fn(),
      fetch: jest.fn(() => of(getConfigurationRegressionDetails())),
    } as unknown as ConfigurationRegressionService;

    TestBed.configureTestingModule({
      imports: [EditConfigurationRegressionModalComponent],
    }).overrideComponent(EditConfigurationRegressionModalComponent, {
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
      EditConfigurationRegressionModalComponent
    );
    component = fixture.componentInstance;
  });

  describe("ngOnInit", () => {
    it("should disable the guilty change field", () => {
      component.ngOnInit();
      expect(
        component.editConfigurationRegressionForm.controls.guiltyChange.disabled
      ).toBeTruthy();
    });
  });

  it("should fetch the configuration regression details when showing the modal", () => {
    component.projectId = projectId;
    component.configurationRegressionId = configurationRegressionId;
    component.isModalShown = true;

    expect(
      component.editConfigurationRegressionForm.controls.title.value
    ).toEqual(title);
    expect(
      component.editConfigurationRegressionForm.controls.description.value
    ).toEqual(description);
    expect(
      component.editConfigurationRegressionForm.controls.fix.value
    ).toEqual(fix);
    expect(
      component.editConfigurationRegressionForm.controls.guiltyChange.value
    ).toEqual(guiltyChange);
    expect(component.isLoading).toBeFalsy();
  });

  it("should handle failing to fetch the configuration regression details when showing the modal", () => {
    jest
      .spyOn(configurationRegressionService, "fetch")
      .mockReturnValue(throwError(() => errorMessage));
    component.projectId = projectId;
    component.configurationRegressionId = configurationRegressionId;
    component.isModalShown = true;

    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    expect(component.isLoading).toBeFalsy();
  });

  it("should not fetch the configuration regression details when hiding the modal", () => {
    component.projectId = projectId;
    component.configurationRegressionId = configurationRegressionId;
    component.isModalShown = false;

    expect(configurationRegressionService.fetch).toHaveBeenCalledTimes(0);
  });

  it("should handle editing the configuration regression successfully", () => {
    component.projectId = projectId;
    component.configurationRegressionId = configurationRegressionId;
    component.editConfigurationRegressionForm.patchValue(
      getEditConfigurationRegressionFormValues()
    );
    const configurationRegressionEditedMock = jest.spyOn(
      component.configurationRegressionEdited,
      "emit"
    );
    const closeModalEventMock = jest.spyOn(component.closeModalEvent, "emit");
    jest
      .spyOn(configurationRegressionService, "update")
      .mockReturnValue(of(null));
    component.onFormSubmission();

    expect(configurationRegressionService.update).toHaveBeenCalledWith(
      projectId,
      configurationRegressionId,
      getEditConfigurationRegressionFormValues()
    );
    expect(component.isEditingLoading).toBeFalsy();
    expect(configurationRegressionEditedMock).toHaveBeenCalledTimes(1);
    expect(closeModalEventMock).toHaveBeenCalledTimes(1);
  });

  it("should notify the user that the edit request was successful", () => {
    component.projectId = projectId;
    component.configurationRegressionId = configurationRegressionId;
    component.editConfigurationRegressionForm.patchValue(
      getEditConfigurationRegressionFormValues()
    );

    jest
      .spyOn(configurationRegressionService, "update")
      .mockReturnValue(of(null));
    component.onFormSubmission();

    expect(configurationRegressionService.update).toHaveBeenCalledWith(
      projectId,
      configurationRegressionId,
      getEditConfigurationRegressionFormValues()
    );
    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "Configuration regression edited successfully"
    );
  });

  it("should handle failing to edit the configuration regression", () => {
    component.projectId = projectId;
    component.configurationRegressionId = configurationRegressionId;
    component.editConfigurationRegressionForm.patchValue(
      getEditConfigurationRegressionFormValues()
    );
    jest.spyOn(component.configurationRegressionEdited, "emit");
    jest.spyOn(component.closeModalEvent, "emit");
    jest
      .spyOn(configurationRegressionService, "update")
      .mockReturnValue(throwError(() => errorMessage));
    component.onFormSubmission();

    expect(component.isEditingLoading).toBeFalsy();
    expect(configurationRegressionService.update).toHaveBeenCalledWith(
      projectId,
      configurationRegressionId,
      getEditConfigurationRegressionFormValues()
    );
    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should handle the on cancel user request", () => {
    const closeModalEventMock = jest.spyOn(component.closeModalEvent, "emit");
    component.onCancel();
    expect(closeModalEventMock).toHaveBeenCalledTimes(1);
  });

  function getEditConfigurationRegressionFormValues() {
    return {
      title: title,
      description: description,
      fix: fix,
    };
  }

  function getConfigurationRegressionDetails(): ConfigurationRegression {
    return {
      creationDate: creationDate,
      id: configurationRegressionId,
      owner: owner,
      projectId: projectId,
      title: title,
      description: description,
      fix: fix,
      guiltyChange: guiltyChange,
    };
  }
});
