import { EditConfigurationImpactModalComponent } from "./edit-configuration-impact-modal.component";
import { ConfigurationImpactService } from "../configuration-impact.service";
import { of, throwError } from "rxjs";
import { ConfigurationImpact } from "../model/configuration-impact";
import { EditConfigurationImpactRequest } from "./edit-configuration-impact-request.model";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("EditConfigurationImpactModalComponent", () => {
  const CONFIGURATION_IMPACT_ID = "configurationImpactId";
  const PROJECT_ID = "projectId";
  const TITLE = "title";
  const DESCRIPTION = "description";
  const GUILTY_CHANGE = "guiltyChange";

  let component: EditConfigurationImpactModalComponent;
  let fixture: ComponentFixture<EditConfigurationImpactModalComponent>;
  let configurationImpactService: ConfigurationImpactService;
  let toastMessageService: ToastMessageService;

  beforeEach(() => {
    configurationImpactService = {
      fetch: jest.fn(() => of(getConfigurationImpact())),
      update: jest.fn(() => of(null)),
    } as unknown as ConfigurationImpactService;
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;

    TestBed.configureTestingModule({
      imports: [EditConfigurationImpactModalComponent],
    }).overrideComponent(EditConfigurationImpactModalComponent, {
      set: {
        providers: [
          {
            provide: ConfigurationImpactService,
            useValue: configurationImpactService,
          },
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(EditConfigurationImpactModalComponent);
    component = fixture.componentInstance;
    component.projectId = PROJECT_ID;
    component.configurationImpactId = CONFIGURATION_IMPACT_ID;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should disable the guilty change field", () => {
      component.ngOnInit();
      expect(
        component.editConfigurationImpactForm.controls.guiltyChange.disabled
      ).toBeTruthy();
    });
  });

  it("should emit event on closing the modal", () => {
    const emitSpy = jest.spyOn(component.closeModalEvent, "emit");
    component.onCancel();

    expect(emitSpy).toHaveBeenCalled();
  });

  describe("initialization", () => {
    it("should fetch configuration impact by id when showing the modal", () => {
      component.isModalShown = true;

      expect(configurationImpactService.fetch).toHaveBeenCalledWith(
        PROJECT_ID,
        CONFIGURATION_IMPACT_ID
      );
    });

    it("should not fetch configuration impact by id when hiding the modal", () => {
      component.isModalShown = false;

      expect(configurationImpactService.fetch).toHaveBeenCalledTimes(0);
    });

    it("should initialize the fields of the form after showing the modal and successfully fetching the impact", () => {
      component.isModalShown = true;

      expect(
        component.editConfigurationImpactForm.controls.title.value
      ).toEqual(TITLE);
      expect(
        component.editConfigurationImpactForm.controls.description.value
      ).toEqual(DESCRIPTION);
      expect(
        component.editConfigurationImpactForm.controls.guiltyChange.value
      ).toEqual(GUILTY_CHANGE);
      expect(component.isFormLoading).toBeFalsy();
    });

    it("should display error message on failure to fetch configuration impact", () => {
      const errorMessage = "error";
      jest
        .spyOn(configurationImpactService, "fetch")
        .mockReturnValue(throwError(() => new Error(errorMessage)));

      component.isModalShown = true;

      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should set isLoading to false on failure to fetch configuration impact", () => {
      jest
        .spyOn(configurationImpactService, "fetch")
        .mockReturnValue(throwError(() => new Error("error")));

      component.isModalShown = true;

      expect(component.isFormLoading).toBeFalsy();
    });
  });

  describe("form validation", () => {
    it.each(["", "   ", "hello".repeat(100)])(
      "should be invalid when title is blank or too long",
      (title: string) => {
        component.editConfigurationImpactForm.controls.title.setValue(title);

        expect(component.editConfigurationImpactForm.valid).toBeFalsy();
      }
    );

    it.each(["", "   "])(
      "should be invalid when description is blank",
      (description: string) => {
        component.editConfigurationImpactForm.controls.description.setValue(
          description
        );

        expect(component.editConfigurationImpactForm.valid).toBeFalsy();
      }
    );
  });

  describe("onFormSubmission", () => {
    it("should update the configuration impact", () => {
      component.editConfigurationImpactForm.controls.title.setValue(TITLE);
      component.editConfigurationImpactForm.controls.description.setValue(
        DESCRIPTION
      );

      component.onFormSubmission();

      expect(configurationImpactService.update).toHaveBeenCalled();
      expect(configurationImpactService.update).toHaveBeenCalledWith(
        PROJECT_ID,
        CONFIGURATION_IMPACT_ID,
        getEditRequest()
      );
      expect(component.isButtonLoading).toBeFalsy();
    });

    it("should emit configuration impact edited event on successful update", () => {
      const emitSpy = jest.spyOn(component.configurationImpactEdited, "emit");
      component.editConfigurationImpactForm.controls.title.setValue(TITLE);
      component.editConfigurationImpactForm.controls.description.setValue(
        DESCRIPTION
      );

      component.onFormSubmission();
      expect(emitSpy).toHaveBeenCalled();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Configuration impact edited successfully"
      );
    });

    it("should emit close modal event on successful update", () => {
      const emitSpy = jest.spyOn(component.closeModalEvent, "emit");
      component.editConfigurationImpactForm.controls.title.setValue(TITLE);
      component.editConfigurationImpactForm.controls.description.setValue(
        DESCRIPTION
      );

      component.onFormSubmission();

      expect(emitSpy).toHaveBeenCalled();
    });

    it("should display error message on failure to update configuration impact", () => {
      const errorMessage = "error";
      jest
        .spyOn(configurationImpactService, "update")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      component.editConfigurationImpactForm.controls.title.setValue(TITLE);
      component.editConfigurationImpactForm.controls.description.setValue(
        DESCRIPTION
      );

      component.onFormSubmission();

      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
      expect(component.isButtonLoading).toBeFalsy();
    });
  });

  it("should destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  function getConfigurationImpact(): ConfigurationImpact {
    return {
      id: CONFIGURATION_IMPACT_ID,
      projectId: PROJECT_ID,
      title: TITLE,
      description: DESCRIPTION,
      guiltyChange: GUILTY_CHANGE,
      owner: "owner",
      creationDate: new Date(),
    };
  }

  function getEditRequest(): EditConfigurationImpactRequest {
    return {
      title: TITLE,
      description: DESCRIPTION,
    };
  }
});
