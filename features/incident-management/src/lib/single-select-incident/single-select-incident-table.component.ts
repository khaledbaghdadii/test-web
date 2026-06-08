import {
  Component,
  computed,
  inject,
  Input,
  model,
  OnDestroy,
  signal,
} from "@angular/core";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { finalize, Observable, Subject, takeUntil } from "rxjs";
import { IncidentService } from "../incident.service";
import { Incident } from "../model/incident.model";
import { FormsModule } from "@angular/forms";
import { SkeletonModule } from "primeng/skeleton";
import { RadioButton } from "primeng/radiobutton";
import { ButtonModule } from "primeng/button";
import { FilterMetadata } from "primeng/api";
import { IncidentsFetchRequest } from "../model/incidents-fetch-request.model";

interface IncidentsTableQuery {
  size: number;
  page: number;
  titlePhrase?: string;
  externalIssueIdPhrase?: string;
}

@Component({
  selector: "mxevolve-single-select-incident",
  standalone: true,
  imports: [
    TableModule,
    SkeletonModule,
    FormsModule,
    RadioButton,
    ButtonModule,
  ],
  templateUrl: "./single-select-incident-table.component.html",
})
export class SingleSelectIncidentTableComponent implements OnDestroy {
  private readonly incidentService = inject(IncidentService);
  private readonly destroy$ = new Subject<void>();

  protected readonly Array = Array;

  @Input({ required: true })
  set refresh(refresh$: Observable<void>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resetIncidentsQuery();
      this.fetchTableData();
    });
  }

  isTableLoading = false;
  total = 0;
  incidentsQuery: IncidentsTableQuery = { size: 10, page: 0 };

  incidents = signal<Incident[]>([]);
  selectedIncident = model<Incident | undefined>(undefined);

  selectedIncidentDisplay = computed(() => {
    const incident = this.selectedIncident();
    if (!incident) return undefined;
    return {
      title: incident.title,
      linkedTicketId: incident.externalIssue.id,
    };
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent) {
    this.incidents.set([]);
    this.updatePaginationParams(event);
    this.updateFilterParams(event);
    this.fetchTableData();
  }

  protected selectIncident(incident: Incident) {
    this.selectedIncident.set(incident);
  }

  protected removeSelectedIncident() {
    this.selectedIncident.set(undefined);
  }

  private fetchTableData() {
    this.isTableLoading = true;
    const request = this.buildFetchRequest();

    this.incidentService
      .fetch(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isTableLoading = false))
      )
      .subscribe({
        next: (incidentPage) => {
          this.incidents.set(incidentPage.content);
          this.total = incidentPage.totalElements;
        },
        error: (error) => {
          console.error("Error fetching incidents:", error.message);
        },
      });
  }

  private resetIncidentsQuery() {
    this.incidentsQuery = { size: 10, page: 0 };
  }

  private updatePaginationParams(event: TableLazyLoadEvent) {
    const newSize = event.rows ?? 10;
    const newPage = Math.floor((event.first ?? 0) / newSize);

    this.incidentsQuery.size = newSize;
    this.incidentsQuery.page =
      newPage !== this.incidentsQuery.page ? newPage : 0;
  }

  private updateFilterParams(event: TableLazyLoadEvent) {
    const filters = event.filters ?? {};
    this.incidentsQuery.titlePhrase = this.extractFilterValue(
      filters["titlePhrase"]
    );
    this.incidentsQuery.externalIssueIdPhrase = this.extractFilterValue(
      filters["externalIssueIdPhrase"]
    );
  }

  private extractFilterValue(
    filter: FilterMetadata | FilterMetadata[] | undefined
  ): string | undefined {
    const value = Array.isArray(filter) ? filter[0]?.value : filter?.value;
    return typeof value === "string" ? value : undefined;
  }

  private buildFetchRequest(): IncidentsFetchRequest {
    return {
      queryParams: {
        page: this.incidentsQuery.page,
        size: this.incidentsQuery.size,
      },
      filters: {
        titlePhrase: this.incidentsQuery.titlePhrase,
        externalIssueIdPhrase: this.incidentsQuery.externalIssueIdPhrase,
      },
    };
  }
}
