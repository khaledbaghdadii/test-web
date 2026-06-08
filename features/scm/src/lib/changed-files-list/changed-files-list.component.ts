import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SkeletonModule } from "primeng/skeleton";
import { catchError, finalize, of } from "rxjs";
import { RemoteClonedRepositoryService } from "../remote-cloned-repository/remote-cloned-repository.service";
import {
  ChangedFileDisplay,
  toChangedFileDisplays,
} from "./model/changed-file";

@Component({
  selector: "mxevolve-changed-files-list",
  standalone: true,
  imports: [SkeletonModule],
  templateUrl: "./changed-files-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangedFilesListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );

  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();

  protected readonly loading = signal(false);
  protected readonly files = signal<ChangedFileDisplay[]>([]);

  ngOnInit(): void {
    this.fetchChangedFiles();
  }

  private fetchChangedFiles(): void {
    this.loading.set(true);
    this.remoteClonedRepositoryService
      .getChangedFiles(this.projectId(), this.repositoryId())
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((changedFiles) => {
        const mapped = changedFiles.map((entry) => ({
          filePath: entry.path,
          statusCode: entry.gitFileStatusCode,
        }));
        this.files.set(toChangedFileDisplays(mapped));
      });
  }
}
