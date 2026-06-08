import { Component, Input } from "@angular/core";
import { DividerModule } from "primeng/divider";
import { IncidentSummary } from "./incident-summary.model";

import { IncidentStatusesTotalCountPipe } from "./incident-statuses-total-count.pipe";
import { SkeletonModule } from "primeng/skeleton";

@Component({
  imports: [DividerModule, IncidentStatusesTotalCountPipe, SkeletonModule],
  selector: "mxevolve-incidents-summary",
  templateUrl: "./incidents-summary.component.html",
})
export class IncidentsSummaryComponent {
  @Input({ required: true }) incidentSummary: IncidentSummary;
  @Input() isLoading: boolean;
}
