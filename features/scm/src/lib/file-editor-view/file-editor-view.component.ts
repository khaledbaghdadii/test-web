import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import {
  MonacoEditorComponent,
  MonacoEditorService,
} from "@mxflow/ui/monaco-editor";
import { RemoteClonedRepositoryService } from "@mxflow/features/scm";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  catchError,
  combineLatest,
  finalize,
  Observable,
  of,
  switchMap,
} from "rxjs";
import { ReadRemoteFileContentApiResponse } from "../remote-cloned-repository/response/read-remote-file-content-api-response";
import {
  RemoteClonedRepositoryState,
  RemoteClonedRepositoryStateApiResponse,
} from "../remote-cloned-repository/response/get-remote-cloned-repository-state-api-response";
import { Tooltip } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";
import { EXTENSION_TO_LANGUAGE } from "../language-extensions/language-extension.constants";

@Component({
  selector: "mxevolve-file-editor-view",
  standalone: true,
  imports: [Button, MonacoEditorComponent, Tooltip, SkeletonModule],
  providers: [RemoteClonedRepositoryService, MonacoEditorService],
  templateUrl: "./file-editor-view.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ["./file-editor-view.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class FileEditorViewComponent {
  private readonly remoteClonedRepositoryService = inject(
    RemoteClonedRepositoryService
  );
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastMessageService = inject(ToastMessageService);

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private readonly deletedFilePaths = new Set<string>();

  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly filePath = input.required<string>();
  readonly reloadToken = input<number>(0);

  readonly fileSaved = output<void>();
  readonly fileRestored = output<void>();

  readonly fileContent = signal<string>("");
  readonly isEditing = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isRestoring = signal<boolean>(false);
  readonly isDeletedFile = signal<boolean>(false);
  readonly isDirty = signal<boolean>(false);
  readonly repositoryState = signal<RemoteClonedRepositoryState | null>(null);

  readonly isRepositoryAvailable = computed(
    () => this.repositoryState() === RemoteClonedRepositoryState.AVAILABLE
  );

  readonly language = computed(() => {
    const ext = this.filePath().split(".").pop()?.toLowerCase() ?? "";
    return EXTENSION_TO_LANGUAGE[ext] ?? "plaintext";
  });

  readonly editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    readOnly: true,
    glyphMargin: true,
    folding: true,
    lineNumbersMinChars: 4,
    overviewRulerBorder: true,
    overviewRulerLanes: 3,
  };

  constructor() {
    this.loadFileContent();
    this.getRepositoryState();
  }

  private loadFileContent(): void {
    toObservable(this.repositoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.deletedFilePaths.clear());

    combineLatest([toObservable(this.filePath), toObservable(this.reloadToken)])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(([filePath]) => this.resolveFileContent(filePath))
      )
      .subscribe((response) => {
        if (!response) return;
        this.applyFileContentToEditor(response.payload);
      });
  }

  private resolveFileContent(
    filePath: string
  ): Observable<ReadRemoteFileContentApiResponse | null> {
    if (this.deletedFilePaths.has(filePath)) {
      this.markFileAsDeleted();
      return of(null);
    }

    this.isDeletedFile.set(false);
    this.isLoading.set(true);

    return this.remoteClonedRepositoryService
      .readRemoteFileContent({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.repositoryId(),
        filePath,
      })
      .pipe(
        catchError((error: Error) => this.handleLoadError(filePath, error)),
        finalize(() => this.isLoading.set(false))
      );
  }

  private handleLoadError(filePath: string, error: Error): Observable<null> {
    if (this.isFileNotFoundError(error)) {
      this.deletedFilePaths.add(filePath);
      this.markFileAsDeleted();
    } else {
      this.toastMessageService.showError(
        `Failed to load file: ${error.message}`,
        "Load Failed"
      );
    }

    return of(null);
  }

  private getRepositoryState(): void {
    toObservable(this.repositoryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((repositoryId) =>
          this.remoteClonedRepositoryService
            .getRemoteClonedRepositoryState(this.projectId(), repositoryId)
            .pipe(
              catchError((error: Error) => {
                this.toastMessageService.showError(
                  `Failed to fetch repository state: ${error.message}`,
                  "State Error"
                );
                return of(null);
              })
            )
        )
      )
      .subscribe((response: RemoteClonedRepositoryStateApiResponse | null) => {
        this.repositoryState.set(response?.remoteClonedRepositoryState ?? null);
      });
  }

  onEditorReady(editor: monaco.editor.IStandaloneCodeEditor): void {
    this.editor = editor;
    editor.onDidChangeModelContent(() => {
      this.isDirty.set(editor.getValue() !== this.fileContent());
    });
  }

  onEdit(): void {
    if (this.isDeletedFile()) return;

    this.isEditing.set(true);
    this.editor?.updateOptions({ readOnly: false });
    this.editor?.focus();
  }

  onSave(): void {
    if (this.isDeletedFile()) return;
    if (!this.editor) return;

    const fileContent = this.editor.getValue();
    this.isSaving.set(true);

    this.remoteClonedRepositoryService
      .writeRemoteFileContent({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.repositoryId(),
        filePath: this.filePath(),
        fileContent,
        checkRepositoryAvailability: true,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error: Error) => {
          this.toastMessageService.showError(
            `Failed to save file: ${error.message}`,
            "Save Failed"
          );
          return of(false);
        }),
        finalize(() => {
          this.isSaving.set(false);
        })
      )
      .subscribe((result) => {
        if (result === false) return;

        this.fileContent.set(fileContent);
        this.isEditing.set(false);
        this.isDirty.set(false);
        this.editor?.updateOptions({ readOnly: true });
        this.fileSaved.emit();
        this.toastMessageService.showSuccess("File saved successfully.");
      });
  }

  onRestore(): void {
    if (!this.isDeletedFile()) return;

    this.isRestoring.set(true);

    this.remoteClonedRepositoryService
      .resetChanges({
        projectId: this.projectId(),
        remoteClonedRepositoryId: this.repositoryId(),
        fileAndDirectoryPathsToReset: [this.filePath()],
      })
      .pipe(
        switchMap(() =>
          this.remoteClonedRepositoryService.readRemoteFileContent({
            projectId: this.projectId(),
            remoteClonedRepositoryId: this.repositoryId(),
            filePath: this.filePath(),
          })
        ),
        takeUntilDestroyed(this.destroyRef),
        catchError((error: Error) => {
          this.toastMessageService.showError(
            `Failed to restore file: ${error.message}`,
            "Restore Failed"
          );
          return of(null);
        }),
        finalize(() => this.isRestoring.set(false))
      )
      .subscribe((response) => {
        if (!response) return;

        this.deletedFilePaths.delete(this.filePath());
        this.isDeletedFile.set(false);
        this.applyFileContentToEditor(response.payload);
        this.fileRestored.emit();
        this.toastMessageService.showSuccess("File restored successfully.");
      });
  }

  private applyFileContentToEditor(payload: string): void {
    this.fileContent.set(payload);
    this.editor?.setValue(payload);
    this.editor?.updateOptions({ readOnly: true });
    this.isDirty.set(false);
    this.isEditing.set(false);
  }

  private markFileAsDeleted(): void {
    this.isDeletedFile.set(true);
    this.fileContent.set("");
    this.editor?.setValue("");
    this.editor?.updateOptions({ readOnly: true });
    this.isEditing.set(false);
  }

  private isFileNotFoundError(error: Error): boolean {
    return /file not found/i.test(error.message);
  }
}
