import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { forkJoin, of } from "rxjs";
import { map } from "rxjs/operators";
import { Message } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { SplitterModule } from "primeng/splitter";
import { BaseComparisonDiffsComponent } from "../base-comparison/base-comparison-diffs.component";
import { ConflictResolutionContainerComponent } from "../conflict-resolution-container/conflict-resolution-container.component";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import { DiffVersion } from "../remote-cloned-repository/model/diff-version.enum";
import { GitFileStatusCode } from "../remote-cloned-repository/model/git-file-status-code.enum";
import { ConflictResolutionDecisionType } from "../conflict-resolution-buttons/model/conflict-resolution-decision.model";
import { EXTENSION_TO_LANGUAGE } from "../language-extensions/language-extension.constants";

interface MergeResolutionData {
  baseContent: string;
  localContent: string | null;
  remoteContent: string | null;
  workingTreeContent: string;
}

@Component({
  selector: "mxevolve-file-conflict-resolver",
  standalone: true,
  imports: [
    Message,
    SkeletonModule,
    SplitterModule,
    BaseComparisonDiffsComponent,
    ConflictResolutionContainerComponent,
  ],
  providers: [RemoteClonedRepositoryService],
  templateUrl: "./file-conflict-resolver.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileConflictResolverComponent {
  private static readonly CONTENT_UNAVAILABLE_STATUSES: ReadonlySet<GitFileStatusCode> =
    new Set([
      GitFileStatusCode.BOTH_DELETED,
      GitFileStatusCode.INDEX_DELETED,
      GitFileStatusCode.WORKTREE_DELETED,
      GitFileStatusCode.UNKNOWN,
    ]);

  private static readonly TEXT_EDITOR_STATUSES: ReadonlySet<GitFileStatusCode> =
    new Set([
      GitFileStatusCode.BOTH_MODIFIED,
      GitFileStatusCode.BOTH_ADDED,
      GitFileStatusCode.INDEX_MODIFIED,
    ]);

  private static readonly SINGLE_EDITOR_STATUSES: ReadonlySet<GitFileStatusCode> =
    new Set([GitFileStatusCode.INDEX_MODIFIED]);

  private static readonly ALL_DIFF_VERSIONS: DiffVersion[] = [
    DiffVersion.BASE,
    DiffVersion.LOCAL,
    DiffVersion.REMOTE,
  ];

  private static readonly REQUESTED_DIFF_VERSIONS_BY_STATUS: Partial<
    Record<GitFileStatusCode, DiffVersion[]>
  > = {
    [GitFileStatusCode.BOTH_ADDED]: [DiffVersion.LOCAL, DiffVersion.REMOTE],
    [GitFileStatusCode.BOTH_MODIFIED]:
      FileConflictResolverComponent.ALL_DIFF_VERSIONS,
    [GitFileStatusCode.DELETED_LOCALLY]: [DiffVersion.BASE, DiffVersion.REMOTE],
    [GitFileStatusCode.DELETED_REMOTELY]: [DiffVersion.BASE, DiffVersion.LOCAL],
  };

  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );

  readonly projectId = input.required<string>();
  readonly remoteClonedRepositoryId = input.required<string>();
  readonly filePath = input.required<string>();
  readonly gitFileStatusCode = input.required<GitFileStatusCode>();

  readonly resolved = output<void>();

  readonly language = computed(() => {
    const ext = this.filePath().split(".").pop()?.toLowerCase() ?? "";
    return EXTENSION_TO_LANGUAGE[ext] ?? "plaintext";
  });

  private readonly mergeResource = rxResource<
    MergeResolutionData | null,
    {
      projectId: string;
      remoteClonedRepositoryId: string;
      filePath: string;
      gitFileStatusCode: GitFileStatusCode;
    }
  >({
    params: () => ({
      projectId: this.projectId(),
      remoteClonedRepositoryId: this.remoteClonedRepositoryId(),
      filePath: this.filePath(),
      gitFileStatusCode: this.gitFileStatusCode(),
    }),
    stream: ({ params }) => {
      const isContentUnavailable =
        FileConflictResolverComponent.CONTENT_UNAVAILABLE_STATUSES.has(
          params.gitFileStatusCode
        );

      if (isContentUnavailable) {
        return of({
          baseContent: "",
          localContent: null,
          remoteContent: null,
          workingTreeContent: "",
        });
      }

      const shouldLoadWorkingTreeContent =
        FileConflictResolverComponent.TEXT_EDITOR_STATUSES.has(
          params.gitFileStatusCode
        );
      const isSingleEditorMode =
        FileConflictResolverComponent.SINGLE_EDITOR_STATUSES.has(
          params.gitFileStatusCode
        );

      if (isSingleEditorMode) {
        return this.remoteClonedRepositoryService
          .readRemoteFileContent({
            projectId: params.projectId,
            remoteClonedRepositoryId: params.remoteClonedRepositoryId,
            filePath: params.filePath,
          })
          .pipe(
            map((fileContent) => ({
              baseContent: "",
              localContent: null,
              remoteContent: null,
              workingTreeContent: fileContent?.payload ?? "",
            }))
          );
      }

      const requestedDiffVersions =
        FileConflictResolverComponent.REQUESTED_DIFF_VERSIONS_BY_STATUS[
          params.gitFileStatusCode
        ] ?? FileConflictResolverComponent.ALL_DIFF_VERSIONS;

      return forkJoin({
        diffVersions:
          this.remoteClonedRepositoryService.getConflictingDiffVersions({
            projectId: params.projectId,
            remoteClonedRepositoryId: params.remoteClonedRepositoryId,
            filePath: params.filePath,
            requestedDiffVersions,
          }),
        fileContent: shouldLoadWorkingTreeContent
          ? this.remoteClonedRepositoryService.readRemoteFileContent({
              projectId: params.projectId,
              remoteClonedRepositoryId: params.remoteClonedRepositoryId,
              filePath: params.filePath,
            })
          : of(null),
      }).pipe(
        map(({ diffVersions, fileContent }) => ({
          baseContent: diffVersions.versionContents[DiffVersion.BASE] ?? "",
          localContent: diffVersions.versionContents[DiffVersion.LOCAL] ?? null,
          remoteContent:
            diffVersions.versionContents[DiffVersion.REMOTE] ?? null,
          workingTreeContent: fileContent?.payload ?? "",
        }))
      );
    },
    defaultValue: null,
  });

  readonly isLoading = computed(() => this.mergeResource.isLoading());

  readonly errorMessage = computed(() => {
    const err = this.mergeResource.error();
    return err instanceof Error ? err.message : null;
  });

  readonly hasData = computed(() => this.mergeResource.hasValue());

  readonly viewState = computed<"loading" | "error" | "ready" | "empty">(() => {
    if (this.isLoading()) return "loading";
    if (this.errorMessage()) return "error";
    if (this.hasData()) return "ready";
    return "empty";
  });

  readonly isButtonsMode = computed(
    () =>
      !FileConflictResolverComponent.TEXT_EDITOR_STATUSES.has(
        this.gitFileStatusCode()
      )
  );

  readonly isSingleEditorMode = computed(() =>
    FileConflictResolverComponent.SINGLE_EDITOR_STATUSES.has(
      this.gitFileStatusCode()
    )
  );

  readonly isContentUnavailable = computed(() =>
    FileConflictResolverComponent.CONTENT_UNAVAILABLE_STATUSES.has(
      this.gitFileStatusCode()
    )
  );

  readonly contentUnavailableMessage = computed(() => {
    const status = this.gitFileStatusCode();
    switch (status) {
      case GitFileStatusCode.BOTH_DELETED:
      case GitFileStatusCode.INDEX_DELETED:
      case GitFileStatusCode.WORKTREE_DELETED:
        return "File is deleted. No content to show.";
      default:
        return "File content is unavailable for this status.";
    }
  });

  readonly splitterPanelSizes = computed<[number, number]>(() =>
    this.isButtonsMode() ? [92, 8] : [50, 50]
  );

  readonly baseContent = computed(
    () => this.mergeResource.value()?.baseContent ?? ""
  );
  readonly localContent = computed(
    () => this.mergeResource.value()?.localContent ?? null
  );
  readonly remoteContent = computed(
    () => this.mergeResource.value()?.remoteContent ?? null
  );
  readonly workingTreeContent = computed(
    () => this.mergeResource.value()?.workingTreeContent ?? ""
  );

  readonly resolvedContentByDecision = computed<
    Partial<Record<ConflictResolutionDecisionType, string>>
  >(() => {
    const data = this.mergeResource.value();
    if (!data) return {};

    const result: Partial<Record<ConflictResolutionDecisionType, string>> = {
      [ConflictResolutionDecisionType.KEEP_BASE]: data.baseContent,
    };
    if (data.localContent !== null) {
      result[ConflictResolutionDecisionType.KEEP_LOCAL] = data.localContent;
    }
    if (data.remoteContent !== null) {
      result[ConflictResolutionDecisionType.KEEP_REMOTE] = data.remoteContent;
    }
    return result;
  });

  onResolved(): void {
    this.resolved.emit();
  }
}
