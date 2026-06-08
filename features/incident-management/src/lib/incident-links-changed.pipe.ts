import { Pipe, PipeTransform } from "@angular/core";
import { Incident } from "./model/incident.model";
import { ListUtils } from "./utils/list-utils";

@Pipe({
  name: "incidentLinksChanged",
  standalone: true,
})
export class IncidentLinksChangedPipe implements PipeTransform {
  transform(
    initialIncidentsSelection: Incident[],
    currentIncidentsSelection: Incident[]
  ): boolean {
    const currentIncidentIdsSelection = currentIncidentsSelection.map(
      (incident) => incident.id
    );
    const initialIncidentIdsSelection = initialIncidentsSelection.map(
      (incident) => incident.id
    );
    return !ListUtils.arePermutations(
      initialIncidentIdsSelection,
      currentIncidentIdsSelection
    );
  }
}
