import { Injectable } from "@angular/core";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "./monaco-languages";
export { ContentWidgetPosition, OverviewRulerLane } from "./monaco-constants";

@Injectable()
export class MonacoEditorService {
  createEditor(
    container: HTMLElement,
    options: monaco.editor.IStandaloneEditorConstructionOptions
  ): monaco.editor.IStandaloneCodeEditor {
    return monaco.editor.create(container, {
      automaticLayout: true,
      glyphMargin: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      folding: true,
      showFoldingControls: "always",
      ...options,
    });
  }

  createModel(
    content: string,
    language = "plaintext"
  ): monaco.editor.ITextModel {
    return monaco.editor.createModel(content, language);
  }

  setTheme(theme: "vs" | "vs-dark"): void {
    monaco.editor.setTheme(theme);
  }

  createRange(
    startLineNumber: number,
    startColumn: number,
    endLineNumber: number,
    endColumn: number
  ): monaco.Range {
    return new monaco.Range(
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn
    );
  }

  applyDecorations(
    editor: monaco.editor.IStandaloneCodeEditor,
    decorations: monaco.editor.IModelDeltaDecoration[]
  ): monaco.editor.IEditorDecorationsCollection {
    return editor.createDecorationsCollection(decorations);
  }

  executeEdits(
    editor: monaco.editor.IStandaloneCodeEditor,
    source: string,
    edits: monaco.editor.IIdentifiedSingleEditOperation[]
  ): void {
    editor.pushUndoStop();
    editor.executeEdits(source, edits);
    editor.pushUndoStop();
  }

  revealLineInCenter(
    editor: monaco.editor.IStandaloneCodeEditor,
    lineNumber: number
  ): void {
    editor.revealLineInCenter(lineNumber);
    editor.setPosition({ lineNumber, column: 1 });
  }

  disposeEditor(editor: monaco.editor.IStandaloneCodeEditor | null): void {
    if (!editor) return;
    editor.dispose();
  }

  createDiffEditor(
    container: HTMLElement,
    options: monaco.editor.IDiffEditorConstructionOptions = {}
  ): monaco.editor.IStandaloneDiffEditor {
    return monaco.editor.createDiffEditor(container, {
      automaticLayout: true,
      glyphMargin: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      folding: true,
      showFoldingControls: "always",
      ...options,
    });
  }

  updateDiffEditorOptions(
    editor: monaco.editor.IStandaloneDiffEditor,
    options: monaco.editor.IDiffEditorConstructionOptions
  ): void {
    editor.updateOptions(options);
  }

  setModelLanguage(model: monaco.editor.ITextModel, language: string): void {
    monaco.editor.setModelLanguage(model, language);
  }

  disposeModel(model: monaco.editor.ITextModel | null): void {
    model?.dispose();
  }
}
