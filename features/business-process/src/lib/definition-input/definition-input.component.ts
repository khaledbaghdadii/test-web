import { Component, Input, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { NgClass } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";
import { DefinitionInputErrorPipe } from "./definition-input-error-pipe/definition-input-error.pipe";
import { InputAccessMode } from "./input-access-mode";
import { DisplayMode } from "./display-mode";

@Component({
  selector: "mxevolve-definition-input",
  templateUrl: "definition-input.component.html",
  imports: [NgClass, TooltipModule, DefinitionInputErrorPipe],
})
export class DefinitionInputComponent implements OnInit {
  @Input({ required: true }) inputFormControlName: string;
  @Input({ required: true }) inputFormControl: FormControl;
  @Input() label: string;
  @Input({ required: true }) description: string;
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input({ required: true }) displayMode: DisplayMode;
  @Input() tooltip: string;
  @Input() forceShow = false;
  @Input() showValidationErrors = true;

  shouldShow = false;

  ngOnInit(): void {
    this.shouldShow =
      this.forceShow ||
      this.inputAccessMode === InputAccessMode.ACCESS_ALL_INPUTS ||
      (this.inputAccessMode === InputAccessMode.ACCESS_INVALID_INPUTS_ONLY &&
        this.inputFormControl.invalid) ||
      (this.inputAccessMode === InputAccessMode.ACCESS_EMPTY_OPTIONAL_INPUTS &&
        this.isFormControlEmpty());
  }

  protected readonly Validators = Validators;
  protected readonly InputAccessMode = InputAccessMode;
  protected readonly DisplayMode = DisplayMode;

  private isFormControlEmpty(): boolean {
    return (
      this.inputFormControl.value === null ||
      this.inputFormControl.value === undefined ||
      this.inputFormControl.value === "" ||
      (Array.isArray(this.inputFormControl.value) &&
        this.inputFormControl.value.length === 0)
    );
  }
}
