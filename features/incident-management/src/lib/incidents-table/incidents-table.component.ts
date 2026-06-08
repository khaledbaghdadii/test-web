import { Component, EventEmitter, Input, Output } from "@angular/core";

import { ButtonModule } from "primeng/button";
import { SharedModule } from "primeng/api";
import { SkeletonModule } from "primeng/skeleton";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { Incident } from "../model/incident.model";

@Component({
  selector: "mxevolve-incidents-table",
  imports: [
    ButtonModule,
    SharedModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    TableModule,
    TooltipModule,
  ],
  templateUrl: "./incidents-table.component.html",
})
export class IncidentsTableComponent {
  @Input({ required: true }) incidents: Incident[];
  @Input({ required: true }) isLoading: boolean;
  @Output() unlinkIncident = new EventEmitter<string>();

  handleUnlink(incidentId: string) {
    this.unlinkIncident.emit(incidentId);
  }
}
