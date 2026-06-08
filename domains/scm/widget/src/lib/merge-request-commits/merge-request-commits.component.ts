import {
  Component,
  computed,
  input,
  output,
  inject,
  effect,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import {
  CommitsService,
  CommitDetails,
  MergeRequestOverview,
  MergeRequestState,
  Development,
} from "@mxevolve/domains/scm/data-access";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef } from "ag-grid-enterprise";
import { CommitIdCellRendererComponent } from "../commit-id-cell-renderer/commit-id-cell-renderer.component";
import {
  DateCellRendererComponent,
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { PaginatedCommitsDifferenceComponent } from "../paginated-commits-difference/paginated-commits-difference.component";

@Component({
  selector: "mxevolve-merge-request-commits",
  standalone: true,
  imports: [AgGridAngular, PaginatedCommitsDifferenceComponent],
  providers: [CommitsService],
  templateUrl: "./merge-request-commits.component.html",
})
export class MergeRequestCommitsComponent {
  readonly development = input.required<Development>();
  readonly mergeRequest = input<MergeRequestOverview | undefined>();
  readonly errorOccurred = output<string>();

  private readonly commitsService = inject(CommitsService);

  readonly isMergedWithPr = computed(() => {
    const mr = this.mergeRequest();
    return (
      mr?.mergeRequestState === MergeRequestState.MERGED && !!mr?.pullRequestId
    );
  });

  readonly isDeleted = computed(
    () => this.development().deleted && !this.isMergedWithPr()
  );

  readonly showPaginated = computed(
    () => !this.isMergedWithPr() && !this.isDeleted()
  );

  readonly prCommitsResource = rxResource({
    params: () => {
      if (!this.isMergedWithPr()) {
        return undefined;
      }
      return {
        projectId: this.development().projectId,
        repositoryId: this.development().repository.id,
        pullRequestId: this.mergeRequest()!.pullRequestId,
      };
    },
    stream: ({ params }) => this.commitsService.getPullRequestCommits(params),
    defaultValue: [],
  });

  readonly prCommits = computed(() =>
    this.prCommitsResource.hasValue() ? this.prCommitsResource.value() : []
  );

  readonly displayTitle = computed(() => {
    if (this.isMergedWithPr()) {
      return "Pull Request Commits";
    }
    return `Commits on "${this.development().name}"`;
  });

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = {
    message: "No commits on this branch",
  };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    resizable: true,
  };

  readonly colDefs: ColDef<CommitDetails>[] = [
    {
      field: "id",
      headerName: "Commit ID",
      minWidth: 120,
      cellRenderer: CommitIdCellRendererComponent,
    },
    {
      field: "message",
      headerName: "Message",
      minWidth: 200,
      flex: 2,
    },
    {
      field: "committerDisplayName",
      headerName: "Author",
      minWidth: 150,
    },
    {
      field: "timeStamp",
      headerName: "Date",
      minWidth: 180,
      cellRenderer: DateCellRendererComponent,
      sort: "desc",
    },
  ];

  constructor() {
    effect(() => {
      if (this.prCommitsResource.status() === "error") {
        this.errorOccurred.emit(
          "Failed to load commit differences: " +
            (this.prCommitsResource.error() as Error)?.message
        );
      }
    });
  }
}
