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
import { Message } from "primeng/message";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef } from "ag-grid-enterprise";
import { ScenarioExecutionService } from "@mxflow/test-management/execution";
import { DialogService } from "primeng/dynamicdialog";
import { catchError, map, of, switchMap } from "rxjs";
import { CommitIdCellRendererComponent } from "../commit-id-cell-renderer/commit-id-cell-renderer.component";
import { CommitTestExecutionsCellRendererComponent } from "../commit-test-executions-cell-renderer/commit-test-executions-cell-renderer.component";
import { CommitTestExecutionRow } from "../commit-test-executions-dialog/commit-test-executions-dialog.component";
import {
  DateCellRendererComponent,
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { PaginatedCommitsDifferenceComponent } from "../paginated-commits-difference/paginated-commits-difference.component";
import { TestExecutionsByCommitIdService } from "../test-executions-by-commit-id/test-executions-by-commit-id.service";

@Component({
  selector: "mxevolve-merge-request-commits",
  standalone: true,
  imports: [
    AgGridAngular,
    PaginatedCommitsDifferenceComponent,
    Message,
    MxevolveIconComponent,
  ],
  providers: [
    CommitsService,
    DialogService,
    ScenarioExecutionService,
    TestExecutionsByCommitIdService,
  ],
  templateUrl: "./merge-request-commits.component.html",
})
export class MergeRequestCommitsComponent {
  readonly development = input.required<Development>();
  readonly mergeRequest = input<MergeRequestOverview | undefined>();
  /**
   * When true, renders a "you are X commits behind {source}" warning above the
   * commits table (mirrors the Branch Details tab). Defaults to false so other
   * consumers keep their current behaviour.
   */
  readonly showCommitsBehindWarning = input(false);
  readonly errorOccurred = output<string>();

  private readonly commitsService = inject(CommitsService);

  private readonly commitsBehindResource = rxResource({
    params: () => {
      if (!this.showCommitsBehindWarning()) return undefined;
      const dev = this.development();
      if (dev.deleted || !dev.source || !dev.repository?.id) return undefined;
      return {
        projectId: dev.projectId,
        repositoryId: dev.repository.id,
        sourceBranch: dev.source,
        destinationBranch: dev.name,
      };
    },
    stream: ({ params }) => this.commitsService.getCommitDifferences(params),
    defaultValue: [],
  });

  readonly commitsBehindCount = computed(() =>
    this.commitsBehindResource.hasValue()
      ? this.commitsBehindResource.value().length
      : 0
  );
  private readonly testExecutionsByCommitIdService = inject(
    TestExecutionsByCommitIdService
  );

  readonly isMergedWithPr = computed(() => {
    const mr = this.mergeRequest();
    return (
      mr?.mergeRequestState === MergeRequestState.MERGED && !!mr?.pullRequestId
    );
  });

  readonly isDeleted = computed(
    () => this.development().deleted && !this.isMergedWithPr()
  );

  readonly prCommitsResource = rxResource({
    params: () => {
      if (!this.isMergedWithPr()) return undefined;
      return {
        projectId: this.development().projectId,
        repositoryId: this.development().repository.id,
        pullRequestId: this.mergeRequest()!.pullRequestId,
      };
    },
    stream: ({ params }) =>
      this.commitsService.getPullRequestCommits(params).pipe(
        switchMap((commits) => {
          const commitIds = commits.map((commit) => commit.id);
          if (commitIds.length === 0) {
            return of(
              [] as Array<
                CommitDetails & { executions: CommitTestExecutionRow[] }
              >
            );
          }

          return this.testExecutionsByCommitIdService
            .getExecutionsGroupedByCommitId(params.projectId, commitIds)
            .pipe(
              catchError(() =>
                of({} as Record<string, CommitTestExecutionRow[]>)
              ),
              map((executionsByCommitId) => {
                return commits.map((commit) => ({
                  ...commit,
                  executions: executionsByCommitId[commit.id] ?? [],
                }));
              })
            );
        })
      ),
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
    {
      headerName: "Test Runs",
      minWidth: 200,
      sortable: false,
      cellRenderer: CommitTestExecutionsCellRendererComponent,
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
