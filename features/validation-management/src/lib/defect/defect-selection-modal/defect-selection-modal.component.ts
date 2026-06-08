import { Component, effect, input, model, output } from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { DefectSelectionTableComponent } from "../defect-selection-table/defect-selection-table.component";

import { ValidationScope } from "../../validation-scope/model/validation-scope.model";
import { ButtonModule } from "primeng/button";
import { Defect } from "../model/defect.model";
import { MessageModule } from "primeng/message";
import { ValidationScopeSetterComponent } from "../../validation-scope/validation-scope-setter/validation-scope-setter.component";

@Component({
  selector: "mxevolve-defect-selection-modal",
  imports: [
    DialogModule,
    DefectSelectionTableComponent,
    MessageModule,
    ButtonModule,
    ValidationScopeSetterComponent,
  ],
  templateUrl: "./defect-selection-modal.component.html",
})
export class DefectSelectionModalComponent {
  isVisible = model<boolean>(false);
  warningMessage = model<string | undefined>(undefined);
  validationScope = model<ValidationScope | undefined>(undefined);
  initialValidationScope = input<ValidationScope | undefined>(undefined);
  hideSelection = input<boolean>(false);
  defectSelectedChange = output<string>();
  errorMessage = output<string>();

  defectSelected: Defect;
  warningMessageBanner?: string;

  constructor() {
    effect(() => {
      const warningMessage = this.warningMessage();
      if (this.isVisible() && warningMessage)
        this.handleWarningMessage(warningMessage);
    });
  }

  selectDefect(defect: Defect) {
    this.defectSelected = defect;
  }

  onSelect() {
    this.defectSelectedChange.emit(this.defectSelected.id);
    this.hideModal();
  }

  hideModal() {
    this.warningMessageBanner = "";
    this.warningMessage.set(undefined);
    this.isVisible.set(false);
  }

  handleErrorMessage(errorMessage: string) {
    this.errorMessage.emit(errorMessage);
  }

  handleWarningMessage(warningMessage: string | undefined) {
    this.warningMessageBanner = warningMessage;
  }
}
