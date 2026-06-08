import { Component, Input } from "@angular/core";
import { QualityGateValidationDecision } from "../quality-gate-validation-result";

@Component({
  imports: [],
  selector: "mxflow-quality-gate-validation-status",
  templateUrl: "./quality-gate-validation-status.component.html",
  styleUrls: ["./quality-gate-validation-status.component.scss"],
})
export class QualityGateValidationStatusComponent {
  readonly validationDecision = QualityGateValidationDecision;

  @Input() decision: QualityGateValidationDecision;
}
