import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  BusinessProcessNotificationsRecipientsInputComponent,
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
  DefinitionInputsValidators,
  DisplayMode,
  InputAccessMode,
  InputValidationMode,
  ProvidedInput,
} from "@mxflow/features/business-process";
import { Component, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";
import { ExecuteBackportProcessInput } from "./execute-backport-process-input";
import { Reviewer } from "@mxflow/features/scm";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { InputText } from "primeng/inputtext";
import { ReviewersAutoCompleteComponent } from "@mxflow/features/scm-management";
import { UserStoryInputComponent } from "@mxflow/ui/inputs";
import { WhitespaceValidators } from "@mxflow/validator";

@Component({
  selector: "mxevolve-execute-backport-process-input",
  templateUrl: "execute-backport-process-input.component.html",
  imports: [
    ReactiveFormsModule,
    MandatoryFieldModule,
    DefinitionInputComponent,
    InputText,
    ReviewersAutoCompleteComponent,
    BusinessProcessNotificationsRecipientsInputComponent,
    DefinitionInputGroupComponent,
    UserStoryInputComponent,
  ],
})
export class ExecuteBackportProcessInputComponent implements OnDestroy {
  form: FormGroup<ExecuteBuildAndTestProcessInputControls>;
  projectId: string;
  isFormInitialized = false;

  nameFormControl: FormControl<string | null>;
  pullRequestIdFormControl: FormControl<string | null>;
  userStoryIdsFormControl: FormControl<string[] | null>;
  pullRequestTitleFormControl: FormControl<string | null>;
  pullRequestReviewersFormControl: FormControl<Reviewer[] | null>;
  notificationsRecipientsFormControl: FormControl<string[] | null>;
  userStoriesFormControls: FormControl[] = [];

  private readonly destroy$ = new Subject();

  initializeForm(projectId: string, providedInputs: ProvidedInput[]) {
    this.projectId = projectId;

    this.nameFormControl = new FormControl(null, [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]);

    this.pullRequestIdFormControl = new FormControl(
      null,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.userStoryIdsFormControl = new FormControl(
      null,
      DefinitionInputsValidators.standardMultiSelectInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.pullRequestTitleFormControl = new FormControl(
      null,
      DefinitionInputsValidators.standardSelectableInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.pullRequestReviewersFormControl = new FormControl(
      null,
      DefinitionInputsValidators.standardMultiSelectInputValidators(
        InputValidationMode.VALIDATE_ALL_FIELDS
      )
    );
    this.notificationsRecipientsFormControl = new FormControl(
      this.getProvidedInput(providedInputs, "notificationsRecipients")
    );

    this.userStoriesFormControls = [this.userStoryIdsFormControl];

    this.form = new FormGroup({
      name: this.nameFormControl,
      pullRequestId: this.pullRequestIdFormControl,
      userStoryIds: this.userStoryIdsFormControl,
      pullRequestTitle: this.pullRequestTitleFormControl,
      pullRequestReviewers: this.pullRequestReviewersFormControl,
      notificationsRecipients: this.notificationsRecipientsFormControl,
    });

    this.isFormInitialized = true;
  }

  resetForm() {
    this.form.reset();
    this.isFormInitialized = false;
  }

  ngOnDestroy() {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  getExecuteBackportProcessInput(): ExecuteBackportProcessInput {
    return {
      name: this.nameFormControl.value,
      pullRequestId: this.pullRequestIdFormControl.value,
      userStoryIds: this.userStoryIdsFormControl.value,
      pullRequestTitle: this.pullRequestTitleFormControl.value,
      pullRequestReviewers: this.pullRequestReviewersFormControl.value,
      notificationsRecipients: this.notificationsRecipientsFormControl.value,
    } as ExecuteBackportProcessInput;
  }

  private getProvidedInput(providedInputs: ProvidedInput[], inputId: string) {
    return providedInputs.find(
      (providedInput) => providedInput.inputId == inputId
    )?.value;
  }

  protected readonly DisplayMode = DisplayMode;
  protected readonly InputAccessMode = InputAccessMode;
  protected readonly Validators = Validators;
}

interface ExecuteBuildAndTestProcessInputControls {
  name: FormControl<string | null>;
  pullRequestId: FormControl<string | null>;
  userStoryIds: FormControl<string[] | null>;
  pullRequestTitle: FormControl<string | null>;
  pullRequestReviewers: FormControl<Reviewer[] | null>;
  notificationsRecipients: FormControl<string[] | null>;
}
