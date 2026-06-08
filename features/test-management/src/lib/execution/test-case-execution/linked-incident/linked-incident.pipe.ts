import { Pipe, PipeTransform } from "@angular/core";
import { Incident } from "@mxflow/features/incident-management";

@Pipe({
  name: "linkedIncident",
})
export class LinkedIncidentPipe implements PipeTransform {
  transform(linkedIncidents: Incident[]): string {
    return this.getLinkedIncidentsIds(linkedIncidents);
  }

  private getLinkedIncidentsIds(linkedIncidents: Incident[]): string {
    return linkedIncidents
      .map((incident) => incident.externalIssue.id)
      .join(", ");
  }
}
