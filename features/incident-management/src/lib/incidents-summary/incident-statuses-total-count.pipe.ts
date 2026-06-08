import { Pipe, PipeTransform } from '@angular/core';
import { IncidentSummary } from './incident-summary.model';

@Pipe({
  standalone: true,
  name: 'incidentStatusesTotalCount',
})
export class IncidentStatusesTotalCountPipe implements PipeTransform {
  transform(value: IncidentSummary): number {
    return value.statuses.reduce((total, status) => total + status.count, 0);
  }
}
