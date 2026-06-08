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
import { CreateConfigurationImpactRequest } from "./create-configuration-impact-request";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { ConfigurationImpactService } from "../configuration-impact.service";
import { finalize } from "rxjs";
import { CreateConfigurationImpactResponse } from "./create-configuration-impact-response";

@Component({
  selector: "mxevolve-create-configuration-impact-modal",
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
  providers: [ConfigurationImpactService],
  templateUrl: "./create-configuration-impact-modal.component.html",
})
export class CreateConfigurationImpactModalComponent {
  private toastMessageService = inject(ToastMessageService);
  private configurationImpactService = inject(ConfigurationImpactService);

  private _isVisible = false;
  private isConfigurationImpactCreated = false;

  @Input({ required: true }) projectId: string;
  @Input({ required: true })
  set isVisible(value: boolean) {
    this._isVisible = value;
    this.isVisibleChange.emit(value);
  }

  @Input() isLoading = false;

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() configurationImpactCreated =
    new EventEmitter<CreateConfigurationImpactResponse>();
  @Output() createConfigurationImpactCancelled = new EventEmitter<void>();

  get isVisible(): boolean {
    return this._isVisible;
  }

  createConfigurationImpactForm: FormGroup<CreateConfigurationImpactForm> =
    new FormGroup<CreateConfigurationImpactForm>({
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
    const formValues = this.createConfigurationImpactForm.value;
    this.onSubmitCreateConfigurationImpact({
      title: formValues.title ?? "",
      description: formValues.description ?? "",
      guiltyChange: formValues.guiltyChange ?? "",
    });
  }

  onCancel() {
    this.createConfigurationImpactForm.reset({
      title: null,
      description: null,
      guiltyChange: null,
    });
    if (!this.isConfigurationImpactCreated) {
      this.isVisible = false;
      this.createConfigurationImpactCancelled.emit();
    } else {
      this.isConfigurationImpactCreated = false;
    }
  }

  private onSubmitCreateConfigurationImpact(
    request: CreateConfigurationImpactRequest
  ) {
    this.isLoading = true;
    this.configurationImpactService
      .create(this.projectId, request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.toastMessageService.showSuccess(
            `The Configuration Impact ${request.title} was created successfully.`
          );
          this.isConfigurationImpactCreated = true;
          this.configurationImpactCreated.emit({ id: response });
        },
        error: (error) => {
          this.handleErrorOccurred(error.message);
        },
      });
  }

  private handleErrorOccurred(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }
}

export interface CreateConfigurationImpactForm {
  title: AbstractControl<string | null>;
  description: AbstractControl<string | null>;
  guiltyChange: AbstractControl<string | null>;
}
