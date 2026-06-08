import { Component, Input, OnInit } from "@angular/core";
import { DividerModule } from "primeng/divider";
import { FormControl } from "@angular/forms";
import { InputAccessMode } from "../definition-input/input-access-mode";

@Component({
  selector: "mxevolve-definition-input-group",
  template: `
    @if (shouldShow) {
    <div>
      <p-divider align="left" type="solid">
        <h3 class="  text-lg font-semibold">{{ label }}</h3>
      </p-divider>
      <div>
        <ng-content></ng-content>
      </div>
    </div>
    }
  `,
  imports: [DividerModule],
})
export class DefinitionInputGroupComponent implements OnInit {
  @Input({ required: true }) label: string;
  @Input({ required: true }) formControls: FormControl[];
  @Input({ required: true }) inputAccessMode: InputAccessMode;
  @Input() forceShow = false;

  shouldShow = false;

  ngOnInit(): void {
    this.shouldShow =
      this.forceShow ||
      this.inputAccessMode === InputAccessMode.ACCESS_ALL_INPUTS ||
      (this.inputAccessMode === InputAccessMode.ACCESS_INVALID_INPUTS_ONLY &&
        this.formControls.some((control) => control.invalid)) ||
      (this.inputAccessMode === InputAccessMode.ACCESS_EMPTY_OPTIONAL_INPUTS &&
        this.someFormControlEmpty());
  }

  protected readonly InputAccessMode = InputAccessMode;

  private someFormControlEmpty(): boolean {
    return this.formControls.some(
      (inputFormControl) =>
        inputFormControl.value === null ||
        inputFormControl.value === undefined ||
        inputFormControl.value === "" ||
        (Array.isArray(inputFormControl.value) &&
          inputFormControl.value.length === 0)
    );
  }
}
