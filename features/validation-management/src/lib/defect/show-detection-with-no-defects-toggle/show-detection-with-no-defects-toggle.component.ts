import { Component, computed, input, model } from "@angular/core";
import { ToggleSwitch } from "primeng/toggleswitch";
import { ValidationScope } from "@mxflow/features/validation-management";
import { FormsModule } from "@angular/forms";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-show-detection-with-no-defects-toggle",
  imports: [ToggleSwitch, FormsModule, Tooltip],
  templateUrl: "./show-detection-with-no-defects-toggle.component.html",
})
export class ShowDetectionWithNoDefectsToggleComponent {
  detectionType = input.required<string>();
  detectionCategory = input.required<string>();
  warningMessage = input<string | undefined>(undefined);

  showDetectionsWithoutDefects = model<boolean>(false);
  validationScope = model<ValidationScope | undefined>(undefined);

  toggleLabel = computed(
    () => `Show ${this.detectionCategory()}s With No Defects`
  );
  tooltipMessage = computed(
    () =>
      `Cannot toggle since all ${this.detectionType()} ${this.detectionCategory()}s are displayed`
  );
}
