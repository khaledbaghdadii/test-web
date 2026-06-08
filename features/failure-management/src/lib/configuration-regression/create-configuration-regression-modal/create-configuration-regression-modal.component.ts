import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { PaginatorModule } from "primeng/paginator";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { CreateConfigurationRegressionRequest } from "./create-configuration-regression-request";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { CreateConfigurationRegressionResponse } from "../model/create-configuration-regression-response.model";
import { finalize } from "rxjs";
import { ConfigurationRegressionService } from "../configuration-regression.service";

@Component({
  selector: "mxevolve-create-configuration-regression-modal",
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    MandatoryFieldModule,
    PaginatorModule,
    ReactiveFormsModule,
    QuillEditorComponent,
  ],
  providers: [ConfigurationRegressionService],
  templateUrl: "./create-configuration-regression-modal.component.html",
})
export class CreateConfigurationRegressionModalComponent {
  private toastMessageService = inject(ToastMessageService);
  private configurationRegressionService = inject(
    ConfigurationRegressionService
  );

  private _isVisible = false;
  private isConfigurationRegressionCreated = false;

  @Input({ required: true }) projectId: string;
  @Input({ required: true })
  set isVisible(value: boolean) {
    this._isVisible = value;
    this.isVisibleChange.emit(value);
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  @Output() isVisibleChange = new EventEmitter<boolean>();

  @Input() isLoading = false;

  @Output() configurationRegressionCreated =
    new EventEmitter<CreateConfigurationRegressionResponse>();
  @Output() createConfigurationRegressionCancelled = new EventEmitter<void>();

  createConfigurationRegressionForm: FormGroup<CreateConfigurationRegressionForm> =
    new FormGroup<CreateConfigurationRegressionForm>({
      title: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      description: new FormControl<string | null>(null, [
        Validators.required,
        WhitespaceValidators.notBlank(),
      ]),
      guiltyChange: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      fix: new FormControl<string | null>(null, [Validators.maxLength(255)]),
    });

  private _submitCreationButtonLabel: string;
  @Input()
  set submitCreationButtonLabel(submitCreationButtonLabel: string | undefined) {
    this._submitCreationButtonLabel = submitCreationButtonLabel ?? "Create";
  }
  get submitCreationButtonLabel(): string {
    return this._submitCreationButtonLabel;
  }
  onFormSubmission() {
    const formValues = this.createConfigurationRegressionForm.value;
    this.onSubmitCreateConfigurationRegression({
      title: formValues.title ?? "",
      description: formValues.description ?? "",
      guiltyChange: formValues.guiltyChange ?? "",
      fix: formValues.fix ?? "",
    });
  }

  onCancel() {
    this.createConfigurationRegressionForm.reset({
      title: null,
      description: null,
      guiltyChange: null,
      fix: null,
    });
    if (!this.isConfigurationRegressionCreated) {
      this.isVisible = false;
      this.createConfigurationRegressionCancelled.emit();
    } else {
      this.isConfigurationRegressionCreated = false;
    }
  }

  handleErrorOccurred(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  private onSubmitCreateConfigurationRegression(
    request: CreateConfigurationRegressionRequest
  ) {
    this.isLoading = true;
    this.configurationRegressionService
      .create(this.projectId, request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.toastMessageService.showSuccess(
            `The Configuration Regression ${request.title} was created successfully.`
          );
          this.isConfigurationRegressionCreated = true;
          this.configurationRegressionCreated.emit({ id: response });
        },
        error: (error) => {
          this.handleErrorOccurred(error.message);
        },
      });
  }
}

export interface CreateConfigurationRegressionForm {
  title: AbstractControl<string | null>;
  description: AbstractControl<string | null>;
  guiltyChange: AbstractControl<string | null>;
  fix: AbstractControl<string | null>;
}
