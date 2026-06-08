import { EditBinaryRegressionModalComponent } from "./edit-binary-regression-modal.component";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { of, throwError } from "rxjs";
import { EditBinaryRegressionRequest } from "./edit-binary-regression-request";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";

const ID = "id";

describe("EditBinaryRegressionModalComponent", () => {
  let component: EditBinaryRegressionModalComponent;
  let fixture: ComponentFixture<EditBinaryRegressionModalComponent>;
  let binaryRegressionDataService: BinaryRegressionDataService;
  let toastMessageService: ToastMessageService;

  beforeEach(() => {
    binaryRegressionDataService = {
      getBinaryRegressionById: jest.fn(() => of(getBinaryRegression())),
      update: jest.fn(() => of(null)),
    } as unknown as BinaryRegressionDataService;
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;

    TestBed.configureTestingModule({
      imports: [EditBinaryRegressionModalComponent],
    }).overrideComponent(EditBinaryRegressionModalComponent, {
      set: {
        providers: [
          {
            provide: BinaryRegressionDataService,
            useValue: binaryRegressionDataService,
          },
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(EditBinaryRegressionModalComponent);
    component = fixture.componentInstance;
    component.binaryRegressionId = ID;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should disable mx version fields", () => {
      component.ngOnInit();
      expect(
        component.editBinaryRegressionForm.controls.mxVersion.disabled
      ).toBeTruthy();
    });
  });

  describe("form initialization", () => {
    it("should not fetch binary regression when modal is hidden", () => {
      component.isModalShown = false;

      expect(
        binaryRegressionDataService.getBinaryRegressionById
      ).not.toHaveBeenCalled();
    });

    it("should fetch binary regression by id when modal is shown", () => {
      component.isModalShown = true;

      expect(
        binaryRegressionDataService.getBinaryRegressionById
      ).toHaveBeenCalledTimes(1);
      expect(
        binaryRegressionDataService.getBinaryRegressionById
      ).toHaveBeenCalledWith(component.binaryRegressionId);
    });

    it("should initialize the edit form with the fetched binary regression", () => {
      component.isModalShown = true;

      expect(component.editBinaryRegressionForm.controls.title.value).toEqual(
        getBinaryRegression().title
      );
      expect(
        component.editBinaryRegressionForm.controls.description.value
      ).toEqual(getBinaryRegression().description);
      expect(component.editBinaryRegressionForm.controls.defect.value).toEqual(
        getBinaryRegression().defect.id
      );
      expect(
        component.editBinaryRegressionForm.controls.mxVersion.value
      ).toEqual(getBinaryRegression().mxVersion);
      expect(
        component.editBinaryRegressionForm.controls.incidentId.value
      ).toEqual(getBinaryRegression().incidentId);
    });

    it("should stop loading after initializing form successfully", () => {
      component.isModalShown = true;

      expect(component.isFormLoading).toBeFalsy();
    });

    it("should display sticky error message on failure to fetch binary regression", () => {
      jest
        .spyOn(binaryRegressionDataService, "getBinaryRegressionById")
        .mockReturnValue(throwError(() => "error"));

      component.isModalShown = true;

      expect(component.isFormLoading).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("should disable the defect field when the defect value of the fetched binary regression is not empty", () => {
      component.editBinaryRegressionForm.controls.defect.setValue(null);
      component.isModalShown = true;

      expect(
        component.editBinaryRegressionForm.controls.defect.disabled
      ).toBeTruthy();
    });

    it("should enable setting the defect value when the it is empty in the fetched binary regression", () => {
      jest
        .spyOn(binaryRegressionDataService, "getBinaryRegressionById")
        .mockReturnValue(
          of({
            ...getBinaryRegression(),
            defect: {
              id: "",
              link: "",
            },
          })
        );

      component.editBinaryRegressionForm.controls.defect.setValue(null);
      component.isModalShown = true;

      expect(
        component.editBinaryRegressionForm.controls.defect.disabled
      ).toBeFalsy();
    });
  });

  describe("onFormSubmission", () => {
    it("should update the binary regression with the new form data", () => {
      component.editBinaryRegressionForm.patchValue(getFormData());

      component.onFormSubmission();

      expect(binaryRegressionDataService.update).toHaveBeenCalledTimes(1);
      expect(binaryRegressionDataService.update).toHaveBeenCalledWith(
        ID,
        getEditBinaryRegressionRequest()
      );
    });

    it("should display toast message for 5 sec on successful update", () => {
      component.editBinaryRegressionForm.patchValue(getFormData());

      component.onFormSubmission();

      expect(toastMessageService.showSuccess).toHaveBeenCalledTimes(1);
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Binary regression edited successfully"
      );
    });

    it("should emit close modal event on successful update", () => {
      component.editBinaryRegressionForm.patchValue(getFormData());
      const closeModalEventSpy = jest.spyOn(component.closeModalEvent, "emit");

      component.onFormSubmission();

      expect(closeModalEventSpy).toHaveBeenCalledTimes(1);
    });

    it("should set button loading to false on successful update", () => {
      component.editBinaryRegressionForm.patchValue(getFormData());

      component.onFormSubmission();

      expect(component.isButtonLoading).toBeFalsy();
    });

    it("should display sticky error message on failure to update", () => {
      jest
        .spyOn(binaryRegressionDataService, "update")
        .mockReturnValue(throwError(() => "error"));
      component.editBinaryRegressionForm.patchValue(getFormData());

      component.onFormSubmission();

      expect(toastMessageService.showError).toHaveBeenCalledTimes(1);
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
      expect(component.isButtonLoading).toBeFalsy();
    });

    it("should not emit events on failure to update", () => {
      jest
        .spyOn(binaryRegressionDataService, "update")
        .mockReturnValue(throwError(() => "error"));
      component.editBinaryRegressionForm.patchValue(getFormData());
      const closeModalEventSpy = jest.spyOn(component.closeModalEvent, "emit");
      const binaryRegressionEditedSpy = jest.spyOn(
        component.binaryRegressionEdited,
        "emit"
      );

      component.onFormSubmission();

      expect(closeModalEventSpy).not.toHaveBeenCalled();
      expect(binaryRegressionEditedSpy).not.toHaveBeenCalled();
    });

    it("should send the original defect id and not undefined within the new form data when the latter is disabled", () => {
      component.editBinaryRegressionForm.controls.defect.setValue(null);
      component.isModalShown = true;
      component.editBinaryRegressionForm.patchValue({
        ...getFormData(),
        title: "new title",
        defect: "newDefectId",
      });
      component.onFormSubmission();
      expect(binaryRegressionDataService.update).toHaveBeenCalledWith(
        ID,
        expect.objectContaining({
          defect: getFormData().defect,
          title: "new title",
        })
      );
    });
  });

  describe("form validity", () => {
    it.each(["", "   ", "a".repeat(256)])(
      "should be invalid when title is invalid",
      (title: string) => {
        component.editBinaryRegressionForm.controls.title.setValue(title);

        expect(component.editBinaryRegressionForm.valid).toBeFalsy();
      }
    );

    it.each(["", "   "])(
      "should be invalid when description is invalid",
      (description: string) => {
        component.editBinaryRegressionForm.controls.description.setValue(
          description
        );

        expect(component.editBinaryRegressionForm.valid).toBeFalsy();
      }
    );

    it.each(["", "   ", "a".repeat(256)])(
      "should be invalid when fix is invalid",
      (fix: string) => {
        component.editBinaryRegressionForm.controls.fix.setValue(fix);

        expect(component.editBinaryRegressionForm.valid).toBeFalsy();
      }
    );

    it.each(["", "   ", "a".repeat(256)])(
      "should be invalid when defect is invalid",
      (defect: string) => {
        component.editBinaryRegressionForm.controls.defect.setValue(defect);

        expect(component.editBinaryRegressionForm.valid).toBeFalsy();
      }
    );

    it("should be valid when all fields are valid", () => {
      component.editBinaryRegressionForm.patchValue(getFormData());

      expect(component.editBinaryRegressionForm.valid).toBeTruthy();
    });
  });

  it("should emit close modal event on cancel", () => {
    const closeModalEventSpy = jest.spyOn(component.closeModalEvent, "emit");

    component.handleCloseModal();

    expect(closeModalEventSpy).toHaveBeenCalledTimes(1);
  });

  it("should destroy subscriptions on destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  function getBinaryRegression() {
    return {
      id: "id",
      title: "title",
      description: "<p>Test</p>",
      mxVersion: "mxVersion",
      defect: {
        id: "id",
        link: "link",
      },
      fix: "fix",
      incidentId: "incidentId",
      creationDate: new Date(),
    };
  }

  function getEditBinaryRegressionRequest(): EditBinaryRegressionRequest {
    return {
      title: "new title",
      description: "new description",
      fix: "new fix",
      defect: getBinaryRegression().defect.id,
      incidentId: "new incident id",
    };
  }

  function getFormData() {
    return {
      title: "new title",
      description: "new description",
      fix: "new fix",
      mxVersion: getBinaryRegression().mxVersion,
      defect: getBinaryRegression().defect.id,
      incidentId: "new incident id",
    };
  }
});
