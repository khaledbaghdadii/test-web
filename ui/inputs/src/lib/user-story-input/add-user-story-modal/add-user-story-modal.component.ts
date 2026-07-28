import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { NgClass, NgTemplateOutlet } from "@angular/common";
import { InputText } from "primeng/inputtext";
import { PrimeTemplate } from "primeng/api";
import { ValidateUserStoryService } from "../../../../../../features/business-process/src/lib/user-story-validation/validate-user-story.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

@Component({
  selector: "mxevolve-add-user-story-modal",
  templateUrl: "add-user-story-modal.component.html",
  imports: [
    Button,
    Dialog,
    ReactiveFormsModule,
    NgClass,
    NgTemplateOutlet,
    InputText,
    PrimeTemplate,
  ],
})
export class AddUserStoryModalComponent implements OnInit {
  USER_STORY_VALIDATION_AND_TRANSITION_FEATURE_FLAG =
    "user-story-validation-and-transition";

  isValidationEnabled = false;
  isModalVisible = false;
  isLoading = false;
  validationErrorMessage: string | undefined = undefined;
  form: UntypedFormGroup;

  @Input() userStoryIds: string[] = [];
  @Input() projectId: string;
  @Input() shouldValidate = false;
  @Output() userStoryAddedEventEmitter = new EventEmitter<string>();

  private readonly formBuilder: UntypedFormBuilder = inject(UntypedFormBuilder);
  private readonly userStoryValidator: ValidateUserStoryService = inject(
    ValidateUserStoryService
  );
  private readonly messageService: ToastMessageService =
    inject(ToastMessageService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);

  constructor() {
    this.form = this.formBuilder.group({
      id: [
        null,
        [Validators.required, this.userStoryIdAlreadyExistsValidator()],
      ],
    });
  }

  ngOnInit() {
    this.featureFlagResolver
      .isFeatureEnabled(
        this.projectId,
        this.USER_STORY_VALIDATION_AND_TRANSITION_FEATURE_FLAG
      )
      .then((enabled: boolean) => {
        this.isValidationEnabled = enabled;
      })
      .catch(() => {
        this.isValidationEnabled = false;
      });
  }

  userStoryIdAlreadyExistsValidator(): ValidatorFn {
    return (control) => {
      const idAlreadyExists = this.userStoryIds.some(
        (userStoryId) => control.value === userStoryId
      );

      return idAlreadyExists ? { idAlreadyExists: true } : null;
    };
  }

  showInvalidInputs() {
    Object.values(this.form.controls).forEach((control) => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  addUserStoryID() {
    if (this.form.valid) {
      if (this.isValidationEnabled && this.shouldValidate) {
        this.validateUserStoryAndAddIt();
      } else {
        this.addUserStory();
      }
    } else {
      this.showInvalidInputs();
    }
  }

  private validateUserStoryAndAddIt() {
    this.isLoading = true;
    if (this.projectId) {
      this.userStoryValidator
        .validateUserStory(this.projectId, { userStoryId: this.form.value.id })
        .subscribe({
          next: (result) => {
            if (result.valid) {
              this.addUserStory();
            } else {
              this.validationErrorMessage = result.errorMessage;
              this.isLoading = false;
            }
          },
          error: () => {
            this.messageService.showError(
              "Something went wrong. Please try again later."
            );
            this.isLoading = false;
          },
        });
    }
  }

  private addUserStory() {
    this.userStoryAddedEventEmitter.emit(this.form.value.id);
    this.resetCompState();
  }

  private resetCompState() {
    this.form.reset();
    this.isModalVisible = false;
    this.validationErrorMessage = undefined;
    this.isLoading = false;
  }

  clearErrorMessage() {
    this.validationErrorMessage = undefined;
  }

  show() {
    this.form.reset();
    this.validationErrorMessage = undefined;
    this.isLoading = false;
    this.isModalVisible = true;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  cancel() {
    this.isModalVisible = false;
  }
}
