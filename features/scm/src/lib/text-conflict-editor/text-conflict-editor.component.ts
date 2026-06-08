import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { Button } from "primeng/button";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { ConflictDetectionService } from "./services/detector/conflict-detection.service";
import { MonacoConflictWidgetService } from "./services/widget/monaco-conflict-widget.service";
import { ConflictParserService } from "./services/parser/conflict-parser.service";
import { type ConflictStatus } from "./models/conflict.models";
import {
  MonacoEditorComponent,
  MonacoEditorService,
} from "@mxflow/ui/monaco-editor";
import { MonacoConflictResolutionService } from "./services/resolver/monaco-conflict-resolution.service";

@Component({
  selector: "mxevolve-text-conflict-editor",
  standalone: true,
  imports: [Button, MonacoEditorComponent],
  providers: [
    ConflictParserService,
    ConflictDetectionService,
    MonacoConflictWidgetService,
    MonacoConflictResolutionService,
    MonacoEditorService,
  ],
  templateUrl: "./text-conflict-editor.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextConflictEditorComponent implements OnDestroy {
  private static readonly REFRESH_DEBOUNCE_MS = 100;

  private readonly resolutionService = inject(MonacoConflictResolutionService);
  private readonly destroyRef = inject(DestroyRef);

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private contentChangeListener: monaco.IDisposable | null = null;
  private readonly contentChanges$ = new Subject<void>();

  constructor() {
    this.contentChanges$
      .pipe(
        debounceTime(TextConflictEditorComponent.REFRESH_DEBOUNCE_MS),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.refreshConflicts());
  }

  /**
   * Initial conflict content seeded into the Monaco editor. Applied once on
   * editor construction; later changes are not propagated to the model.
   * Current content is emitted via `resolvedContent` on resolve.
   */
  readonly initialContent = input.required<string>();

  readonly language = input("plaintext");
  readonly isResolving = input(false);

  readonly resolvedContent = output<string>();

  readonly editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    glyphMargin: true,
    folding: true,
    lineNumbersMinChars: 4,
    overviewRulerBorder: true,
    overviewRulerLanes: 3,
  };

  readonly conflictStatus = signal<ConflictStatus>({ total: 0 });

  readonly totalConflicts = computed(() => this.conflictStatus().total);
  readonly allResolved = computed(() => this.conflictStatus().total === 0);

  ngOnDestroy(): void {
    this.cleanup();
  }

  onEditorReady(editor: monaco.editor.IStandaloneCodeEditor): void {
    this.editor = editor;
    const model = editor.getModel();
    if (model) {
      this.contentChangeListener = model.onDidChangeContent(() =>
        this.contentChanges$.next()
      );
    }
    this.refreshConflicts();
    this.resolutionService.focusFirstConflict(editor);
  }

  onResolve(): void {
    if (!this.editor) return;
    const resolvedContent = this.editor.getValue();
    this.resolvedContent.emit(resolvedContent);
  }

  private refreshConflicts(): void {
    if (!this.editor) return;

    const status = this.resolutionService.refresh(this.editor);
    this.conflictStatus.set(status);
  }

  private cleanup(): void {
    this.contentChangeListener?.dispose();
    this.contentChangeListener = null;
    if (this.editor) {
      this.resolutionService.dispose(this.editor);
    }
    this.editor = null;
  }
}
