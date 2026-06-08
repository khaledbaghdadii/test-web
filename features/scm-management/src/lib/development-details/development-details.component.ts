import { Component, Input, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import {
  CommitDetails,
  ScmManagementService,
  ScmService,
} from "@mxflow/features/scm";
import { ToastMessageService } from "@mxflow/ui/alert";
import { switchMap, catchError, of } from "rxjs";

@Component({
  selector: "mxevolve-development-details",
  templateUrl: "./development-details.component.html",
  imports: [CommonModule, TableModule, SkeletonModule, TooltipModule],
  standalone: true,
})
export class DevelopmentDetailsComponent {
  private _projectId = signal<string>("");
  private _developmentId = signal<string>("");

  @Input({ required: true }) set projectId(value: string) {
    if (value && value !== this._projectId()) {
      this._projectId.set(value);
    }
  }
  get projectId(): string {
    return this._projectId();
  }

  @Input({ required: true }) set developmentId(value: string) {
    if (value && value !== this._developmentId()) {
      this._developmentId.set(value);
    }
  }
  get developmentId(): string {
    return this._developmentId();
  }

  configurationParentBranch = signal<string | undefined>(undefined);
  configurationBranchName = signal<string>("");
  createdAt = signal<string | undefined>(undefined);
  repositoryUrl = signal<string>("");
  repositoryId = signal<string | undefined>(undefined);

  developmentDetails = toSignal(
    toObservable(
      computed(() => ({
        projectId: this.projectId,
        developmentId: this.developmentId,
      }))
    ).pipe(
      switchMap(({ projectId, developmentId }) =>
        this.scmManagementService
          .getDevelopment(projectId, developmentId, true)
          .pipe(
            catchError((err) => {
              this.toastMessageService.showError(
                "Failed to load development details"
              );
              console.error(err);
              return of(null);
            })
          )
      )
    ),
    { initialValue: null }
  );

  commitDifferences = toSignal(
    toObservable(this.developmentDetails).pipe(
      switchMap((dev) => {
        if (!dev) {
          this.configurationParentBranch.set(undefined);
          this.configurationBranchName.set("");
          this.createdAt.set(undefined);
          this.repositoryUrl.set("");
          this.repositoryId.set(undefined);
          return of<CommitDetails[]>([]);
        }

        this.configurationParentBranch.set(dev.source);
        this.configurationBranchName.set(dev.name);
        this.createdAt.set(dev.createdOn);
        this.repositoryUrl.set(dev.repository.url);
        this.repositoryId.set(dev.repository.id);

        if (dev.deleted) {
          return of<CommitDetails[]>([]);
        }
        return this.scmService
          .getCommitDifferences({
            projectId: this.projectId,
            repositoryId: dev.repository.id ?? "",
            sourceBranch: dev.source ?? "",
            destinationBranch: dev.name ?? "",
          })
          .pipe(
            catchError((error) => {
              this.toastMessageService.showError(
                "Couldn't retrieve commit differences: " + error
              );
              return of<CommitDetails[]>([]);
            })
          );
      })
    ),
    { initialValue: [] }
  );

  numberOfCommitsBehindMain = computed(() => this.commitDifferences().length);

  branchStatusMessage = computed(() => {
    const commits = this.numberOfCommitsBehindMain();
    const branchName = this.configurationBranchName();
    const parentBranch = this.configurationParentBranch();

    if (!branchName || !parentBranch) return "";

    if (commits === 0) {
      return `Your branch ${branchName} is up to date with ${parentBranch}`;
    }
    const commitText = commits === 1 ? "commit" : "commits";
    return `Your branch ${branchName} is ${commits} ${commitText} behind ${parentBranch}`;
  });

  repositoryUrlWithBranch = computed(() => {
    const dev = this.developmentDetails();
    if (!dev) return "";
    return this.buildBitbucketBrowseUrl(dev.repository.url, dev.name);
  });

  repositoryUrlWithParentBranch = computed(() => {
    const dev = this.developmentDetails();
    if (!dev) return "";
    return this.buildBitbucketBrowseUrl(dev.repository.url, dev.source);
  });

  private buildBitbucketBrowseUrl(
    repositoryUrl: string,
    branchName: string | undefined
  ): string {
    if (!repositoryUrl) {
      return "";
    }

    let browseUrl = repositoryUrl.endsWith(".git")
      ? repositoryUrl.slice(0, -4)
      : repositoryUrl;

    const scmUrlPattern =
      /^(https?:\/\/[^/]+)\/scm\/([^/]+)\/([^/?#]+)(?:[/?#]|$)/i;
    const urlMatch = scmUrlPattern.exec(browseUrl);

    if (urlMatch) {
      const [, baseHost, projectKey, repositorySlug] = urlMatch;
      const uppercaseProjectKey = projectKey.toUpperCase();
      browseUrl = `${baseHost}/projects/${uppercaseProjectKey}/repos/${repositorySlug}/browse`;
    }

    if (!branchName) {
      return browseUrl;
    }

    const branchReference = `refs/heads/${branchName}`;
    const encodedBranchReference = encodeURIComponent(branchReference);

    return `${browseUrl}?at=${encodedBranchReference}`;
  }

  constructor(
    private readonly scmService: ScmService,
    private readonly scmManagementService: ScmManagementService,
    private toastMessageService: ToastMessageService
  ) {}
}
