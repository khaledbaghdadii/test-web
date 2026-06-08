import { inject, Injectable } from "@angular/core";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import {
  ConflictBlock,
  ConflictResolution,
  ConflictStatus,
} from "../../models/conflict.models";
import { ConflictDetectionService } from "../detector/conflict-detection.service";
import { ConflictParserService } from "../parser/conflict-parser.service";
import { MonacoEditorService } from "@mxflow/ui/monaco-editor";
import { MonacoConflictWidgetService } from "../widget/monaco-conflict-widget.service";

@Injectable()
export class MonacoConflictResolutionService {
  private static readonly EDIT_SOURCE = "conflict-resolution";

  private readonly detectionService = inject(ConflictDetectionService);
  private readonly widgetService = inject(MonacoConflictWidgetService);
  private readonly parser = inject(ConflictParserService);
  private readonly monacoService = inject(MonacoEditorService);

  private blocks: ConflictBlock[] = [];
  private decorationCollection: monaco.editor.IEditorDecorationsCollection | null =
    null;

  get currentBlocks(): ReadonlyArray<ConflictBlock> {
    return this.blocks;
  }

  refresh(editor: monaco.editor.IStandaloneCodeEditor): ConflictStatus {
    const model = editor.getModel();
    if (!model) {
      return { total: 0 };
    }
    const text = model.getValue();
    this.blocks = this.detectionService.detectConflicts(text, model);
    this.clearDecorations();
    const decorations = this.detectionService.createDecorations(this.blocks);
    this.decorationCollection = editor.createDecorationsCollection(decorations);
    this.widgetService.createWidgets(editor, this.blocks, (block, resolution) =>
      this.resolveBlock(editor, block, resolution)
    );
    return { total: this.blocks.length };
  }

  resolveBlock(
    editor: monaco.editor.IStandaloneCodeEditor,
    block: ConflictBlock,
    resolution: ConflictResolution
  ): void {
    const model = editor.getModel();
    if (!model) return;
    const replacement = this.parser.getReplacementText(block, resolution);
    const startPos = model.getPositionAt(block.startOffset);
    const endPos = model.getPositionAt(block.endOffset);
    const range = this.monacoService.createRange(
      startPos.lineNumber,
      startPos.column,
      endPos.lineNumber,
      endPos.column
    );
    this.monacoService.executeEdits(
      editor,
      MonacoConflictResolutionService.EDIT_SOURCE,
      [{ range, text: replacement }]
    );
    editor.focus();
  }

  focusFirstConflict(editor: monaco.editor.IStandaloneCodeEditor): void {
    if (this.blocks.length > 0) {
      this.monacoService.revealLineInCenter(editor, this.blocks[0].start);
    }
  }

  dispose(editor: monaco.editor.IStandaloneCodeEditor): void {
    this.widgetService.clearWidgets(editor);
    this.clearDecorations();
    this.blocks = [];
  }

  private clearDecorations(): void {
    this.decorationCollection?.clear();
    this.decorationCollection = null;
  }
}
