import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { TextareaModule } from "primeng/textarea";
import { CommonModule } from "@angular/common";
import { WhitespaceValidators } from "@mxflow/validator";
import { CreateFailureReasonRequest } from "./create-failure-reason-request";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ToggleSwitchModule } from "primeng/toggleswitch";

@Component({
  selector: "mxevolve-create-failure-reason-modal",
  imports: [
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    TextareaModule,
    CommonModule,
    ProgressSpinnerModule,
    MandatoryFieldModule,
    ToggleSwitchModule,
  ],
  templateUrl: "create-failure-reason-modal.component.html",
  styleUrls: ["create-failure-reason-modal.component.css"],
})
export class CreateFailureReasonModalComponent {
  @Input() isCreateFailureReasonModalShown = false;
  @Input() isLoading = false;

  @Output() failureReasonCreationSubmitted =
    new EventEmitter<CreateFailureReasonRequest>();
  @Output() failureReasonCreationCancelled = new EventEmitter<void>();

  failureReasonCreationForm: FormGroup<CreateFailureReasonForm> =
    new FormGroup<CreateFailureReasonForm>({
      title: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(250),
        WhitespaceValidators.notBlank(),
      ]),
      description: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(1000),
        WhitespaceValidators.notBlank(),
      ]),
      isEnabled: new FormControl<boolean>(true, [Validators.required]),
    });

  handleCreateFailureReasonSubmitted(): void {
    const userInput = this.failureReasonCreationForm.value;
    this.failureReasonCreationSubmitted.emit({
      title: userInput.title as string,
      description: userInput.description as string,
      isEnabled: userInput.isEnabled as boolean,
    });
  }

  handleCreateFailureReasonCancelled() {
    this.failureReasonCreationForm.reset({
      title: null,
      description: null,
      isEnabled: true,
    });
    this.failureReasonCreationCancelled.emit();
  }

  isCreateFailureReasonFormValid() {
    const userInput = this.failureReasonCreationForm.controls;
    return (
      userInput.title.valid &&
      userInput.description.valid &&
      userInput.isEnabled.valid
    );
  }
}

export interface CreateFailureReasonForm {
  title: AbstractControl<string | null>;
  description: AbstractControl<string | null>;
  isEnabled: AbstractControl<boolean | null>;
}
