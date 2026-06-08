/* tslint:disable:no-unused-variable */
import { CreateBinaryRegressionModalComponent } from "./create-binary-regression-modal.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { BinaryRegressionDataService } from "@mxflow/features/failure-management";
import { of, Subject, throwError } from "rxjs";
import { fakeAsync, tick } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";

const PROJECT_ID = "projectId";
const BINARY_REGRESSION_ID = "binaryRegressionId";

describe("CreateBinaryRegressionModalComponent", () => {
  let component: CreateBinaryRegressionModalComponent;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let binaryRegressionService: jest.Mocked<BinaryRegressionDataService>;
  let fixture: MockedComponentFixture<CreateBinaryRegressionModalComponent>;

  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    binaryRegressionService = {
      createBinaryRegression: jest.fn(() => of({ id: BINARY_REGRESSION_ID })),
    } as unknown as jest.Mocked<BinaryRegressionDataService>;

    await MockBuilder(CreateBinaryRegressionModalComponent)
      .mock(BinaryRegressionDataService, binaryRegressionService)
      .mock(ToastMessageService, toastMessageService);

    fixture = MockRender(CreateBinaryRegressionModalComponent);
    component = fixture.point.componentInstance;
    component.projectId = PROJECT_ID;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("onSubmitCreateBinaryRegression", () => {
    it("should create the binary regression on submit", () => {
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(mockFormValues);
      component.onFormSubmission();

      expect(
        binaryRegressionService.createBinaryRegression
      ).toHaveBeenCalledWith(PROJECT_ID, mockFormValues);
    });

    it("should emit binaryRegressionCreated event with the creation response", () => {
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(mockFormValues);
      component.onFormSubmission();

      expect(
        binaryRegressionService.createBinaryRegression
      ).toHaveBeenCalledWith(PROJECT_ID, mockFormValues);

      const emitSpy = jest.spyOn(component.binaryRegressionCreated, "emit");
      component.onFormSubmission();

      expect(emitSpy).toHaveBeenCalledWith({
        id: BINARY_REGRESSION_ID,
      });
    });

    it("should show success message on successful creation", () => {
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(mockFormValues);
      component.onFormSubmission();

      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        `The Binary Regression ${mockFormValues.title} was created successfully.`
      );
    });

    it("should set is loading to false on creating binary regression successfully", () => {
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(mockFormValues);
      component.onFormSubmission();

      expect(component.isLoading).toBe(false);
    });

    it("should set is binary regression created to true on creating binary regression successfully", () => {
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(mockFormValues);
      component.onFormSubmission();

      expect(component.isBinaryRegressionCreated).toBeTruthy();
    });

    it("should show error message on creation failure", () => {
      const errorMessage = "Error occurred";
      jest
        .spyOn(binaryRegressionService, "createBinaryRegression")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(mockFormValues);
      component.onFormSubmission();

      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should set is loading to false on failure to create binary impact", () => {
      const errorMessage = "Error occurred";
      jest
        .spyOn(binaryRegressionService, "createBinaryRegression")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(mockFormValues);
      component.onFormSubmission();

      expect(component.isLoading).toBe(false);
    });

    it("should initialize is loading to true then set it to false after creating binary regression", fakeAsync(() => {
      const createSubject = new Subject<string>();
      jest
        .spyOn(binaryRegressionService, "createBinaryRegression")
        .mockReturnValue(createSubject.asObservable());
      const mockFormValues = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.isLoading = false;
      component.createBinaryRegressionForm.setValue(mockFormValues);

      component.onFormSubmission();
      expect(component.isLoading).toBe(true);

      createSubject.next(BINARY_REGRESSION_ID);
      createSubject.complete();
      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  describe("onCancel", () => {
    it("should reset form only when binary regression is not created", () => {
      component.isBinaryRegressionCreated = false;
      const createBinaryRegressionForm = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(createBinaryRegressionForm);
      component.onCancel();

      expect(component.createBinaryRegressionForm.value).toEqual({
        title: null,
        description: null,
        defect: null,
        fix: null,
        mxVersion: null,
        incidentId: null,
      });
    });

    it("should reset form when binary regression is created", () => {
      component.isBinaryRegressionCreated = true;
      const createBinaryRegressionForm = {
        title: "Test Title",
        description: "Test Description",
        defect: "Test Guilty Change",
        fix: "Test Fix",
        mxVersion: "Test Mx version",
        incidentId: "Test Incident Id",
      };
      component.createBinaryRegressionForm.setValue(createBinaryRegressionForm);
      component.onCancel();

      expect(component.createBinaryRegressionForm.value).toEqual({
        title: null,
        description: null,
        defect: null,
        fix: null,
        mxVersion: null,
        incidentId: null,
      });
    });

    it("should reset is create binary regression to false on cancel", () => {
      component.isBinaryRegressionCreated = true;
      component.onCancel();

      expect(component.isBinaryRegressionCreated).toBe(false);
    });

    it("should set isVisible to false", () => {
      component.onCancel();

      expect(component.isVisible).toBe(false);
    });

    it("should emit createBinaryRegressionCanceled event", () => {
      const emitSpy = jest.spyOn(
        component.createBinaryRegressionCancelled,
        "emit"
      );
      component.onCancel();

      expect(emitSpy).toHaveBeenCalled();
    });

    it("should hide the modal when onHide is triggered", () => {
      component.isVisible = true;
      fixture.detectChanges();

      const createBinaryRegressionModal = fixture.debugElement.query(
        By.css('[data-testid="create-binary-regression-modal"]')
      );
      const onCancelSpy = jest.spyOn(component, "onCancel");

      createBinaryRegressionModal.triggerEventHandler("onHide", null);
      fixture.detectChanges();

      expect(onCancelSpy).toHaveBeenCalled();
      expect(component.isVisible).toBeFalsy();
    });

    it("should hide the modal when the cancel button is clicked", () => {
      component.isVisible = true;
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(
        By.css('[data-testid="cancel-button"]')
      );
      const onCancelSpy = jest.spyOn(component, "onCancel");

      cancelButton.triggerEventHandler("click", null);
      fixture.detectChanges();

      expect(onCancelSpy).toHaveBeenCalled();
      expect(component.isVisible).toBeFalsy();
    });
  });

  it("should should initialize the form with mxVersion correctly", () => {
    component.mxVersionInitialValue = "version";
    component.isVisible = true;
    expect(component.createBinaryRegressionForm.value.mxVersion).toEqual(
      "version"
    );
  });

  it("should should initialize the form with mxVersion when showing the modal", () => {
    component.mxVersionInitialValue = "version";
    component.isVisible = true;
    expect(component.createBinaryRegressionForm.value.mxVersion).toEqual(
      "version"
    );
  });

  describe("handleErrorOccurred", () => {
    it("should show error message", () => {
      const errorMessage = "error message";
      const showErrorSpy = jest.spyOn(component, "handleErrorOccurred");
      component.handleErrorOccurred(errorMessage);
      expect(showErrorSpy).toHaveBeenCalledWith(errorMessage);
    });
  });
});
