import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from "@angular/core";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { DefectSelectionModalComponent } from "../defect-selection-modal/defect-selection-modal.component";
import { ValidationScope } from "../../validation-scope/model/validation-scope.model";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-defect-selection-input",
  imports: [
    ButtonModule,
    InputTextModule,
    DefectSelectionModalComponent,
    Tooltip,
  ],
  templateUrl: "./defect-selection-input.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DefectSelectionInputComponent),
      multi: true,
    },
  ],
})
export class DefectSelectionInputComponent implements ControlValueAccessor {
  @Input() validationScope?: ValidationScope;
  @Input() initialValidationScope?: ValidationScope;
  @Input() warningMessage?: string;
  @Output() errorMessage: EventEmitter<string> = new EventEmitter();

  isDefectModalVisible = false;
  selectedDefectId: string | null = null;

  showDefectModal() {
    this.isDefectModalVisible = true;
  }

  handleSelectedDefectChange(defectId: string) {
    this.selectedDefectId = defectId;
    this.onChange(defectId);
    this.onTouched();
  }

  handleErrorMessage(errorMessage: string) {
    this.errorMessage.emit(errorMessage);
  }

  onChange: (value: string) => void;
  onTouched: () => void;

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  writeValue(defectId: string | undefined | null): void {
    if (defectId) {
      this.selectedDefectId = defectId;
    } else {
      this.selectedDefectId = null;
    }
  }
}
