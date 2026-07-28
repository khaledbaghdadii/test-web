import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  viewChild,
} from "@angular/core";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { MonacoEditorService } from "./service/monaco-editor.service";
import { syncMonacoThemeWithApp } from "./service/sync-monaco-theme";

@Component({
  selector: "mxevolve-monaco-diff-viewer",
  standalone: true,
  providers: [MonacoEditorService],
  template: `
    <section
      class="h-full min-h-0 flex flex-col border border-surface-300 dark:border-surface-700 rounded-md overflow-hidden bg-surface-0 dark:bg-surface-900"
    >
      <header
        class="px-3 py-2 text-sm font-medium text-center border-b border-surface-300 dark:border-surface-700"
      >
        {{ title() }}
      </header>
      <div #diffContainer class="flex-1 min-h-0 w-full"></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonacoDiffViewerComponent implements AfterViewInit, OnDestroy {
  private readonly monacoService = inject(MonacoEditorService);

  private diffEditor: monaco.editor.IStandaloneDiffEditor | null = null;
  private originalModel: monaco.editor.ITextModel | null = null;
  private modifiedModel: monaco.editor.ITextModel | null = null;

  readonly title = input.required<string>();
  readonly originalContent = input.required<string>();
  readonly modifiedContent = input<string | null>(null);
  readonly language = input("plaintext");

  readonly options = input<monaco.editor.IDiffEditorConstructionOptions>({
    readOnly: true,
    renderSideBySide: true,
  });

  readonly diffContainer =
    viewChild.required<ElementRef<HTMLElement>>("diffContainer");

  constructor() {
    syncMonacoThemeWithApp();
  }

  private readonly refreshEffect = effect(() => {
    const originalContent = this.originalContent();
    const modifiedContent = this.modifiedContent() ?? "";

    if (!this.diffEditor) {
      return;
    }

    this.originalModel?.setValue(originalContent);
    this.modifiedModel?.setValue(modifiedContent);
  });

  private readonly configEffect = effect(() => {
    const language = this.language();
    const options = this.options();
    if (!this.diffEditor || !this.originalModel || !this.modifiedModel) {
      return;
    }
    this.monacoService.updateDiffEditorOptions(this.diffEditor, options);
    this.monacoService.setModelLanguage(this.originalModel, language);
    this.monacoService.setModelLanguage(this.modifiedModel, language);
  });

  ngAfterViewInit(): void {
    this.initEditor();
  }

  ngOnDestroy(): void {
    this.refreshEffect.destroy();
    this.configEffect.destroy();

    this.diffEditor?.dispose();
    this.monacoService.disposeModel(this.originalModel);
    this.monacoService.disposeModel(this.modifiedModel);

    this.diffEditor = null;
    this.originalModel = null;
    this.modifiedModel = null;
  }

  private initEditor(): void {
    this.originalModel = this.monacoService.createModel(
      this.originalContent(),
      this.language()
    );
    this.modifiedModel = this.monacoService.createModel(
      this.modifiedContent() ?? "",
      this.language()
    );

    this.diffEditor = this.monacoService.createDiffEditor(
      this.diffContainer().nativeElement,
      {
        ...this.options(),
      }
    );

    this.diffEditor.setModel({
      original: this.originalModel,
      modified: this.modifiedModel,
    });
  }
}
