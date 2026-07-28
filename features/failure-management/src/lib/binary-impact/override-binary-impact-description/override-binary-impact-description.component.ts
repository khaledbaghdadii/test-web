import { Component, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RadioButtonModule } from "primeng/radiobutton";

interface OverrideBinaryImpactDescriptionOption {
  id: string;
  value: boolean;
  label: string;
  hint: string;
}

@Component({
  selector: "mxevolve-override-binary-impact-description",
  imports: [FormsModule, RadioButtonModule],
  templateUrl: "./override-binary-impact-description.component.html",
})
export class OverrideBinaryImpactDescriptionComponent {
  overrideBinaryImpactDescription = model<boolean | undefined>(undefined);

  required = input<boolean>(false);

  protected readonly options: OverrideBinaryImpactDescriptionOption[] = [
    {
      id: "useUpgradeImpactDescription",
      value: true,
      label: "Upgrade Impact Description",
      hint: "Selected upgrade impact description will be used as a baseline for the binary impact description",
    },
    {
      id: "keepExistingDescription",
      value: false,
      label: "Keep Existing Description",
      hint: "Use your manually entered description",
    },
  ];
}
