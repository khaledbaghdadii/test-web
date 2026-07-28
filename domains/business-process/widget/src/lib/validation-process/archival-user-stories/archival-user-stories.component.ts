import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { catchError, of } from "rxjs";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef } from "ag-grid-enterprise";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import {
  ArchivalUserStoriesUpdateStatus,
  ArchivalUserStoryUpdate,
  JiraDetailsService,
} from "@mxevolve/domains/business-process/data-access";
import { Tag } from "primeng/tag";
import { Message } from "primeng/message";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { ArchivalUserStoriesIssueCellRendererComponent } from "./archival-user-stories-issue-cell-renderer.component";
import { ArchivalUserStoriesStatusCellRendererComponent } from "./archival-user-stories-status-cell-renderer.component";

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: "mxevolve-validation-process-archival-user-stories",
  templateUrl: "./archival-user-stories.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [AgGridAngular, Tag, Message, MxevolveIconComponent],
})
export class ValidationProcessArchivalUserStoriesComponent {
  readonly archivalStatus = input.required<ArchivalUserStoriesUpdateStatus>();
  readonly projectId = input.required<string>();

  private readonly jiraDetailsService = inject(JiraDetailsService);

  private readonly jiraDetailsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.jiraDetailsService
        .getJiraDetails(params.projectId)
        .pipe(
          catchError(() =>
            of({ projectId: "", jiraProjectId: "", jiraBaseUrl: "" })
          )
        ),
  });

  protected readonly jiraBaseUrl = computed(
    () => this.jiraDetailsResource.value()?.jiraBaseUrl ?? ""
  );

  protected readonly rowData = computed<ArchivalUserStoryUpdate[]>(
    () => this.archivalStatus().result
  );

  protected readonly isNa = computed(() => !this.archivalStatus().startDate);

  protected readonly isUnderway = computed(
    () => !!this.archivalStatus().startDate && !this.archivalStatus().endDate
  );

  protected readonly isFailed = computed(
    () =>
      !!this.archivalStatus().endDate &&
      this.archivalStatus().facedTechnicalIssues
  );

  protected readonly defaultColDef: ColDef = {
    flex: 1,
    sortable: false,
    filter: false,
    resizable: true,
  };

  protected readonly columnDefs = computed<ColDef[]>(() => [
    {
      headerName: "Issue ID",
      field: "userStoryId",
      cellRenderer: ArchivalUserStoriesIssueCellRendererComponent,
      cellRendererParams: { jiraBaseUrl: this.jiraBaseUrl() },
    },
    {
      headerName: "Archival Status",
      cellRenderer: ArchivalUserStoriesStatusCellRendererComponent,
      cellRendererParams: { status: this.archivalStatus() },
    },
  ]);

  protected readonly loadingOverlayComponent = TableLoadingOverlayComponent;
  protected readonly tableNoRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = {
    message: "No user stories",
  };
}
