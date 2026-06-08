import { Component, Input } from "@angular/core";

import { UiCollapsibleMessageModule } from "@mxflow/ui/collapsible-message";
import { InputProviderModule } from "@mxflow/ui/input-provider";
import { QualityGateValidationStatusComponent } from "../quality-gate-validation-status/quality-gate-validation-status.component";
import { QualityGateValidationResult } from "../quality-gate-validation-result";
import { StepResultModule } from "@mxflow/ui/utils";
import { Panel } from "primeng/panel";

@Component({
  imports: [
    QualityGateValidationStatusComponent,
    UiCollapsibleMessageModule,
    InputProviderModule,
    StepResultModule,
    Panel,
  ],
  selector: "mxflow-quality-gate-validation-result",
  templateUrl: "./quality-gate-validation-result.component.html",
  styleUrls: ["./quality-gate-validation-result.component.css"],
})
export class QualityGateValidationResultComponent {
  @Input() validationResult: QualityGateValidationResult;
}
