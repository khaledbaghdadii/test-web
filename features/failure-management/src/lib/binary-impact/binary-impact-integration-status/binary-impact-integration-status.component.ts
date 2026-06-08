import { Component, Input } from "@angular/core";
import { TagModule } from "primeng/tag";
import {
  BinaryImpactIntegrationStatus,
  BinaryImpactIntegrationStatusDisplayValue,
} from "./binary-impact-integration-status";

@Component({
  imports: [TagModule],
  selector: "mxevolve-binary-impact-integration-status",
  templateUrl: "./binary-impact-integration-status.component.html",
  standalone: true,
})
export class BinaryImpactIntegrationStatusComponent {
  BinaryImpactIntegrationStatus = BinaryImpactIntegrationStatus;
  @Input() status: BinaryImpactIntegrationStatus;
  protected readonly BinaryImpactIntegrationStatusDisplayValue =
    BinaryImpactIntegrationStatusDisplayValue;
}
