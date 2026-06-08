import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { NgTemplateOutlet } from "@angular/common";
import { PaginatorModule } from "primeng/paginator";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { ConfigurationRegression } from "../model/configuration-regression";
import { ConfigurationRegressionService } from "../configuration-regression.service";
import { EditConfigurationRegressionRequest } from "./edit-configuration-regression-request";
import { SkeletonModule } from "primeng/skeleton";
import { finalize } from "rxjs";
import { QuillEditorComponent } from "@mxflow/ui/editor";

@Component({
  selector: "mxevolve-edit-configuration-regression-modal",
  templateUrl: "./edit-configuration-regression-modal.component.html",
  imports: [
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    MandatoryFieldModule,
    PaginatorModule,
    ReactiveFormsModule,
    NgTemplateOutlet,
    SkeletonModule,
    QuillEditorComponent,
  ],
})
export class EditConfigurationRegressionModalComponent implements OnInit {
  private toastMessageService = inject(ToastMessageService);
  private configurationRegressionService = inject(
    ConfigurationRegressionService
  );

  private _isModalShown: boolean;

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) configurationRegressionId: string;

  @Input({ required: true }) set isModalShown(value: boolean) {
    this._isModalShown = value;
    if (value === true) {
      this.fetchConfigurationRegression();
    }
  }

  get isModalShown() {
    return this._isModalShown;
  }

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() configurationRegressionEdited = new EventEmitter<void>();

  isLoading = false;
  isEditingLoading = false;
  editConfigurationRegressionForm: FormGroup<EditConfigurationRegressionForm> =
    new FormGroup<EditConfigurationRegressionForm>({
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

  ngOnInit(): void {
    this.editConfigurationRegressionForm.controls.guiltyChange.disable();
  }

  onCancel() {
    this.closeModalEvent.emit();
  }

  onFormSubmission() {
    this.isEditingLoading = true;
    this.configurationRegressionService
      .update(
        this.projectId,
        this.configurationRegressionId,
        this.getEditRequest()
      )
      .subscribe({
        next: () => {
          this.isEditingLoading = false;
          this.toastMessageService.showSuccess(
            "Configuration regression edited successfully"
          );
          this.configurationRegressionEdited.emit();
          this.closeModalEvent.emit();
        },
        error: (errorMessage) => {
          this.toastMessageService.showError(errorMessage);
          this.isEditingLoading = false;
        },
      });
  }

  private fetchConfigurationRegression() {
    this.isLoading = true;
    this.configurationRegressionService
      .fetch(this.projectId, this.configurationRegressionId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (configurationRegression: ConfigurationRegression) => {
          this.initializeEditConfigurationRegressionForm(
            configurationRegression
          );
        },
        error: (errorMessage) => {
          this.toastMessageService.showError(errorMessage);
        },
      });
  }

  private getEditRequest(): EditConfigurationRegressionRequest {
    const formValue = this.editConfigurationRegressionForm.value;
    return {
      title: formValue.title as string,
      description: formValue.description as string,
      fix: formValue.fix as string,
    };
  }

  private initializeEditConfigurationRegressionForm(
    configurationRegression: ConfigurationRegression
  ) {
    this.editConfigurationRegressionForm.patchValue({
      title: configurationRegression.title,
      description: configurationRegression.description,
      fix: configurationRegression.fix,
      guiltyChange: configurationRegression.guiltyChange,
    });
  }
}

export interface EditConfigurationRegressionForm {
  title: AbstractControl<string | null>;
  description: AbstractControl<string | null>;
  guiltyChange: AbstractControl<string | null>;
  fix: AbstractControl<string | null>;
}
