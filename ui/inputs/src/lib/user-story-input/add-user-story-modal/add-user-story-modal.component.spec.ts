import { ReactiveFormsModule } from "@angular/forms";
import { AddUserStoryModalComponent } from "./add-user-story-modal.component";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { ValidateUserStoryService } from "../../../../../../features/business-process/src/lib/user-story-validation/validate-user-story.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { of, throwError } from "rxjs";

describe("AddUserStoryModalComponent", () => {
  const existingId = "US-123";
  const projectId = "test-project-id";

  let component: AddUserStoryModalComponent;
  let fixture: MockedComponentFixture<
    AddUserStoryModalComponent,
    { userStoryIds: string[] }
  >;
  let mockValidateUserStoryService: jest.Mocked<ValidateUserStoryService>;
  let mockToastMessageService: jest.Mocked<ToastMessageService>;
  let mockFeatureFlagResolver: jest.Mocked<FeatureFlagResolver>;

  beforeEach(async () => {
    mockValidateUserStoryService = {
      validateUserStory: jest.fn(),
    } as unknown as jest.Mocked<ValidateUserStoryService>;

    mockToastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    mockFeatureFlagResolver = {
      isFeatureEnabled: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<FeatureFlagResolver>;

    await MockBuilder(AddUserStoryModalComponent)
      .keep(ReactiveFormsModule)
      .mock(Button)
      .mock(Dialog)
      .mock(ValidateUserStoryService, mockValidateUserStoryService)
      .mock(ToastMessageService, mockToastMessageService)
      .mock(FeatureFlagResolver, mockFeatureFlagResolver);
  });

  beforeEach(() => {
    fixture = MockRender(AddUserStoryModalComponent, {
      userStoryIds: [existingId],
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  describe("Common", () => {
    it("Given feature flag is enabled, When component initializes, Then validation is enabled", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);

      component.ngOnInit();
      await Promise.resolve();

      expect(component.isValidationEnabled).toBe(true);
    });

    it("Given feature flag is disabled, When component initializes, Then validation is disabled", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);

      component.ngOnInit();
      await Promise.resolve();

      expect(component.isValidationEnabled).toBe(false);
    });

    it("Given feature flag check fails, When component initializes, Then validation is disabled by default", async () => {
      mockFeatureFlagResolver.isFeatureEnabled.mockRejectedValue(
        new Error("Feature flag error")
      );

      component.ngOnInit();
      await Promise.resolve();

      expect(component.isValidationEnabled).toBe(false);
    });

    it("Given existing user stories, When user enters a duplicate ID, Then form becomes invalid with duplicate error", () => {
      component.form.patchValue({ id: existingId });

      const idControl = component.form.get("id");
      expect(idControl?.hasError("idAlreadyExists")).toBe(true);
      expect(idControl?.valid).toBe(false);
    });

    it("Given empty ID field, When form is checked, Then form shows required error", () => {
      component.form.patchValue({ id: null });

      const idControl = component.form.get("id");
      expect(idControl?.hasError("required")).toBe(true);
    });

    it("Given modal with previous data and errors, When modal is opened, Then all state is reset", () => {
      component.form.patchValue({ id: "previous-id" });
      component.form.markAsDirty();
      component.validationErrorMessage = "Previous error";
      component.isLoading = true;

      component.show();

      expect(component.form.get("id")?.value).toBeNull();
      expect(component.form.pristine).toBe(true);
      expect(component.validationErrorMessage).toBeUndefined();
      expect(component.isLoading).toBe(false);
      expect(component.isModalVisible).toBe(true);
    });

    it("Given open modal, When user cancels, Then modal is closed", () => {
      component.isModalVisible = true;

      component.cancel();

      expect(component.isModalVisible).toBe(false);
    });

    it("Given validation error message is displayed, When user types in the input field, Then error message is removed", () => {
      component.validationErrorMessage = "Some error message";

      component.clearErrorMessage();

      expect(component.validationErrorMessage).toBeUndefined();
    });
  });

  describe("Without Validation", () => {
    beforeEach(() => {
      component.isValidationEnabled = false;
    });

    it("Given validation is disabled, When valid user story ID is submitted, Then user story is added and modal is closed", () => {
      const emitSpy = jest.spyOn(component.userStoryAddedEventEmitter, "emit");
      const newId = "US-789";

      component.form.patchValue({ id: newId });
      component.addUserStoryID();

      expect(emitSpy).toHaveBeenCalledWith(newId);
      expect(component.form.get("id")?.value).toBeNull();
      expect(component.isModalVisible).toBe(false);
    });
  });

  describe("With Validation", () => {
    beforeEach(() => {
      component.isValidationEnabled = true;
      component.projectId = projectId;
    });

    it("Given validation is enabled and we want to validate, When valid user story ID is submitted, Then user story is validated and added successfully", () => {
      component.shouldValidate = true;
      const emitSpy = jest.spyOn(component.userStoryAddedEventEmitter, "emit");
      const newId = "US-789";
      mockValidateUserStoryService.validateUserStory.mockReturnValue(
        of({ valid: true, errorMessage: "" })
      );

      component.form.patchValue({ id: newId });
      component.addUserStoryID();

      expect(
        mockValidateUserStoryService.validateUserStory
      ).toHaveBeenCalledWith(projectId, { userStoryId: newId });
      expect(emitSpy).toHaveBeenCalledWith(newId);
      expect(component.form.get("id")?.value).toBeNull();
      expect(component.isLoading).toBe(false);
      expect(component.isModalVisible).toBe(false);
    });

    it("Given validation is enabled but we don't want to validate, When user story ID is submitted, Then validation is skipped and user story is added directly", () => {
      component.shouldValidate = false;
      const emitSpy = jest.spyOn(component.userStoryAddedEventEmitter, "emit");
      const newId = "US-789";

      component.form.patchValue({ id: newId });
      component.addUserStoryID();

      expect(
        mockValidateUserStoryService.validateUserStory
      ).not.toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith(newId);
      expect(component.form.get("id")?.value).toBeNull();
      expect(component.isModalVisible).toBe(false);
    });

    it("Given validation is enabled and we want to validate, When validation fails with invalid user story, Then error message is displayed and modal remains open", () => {
      component.shouldValidate = true;
      const emitSpy = jest.spyOn(component.userStoryAddedEventEmitter, "emit");
      const newId = "US-789";
      const errorMessage = "User story does not exist in the system";
      mockValidateUserStoryService.validateUserStory.mockReturnValue(
        of({ valid: false, errorMessage })
      );

      component.isModalVisible = true;
      component.form.patchValue({ id: newId });
      component.addUserStoryID();

      expect(component.validationErrorMessage).toBe(errorMessage);
      expect(component.isLoading).toBe(false);
      expect(emitSpy).not.toHaveBeenCalled();
      expect(component.isModalVisible).toBe(true);
    });

    it("Given validation is enabled and we want to validate, When validation service fails for a technical error, Then toast error is shown and loading stops", () => {
      component.shouldValidate = true;
      const newId = "US-789";
      mockValidateUserStoryService.validateUserStory.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      component.form.patchValue({ id: newId });
      component.addUserStoryID();

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "Something went wrong. Please try again later."
      );
      expect(component.isLoading).toBe(false);
    });
  });
});
