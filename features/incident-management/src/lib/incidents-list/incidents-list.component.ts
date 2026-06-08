import { Component, computed, input } from "@angular/core";
import { Incident } from "@mxflow/features/incident-management";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: "mxevolve-incidents-list",
  templateUrl: "./incidents-list.component.html",
  imports: [TooltipModule],
})
export class IncidentsListComponent {
  incidents = input.required<Incident[]>();

  incidentsTooltip = computed<string>(() => {
    const incidents = this.incidents();
    if (incidents.length === 0) return "";
    return incidents.map((incident) => incident.externalIssue.id).join(", ");
  });
}
