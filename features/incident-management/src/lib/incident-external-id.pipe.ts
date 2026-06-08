import { inject, Pipe, PipeTransform } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";
import { IncidentService } from "./incident.service";

export interface ExternalLinkDisplay {
  id: string;
  link: string;
}

@Pipe({
  name: "incidentExternalLink",
})
export class IncidentExternalLinkPipe implements PipeTransform {
  private readonly incidentService = inject(IncidentService);

  transform(
    incidentId: string | undefined | null
  ): Observable<ExternalLinkDisplay | null> {
    if (!incidentId) {
      return of(null);
    }

    return this.incidentService.fetchIncidentsByIds([incidentId]).pipe(
      map((incidents) => {
        if (incidents.length === 0) {
          return null;
        }
        const externalIssue = incidents[0].externalIssue;
        return {
          id: externalIssue.id,
          link: externalIssue.link,
        };
      }),
      catchError(() => of(null))
    );
  }
}
