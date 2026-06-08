import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { WhitespaceValidators } from "@mxflow/validator";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { ConfigurationImpactService } from "../configuration-impact.service";
import { finalize, Subject, takeUntil } from "rxjs";
import { ConfigurationImpact } from "../model/configuration-impact";
import { EditConfigurationImpactRequest } from "./edit-configuration-impact-request.model";
import { SkeletonModule } from "primeng/skeleton";
import { QuillEditorComponent } from "@mxflow/ui/editor";

@Component({
  selector: "mxevolve-edit-configuration-impact-modal",
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ReactiveFormsModule,
    MandatoryFieldModule,
    InputTextModule,
    TextareaModule,
    SkeletonModule,
    QuillEditorComponent,
  ],
  providers: [ConfigurationImpactService],
  templateUrl: "./edit-configuration-impact-modal.component.html",
})
export class EditConfigurationImpactModalComponent
  implements OnInit, OnDestroy
{
  private configurationImpactService = inject(ConfigurationImpactService);
  private toastMessageService = inject(ToastMessageService);

  private _isModalShown: boolean;

  @Input({ required: true }) set isModalShown(value: boolean) {
    this._isModalShown = value;
    if (value === true) {
      this.fetchConfigurationImpact();
    }
  }

  get isModalShown(): boolean {
    return this._isModalShown;
  }

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) configurationImpactId: string;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() configurationImpactEdited = new EventEmitter<void>();

  private readonly destroy$ = new Subject();
  isFormLoading = false;
  isButtonLoading = false;
  editConfigurationImpactForm: FormGroup<EditConfigurationImpactForm> =
    new FormGroup<EditConfigurationImpactForm>({
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

  ngOnInit(): void {
    this.editConfigurationImpactForm.controls.guiltyChange.disable();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onCancel() {
    this.closeModalEvent.emit();
  }

  onFormSubmission() {
    this.isButtonLoading = true;
    this.configurationImpactService
      .update(this.projectId, this.configurationImpactId, this.getEditRequest())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Configuration impact edited successfully"
          );
          this.configurationImpactEdited.emit();
          this.closeModalEvent.emit();
          this.isButtonLoading = false;
        },
        error: (error) => {
          this.displayErrorMessage(error.message);
          this.isButtonLoading = false;
        },
      });
  }

  private fetchConfigurationImpact(): void {
    this.isFormLoading = true;
    this.configurationImpactService
      .fetch(this.projectId, this.configurationImpactId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isFormLoading = false;
        })
      )
      .subscribe({
        next: (configurationImpact) => {
          this.intitalizeForm(configurationImpact);
        },
        error: (error) => {
          this.displayErrorMessage(error.message);
        },
      });
  }

  private getEditRequest(): EditConfigurationImpactRequest {
    const formValue = this.editConfigurationImpactForm.value;
    return {
      title: formValue.title as string,
      description: formValue.description as string,
    };
  }

  private intitalizeForm(configurationImpact: ConfigurationImpact) {
    this.editConfigurationImpactForm.setValue({
      title: configurationImpact.title,
      description: configurationImpact.description,
      guiltyChange: configurationImpact.guiltyChange,
    });
  }

  private displayErrorMessage(error: string) {
    this.toastMessageService.showError(error);
  }
}

export interface EditConfigurationImpactForm {
  title: AbstractControl<string | null>;
  description: AbstractControl<string | null>;
  guiltyChange: AbstractControl<string | null>;
}
