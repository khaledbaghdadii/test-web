import { Component, Input } from "@angular/core";

@Component({
  selector: "mxflow-integrate-changes-decision",
  templateUrl: "integrate-changes-decision.component.html",
  standalone: false,
})
export class IntegrateChangesDecisionComponent {
  @Input() requester: string;
}
