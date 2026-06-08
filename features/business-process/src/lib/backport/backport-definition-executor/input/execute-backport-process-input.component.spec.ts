import { TestBed } from "@angular/core/testing";
import { Validators } from "@angular/forms";
import { ExecuteBackportProcessInputComponent } from "./execute-backport-process-input.component";
import {
  DefinitionInputsValidators,
  InputValidationMode,
} from "@mxflow/features/business-process";
import { Reviewer } from "@mxflow/features/scm";
import { v4 as uuidv4 } from "uuid";

describe("Execute backport process input component", () => {
  const projectId = uuidv4();
  const name = "Test Backport Process";
  const notificationsRecipients = [uuidv4(), uuidv4()];
  const pullRequestId = uuidv4();
  const userStoryIds = [uuidv4(), uuidv4()];
  const pullRequestTitle = uuidv4();
  const pullRequestReviewers: Reviewer[] = [
    { name: uuidv4(), displayName: uuidv4() },
  ];

  let component: ExecuteBackportProcessInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExecuteBackportProcessInputComponent],
    });
    const fixture = TestBed.createComponent(
      ExecuteBackportProcessInputComponent
    );
    component = fixture.componentInstance;
  });

  describe("On initialization", () => {
    it("should initialize form with provided notification recipients while leaving other fields empty", () => {
      component.initializeForm(projectId, [
        {
          inputId: "notificationsRecipients",
          value: notificationsRecipients,
        },
      ]);

      expect(component.projectId).toBe(projectId);
      expect(component.isFormInitialized).toBe(true);

      expect(component.nameFormControl).toBeDefined();
      expect(component.nameFormControl.value).toBeNull();

      expect(component.pullRequestIdFormControl).toBeDefined();
      expect(component.pullRequestIdFormControl.value).toBeNull();

      expect(component.userStoryIdsFormControl).toBeDefined();
      expect(component.userStoryIdsFormControl.value).toBeNull();

      expect(component.pullRequestTitleFormControl).toBeDefined();
      expect(component.pullRequestTitleFormControl.value).toBeNull();

      expect(component.pullRequestReviewersFormControl).toBeDefined();
      expect(component.pullRequestReviewersFormControl.value).toBeNull();

      expect(component.notificationsRecipientsFormControl).toBeDefined();
      expect(component.notificationsRecipientsFormControl.value).toEqual(
        notificationsRecipients
      );
    });

    it("should require name to be provided and not blank", () => {
      component.initializeForm(projectId, []);

      expect(
        component.form.controls.name.hasValidator(Validators.required)
      ).toBeTruthy();

      component.form.controls.name.setValue("");
      expect(component.form.controls.name.invalid).toBeTruthy();

      component.form.controls.name.setValue("   ");
      expect(component.form.controls.name.invalid).toBeTruthy();

      component.form.controls.name.setValue("Valid Name");
      expect(component.form.controls.name.valid).toBeTruthy();
    });

    it("should require pull request id to be provided", () => {
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );

      component.initializeForm(projectId, []);

      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.pullRequestId.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("should require pull request title to be provided", () => {
      const expectedValidators =
        DefinitionInputsValidators.standardSelectableInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );

      component.initializeForm(projectId, []);

      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.pullRequestTitle.hasValidator(validator)
        ).toBeTruthy();
      });
    });

    it("should require at least one user story to be selected", () => {
      const expectedValidators =
        DefinitionInputsValidators.standardMultiSelectInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );

      component.initializeForm(projectId, []);

      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.userStoryIds.hasValidator(validator)
        ).toBeTruthy();
      });
    });
    it("should require at least one reviewer to be selected", () => {
      const expectedValidators =
        DefinitionInputsValidators.standardMultiSelectInputValidators(
          InputValidationMode.VALIDATE_ALL_FIELDS
        );

      component.initializeForm(projectId, []);

      expectedValidators.forEach((validator) => {
        expect(
          component.form.controls.pullRequestReviewers.hasValidator(validator)
        ).toBeTruthy();
      });
    });
  });

  it("should clear all form fields when cancelled", () => {
    component.initializeForm(projectId, []);
    component.form.patchValue({
      name: name,
      pullRequestId: pullRequestId,
      userStoryIds: userStoryIds,
    });

    component.resetForm();

    expect(component.form.controls.name.value).toBeNull();
    expect(component.form.controls.pullRequestId.value).toBeNull();
    expect(component.form.controls.userStoryIds.value).toBeNull();
    expect(component.isFormInitialized).toStrictEqual(false);
  });

  it("should capture all user provided backport details for process execution", () => {
    component.initializeForm(projectId, []);
    component.form.patchValue({
      name: name,
      pullRequestId: pullRequestId,
      pullRequestTitle: pullRequestTitle,
      userStoryIds: userStoryIds,
      notificationsRecipients: notificationsRecipients,
      pullRequestReviewers: pullRequestReviewers,
    });

    const result = component.getExecuteBackportProcessInput();

    expect(result).toEqual({
      name: name,
      pullRequestId: pullRequestId,
      pullRequestTitle: pullRequestTitle,
      userStoryIds: userStoryIds,
      notificationsRecipients: notificationsRecipients,
      pullRequestReviewers: pullRequestReviewers,
    });
  });
});
