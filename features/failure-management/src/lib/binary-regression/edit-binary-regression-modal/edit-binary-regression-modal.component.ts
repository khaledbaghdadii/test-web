import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { WhitespaceValidators } from "@mxflow/validator";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { BinaryRegressionDataService } from "../binary-regression-data.service";
import { BinaryRegression } from "../binary-regression";
import { SkeletonModule } from "primeng/skeleton";
import { EditBinaryRegressionRequest } from "./edit-binary-regression-request";
import { finalize, Subject } from "rxjs";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { DefectSelectionInputComponent } from "@mxflow/features/validation-management";
import { IncidentInputComponent } from "@mxflow/features/incident-management";

@Component({
  selector: "mxevolve-edit-binary-regression-modal",
  imports: [
    NgTemplateOutlet,
    DialogModule,
    ReactiveFormsModule,
    ButtonModule,
    MandatoryFieldModule,
    InputTextModule,
    TextareaModule,
    SkeletonModule,
    QuillEditorComponent,
    DefectSelectionInputComponent,
    IncidentInputComponent,
  ],
  providers: [BinaryRegressionDataService],
  templateUrl: "./edit-binary-regression-modal.component.html",
})
export class EditBinaryRegressionModalComponent implements OnInit, OnDestroy {
  private readonly binaryRegressionService = inject(
    BinaryRegressionDataService
  );
  private readonly toastMessageService = inject(ToastMessageService);

  private _isModalShown: boolean;
  private readonly destroy$ = new Subject();

  isFormLoading = false;
  isButtonLoading = false;
  isDefectSelectionDisabled = false;
  private originalDefectId: string | null = null;

  @Input({ required: true }) binaryRegressionId: string;

  @Input({ required: true }) set isModalShown(value: boolean) {
    this._isModalShown = value;
    if (value) {
      this.fetchBinaryRegression();
    }
  }

  get isModalShown() {
    return this._isModalShown;
  }

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() binaryRegressionEdited = new EventEmitter<void>();

  editBinaryRegressionForm: FormGroup<EditBinaryRegressionForm> =
    new FormGroup<EditBinaryRegressionForm>({
      title: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      description: new FormControl<string | null>(null, [
        Validators.required,
        WhitespaceValidators.notBlank(),
      ]),
      defect: new FormControl<string | null>(null, [Validators.maxLength(255)]),
      mxVersion: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      fix: new FormControl<string | null>(null, [
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      incidentId: new FormControl<string | null>(null, []),
    });

  ngOnInit(): void {
    this.disableNonUpdatableFields();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  fetchBinaryRegression() {
    this.isFormLoading = true;
    this.binaryRegressionService
      .getBinaryRegressionById(this.binaryRegressionId)
      .pipe(
        finalize(() => {
          this.isFormLoading = false;
        })
      )
      .subscribe({
        next: (binaryRegression: BinaryRegression) => {
          this.initializeEditForm(binaryRegression);
        },
        error: (error) => {
          this.displayErrorMessage(error);
        },
      });
  }

  onFormSubmission() {
    this.isButtonLoading = true;
    this.binaryRegressionService
      .update(this.binaryRegressionId, this.getEditRequest())
      .pipe(finalize(() => (this.isButtonLoading = false)))
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Binary regression edited successfully"
          );
          this.closeModalEvent.emit();
          this.binaryRegressionEdited.emit();
        },
        error: (error) => {
          this.displayErrorMessage(error);
        },
      });
  }

  private displayErrorMessage(error: string) {
    this.toastMessageService.showError(error);
  }

  private initializeEditForm(binaryRegression: BinaryRegression) {
    this.originalDefectId = binaryRegression.defect.id;
    this.editBinaryRegressionForm.patchValue({
      title: binaryRegression.title,
      description: binaryRegression.description,
      fix: binaryRegression.fix,
      defect: this.originalDefectId,
      mxVersion: binaryRegression.mxVersion,
      incidentId: binaryRegression.incidentId ?? null,
    });
    this.disableDefectFieldIfExists();
  }

  private disableNonUpdatableFields() {
    this.editBinaryRegressionForm.controls.mxVersion.disable();
  }

  private disableDefectFieldIfExists() {
    if (this.editBinaryRegressionForm.controls.defect.value) {
      this.isDefectSelectionDisabled = true;
      this.editBinaryRegressionForm.controls.defect.disable();
    }
  }

  private getEditRequest(): EditBinaryRegressionRequest {
    const formValue = this.editBinaryRegressionForm.value;
    const defect = this.editBinaryRegressionForm.controls.defect.disabled
      ? (this.originalDefectId as string)
      : (formValue.defect as string);
    return {
      title: formValue.title as string,
      description: formValue.description as string,
      fix: formValue.fix as string,
      defect: defect,
      incidentId: formValue.incidentId ?? undefined,
    };
  }

  handleCloseModal() {
    this.closeModalEvent.emit();
  }
}

export interface EditBinaryRegressionForm {
  title: AbstractControl<string | null>;
  description: AbstractControl<string | null>;
  defect: AbstractControl<string | null>;
  mxVersion: AbstractControl<string | null>;
  fix: AbstractControl<string | null>;
  incidentId: AbstractControl<string | null>;
}
