import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from "@angular/core";

import { UpgradeImpactDetailsComponent } from "../upgrade-impact-details/upgrade-impact-details.component";
import { ButtonModule } from "primeng/button";
import { UpgradeImpactSelectionModalComponent } from "../upgrade-impact-selection-modal/upgrade-impact-selection-modal.component";
import { InputTextModule } from "primeng/inputtext";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { UpgradeImpact } from "../model/upgrade-impact.model";
import { AccordionModule } from "primeng/accordion";
import { ValidationScope } from "@mxflow/features/validation-management";
import { PanelModule } from "primeng/panel";
import { Tooltip } from "primeng/tooltip";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
@Component({
  selector: "mxevolve-upgrade-impact-input",
  imports: [
    ButtonModule,
    UpgradeImpactSelectionModalComponent,
    UpgradeImpactDetailsComponent,
    InputTextModule,
    AccordionModule,
    PanelModule,
    Tooltip,
    InputGroupModule,
    InputGroupAddonModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UpgradeImpactInputComponent),
      multi: true,
    },
  ],
  templateUrl: "./upgrade-impact-input.component.html",
})
export class UpgradeImpactInputComponent implements ControlValueAccessor {
  isDisabled = false;
  isUpgradeImpactModalVisible = false;
  selectedUpgradeImpact: UpgradeImpact | null = null;
  private _selectedUpgradeImpactId: string | null = null;

  @Input() validationScope?: ValidationScope;
  @Input() initialValidationScope?: ValidationScope;
  @Input() warningMessage?: string;
  @Output() errorMessage: EventEmitter<string> = new EventEmitter();

  set selectedUpgradeImpactId(value: string | null) {
    this._selectedUpgradeImpactId = value;
    if (!value) {
      this.selectedUpgradeImpact = null;
    }
  }
  get selectedUpgradeImpactId(): string | null {
    return this._selectedUpgradeImpactId;
  }

  onChange = (value: string | null) => {};
  onTouched = () => {};

  writeValue(upgradeImpactId: string | undefined | null): void {
    this.selectedUpgradeImpactId = upgradeImpactId ?? null;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.isDisabled = isDisabled;
  }

  showUpgradeImpactModal() {
    this.isUpgradeImpactModalVisible = true;
  }

  handleSelectedUpgradeImpactChange(upgradeImpactId: string | undefined) {
    this.selectedUpgradeImpactId = upgradeImpactId ?? null;
    this.onChange(this.selectedUpgradeImpactId);
    this.onTouched();
  }

  handleErrorMessage(errorMessage: string) {
    this.errorMessage.emit(errorMessage);
  }

  handleSetSelectedUpgradeImpact(upgradeImpact: UpgradeImpact) {
    this.selectedUpgradeImpact = upgradeImpact;
  }

  clearSelectedUpgradeImpact() {
    this.selectedUpgradeImpactId = null;
    this.selectedUpgradeImpact = null;
    this.onChange(this.selectedUpgradeImpactId);
    this.onTouched();
  }
}
