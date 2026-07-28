import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from "@angular/core";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { MonacoEditorService } from "./service/monaco-editor.service";
import { syncMonacoThemeWithApp } from "./service/sync-monaco-theme";

@Component({
  selector: "mxevolve-monaco-editor",
  standalone: true,
  providers: [MonacoEditorService],
  template: `<div #editorContainer class="h-full w-full"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonacoEditorComponent implements AfterViewInit, OnDestroy {
  private readonly monacoService = inject(MonacoEditorService);

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private model: monaco.editor.ITextModel | null = null;

  /**
   * Initial content of the editor. Applied once on editor construction.
   * Subsequent changes to this input are NOT propagated to the Monaco model
   * to avoid clobbering user edits. Use the editor instance from
   * `editorReady` to update content imperatively if needed.
   */
  readonly initialContent = input.required<string>();

  readonly language = input("plaintext");

  readonly options = input<monaco.editor.IStandaloneEditorConstructionOptions>(
    {}
  );

  readonly editorReady = output<monaco.editor.IStandaloneCodeEditor>();

  readonly editorContainer =
    viewChild.required<ElementRef<HTMLElement>>("editorContainer");

  constructor() {
    syncMonacoThemeWithApp();
    effect(() => {
      const language = this.language();
      if (this.model) {
        this.monacoService.setModelLanguage(this.model, language);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initEditor();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  getValue(): string {
    return this.editor?.getValue() ?? "";
  }

  private initEditor(): void {
    const container = this.editorContainer().nativeElement;

    this.model = this.monacoService.createModel(
      this.initialContent(),
      this.language()
    );

    this.editor = this.monacoService.createEditor(container, {
      model: this.model,
      ...this.options(),
    });

    this.editorReady.emit(this.editor);
  }

  private cleanup(): void {
    if (this.editor) {
      this.monacoService.disposeEditor(this.editor);
    }
    this.monacoService.disposeModel(this.model);
    this.editor = null;
    this.model = null;
  }
}
