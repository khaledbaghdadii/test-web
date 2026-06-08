import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { WhitespaceValidators } from "@mxflow/validator";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { CreateBinaryRegressionRequest } from "./create-binary-regression-request.model";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import {
  DefectSelectionInputComponent,
  ValidationScope,
} from "@mxflow/features/validation-management";
import { IncidentInputComponent } from "@mxflow/features/incident-management";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { finalize } from "rxjs";

@Component({
  selector: "mxevolve-create-binary-regression-modal",
  templateUrl: "./create-binary-regression-modal.component.html",
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    MandatoryFieldModule,
    ReactiveFormsModule,
    QuillEditorComponent,
    DefectSelectionInputComponent,
    IncidentInputComponent,
  ],
  providers: [BinaryRegressionDataService],
})
export class CreateBinaryRegressionModalComponent {
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly binaryRegressionService = inject(
    BinaryRegressionDataService
  );

  private _isVisible = false;
  createBinaryRegressionForm: FormGroup<CreateBinaryRegressionForm>;
  isLoading = false;
  isBinaryRegressionCreated = false;

  @Input({ required: true }) projectId: string;
  @Input() validationScope?: ValidationScope;
  @Input() initialValidationScope?: ValidationScope;
  @Input() warningMessage?: string;
  private _submitCreationButtonLabel: string;
  @Input()
  set submitCreationButtonLabel(submitCreationButtonLabel: string | undefined) {
    this._submitCreationButtonLabel = submitCreationButtonLabel ?? "Create";
  }
  get submitCreationButtonLabel(): string {
    return this._submitCreationButtonLabel;
  }
  @Input() mxVersionInitialValue: string | null;
  @Input() set isVisible(value: boolean) {
    this._isVisible = value;
    if (this.mxVersionInitialValue) {
      this.initializeMxVersion();
    }
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  @Output() binaryRegressionCreated = new EventEmitter<string>();
  @Output() createBinaryRegressionCancelled = new EventEmitter<void>();

  constructor() {
    this.createBinaryRegressionForm = new FormGroup<CreateBinaryRegressionForm>(
      {
        title: new FormControl<string | null>(null, [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ]),
        description: new FormControl<string | null>(null, [
          Validators.required,
          WhitespaceValidators.notBlank(),
        ]),
        defect: new FormControl<string | null>(null, [
          Validators.maxLength(255),
        ]),
        mxVersion: new FormControl<string | null>(null, [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ]),
        fix: new FormControl<string | null>(null, [Validators.maxLength(255)]),
        incidentId: new FormControl<string | null>(null, []),
      }
    );
  }

  private initializeMxVersion() {
    this.createBinaryRegressionForm.controls.mxVersion.setValue(
      this.mxVersionInitialValue
    );
  }

  onFormSubmission() {
    const formValues = this.createBinaryRegressionForm.value;
    const request = {
      title: formValues.title ?? "",
      description: formValues.description ?? "",
      defect: formValues.defect ?? undefined,
      mxVersion: formValues.mxVersion ?? "",
      fix: formValues.fix ?? undefined,
      incidentId: formValues.incidentId ?? undefined,
    };
    this.onSubmitCreateBinaryRegression(request);
  }

  onCancel() {
    this.createBinaryRegressionForm.reset({
      title: null,
      description: null,
      defect: null,
      fix: null,
      mxVersion: null,
      incidentId: null,
    });
    if (!this.isBinaryRegressionCreated) {
      this.isVisible = false;
      this.createBinaryRegressionCancelled.emit();
    } else {
      this.isBinaryRegressionCreated = false;
    }
  }

  private onSubmitCreateBinaryRegression = (
    request: CreateBinaryRegressionRequest
  ) => {
    this.isLoading = true;
    this.binaryRegressionService
      .createBinaryRegression(this.projectId, request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.toastMessageService.showSuccess(
            `The Binary Regression ${request.title} was created successfully.`
          );
          this.isBinaryRegressionCreated = true;
          this.binaryRegressionCreated.emit(response);
        },
        error: (error) => {
          this.handleErrorOccurred(error.message);
        },
      });
  };

  handleErrorOccurred(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }
}

interface CreateBinaryRegressionForm {
  title: FormControl<string | null>;
  description: FormControl<string | null>;
  defect: FormControl<string | null>;
  mxVersion: FormControl<string | null>;
  fix: FormControl<string | null>;
  incidentId: FormControl<string | null>;
}
