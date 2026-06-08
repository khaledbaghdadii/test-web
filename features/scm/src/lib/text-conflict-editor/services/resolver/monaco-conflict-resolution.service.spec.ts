import { TestBed } from "@angular/core/testing";
import { ConflictDetectionService } from "../detector/conflict-detection.service";
import { ConflictParserService } from "../parser/conflict-parser.service";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import type { ConflictBlock } from "../../models/conflict.models";
import { MonacoEditorService } from "@mxflow/ui/monaco-editor";
import { MonacoConflictResolutionService } from "./monaco-conflict-resolution.service";
import { MonacoConflictWidgetService } from "../widget/monaco-conflict-widget.service";

type ResolutionEditor = Parameters<
  MonacoConflictResolutionService["refresh"]
>[0];
type ResolutionModel = Pick<
  monaco.editor.ITextModel,
  "getValue" | "getPositionAt"
>;
type DecorationsCollection = Pick<
  monaco.editor.IEditorDecorationsCollection,
  "clear"
>;

// Stub out monaco runtime so MonacoEditorService module-level import is cheap.
jest.mock("monaco-editor/esm/vs/editor/editor.api.js", () => ({
  editor: {},
}));

describe("MonacoConflictResolutionService", () => {
  let service: MonacoConflictResolutionService;
  let detectionService: jest.Mocked<ConflictDetectionService>;
  let widgetService: jest.Mocked<MonacoConflictWidgetService>;
  let parser: jest.Mocked<ConflictParserService>;
  let monacoService: jest.Mocked<MonacoEditorService>;

  const block: ConflictBlock = {
    id: "b1",
    start: 5,
    end: 10,
    startOffset: 20,
    endOffset: 50,
    current: "ours",
    incoming: "theirs",
    raw: "raw",
  };

  beforeEach(() => {
    detectionService = {
      detectConflicts: jest.fn(),
      createDecorations: jest.fn(),
    } as unknown as jest.Mocked<ConflictDetectionService>;

    widgetService = {
      createWidgets: jest.fn(),
      clearWidgets: jest.fn(),
    } as unknown as jest.Mocked<MonacoConflictWidgetService>;

    parser = {
      parse: jest.fn(),
      getConflictMarkers: jest.fn(),
      getReplacementText: jest.fn(),
    } as unknown as jest.Mocked<ConflictParserService>;

    monacoService = {
      executeEdits: jest.fn(),
      revealLineInCenter: jest.fn(),
      createRange: jest.fn(
        (
          startLineNumber: number,
          startColumn: number,
          endLineNumber: number,
          endColumn: number
        ) =>
          ({
            startLineNumber,
            startColumn,
            endLineNumber,
            endColumn,
          } as unknown as monaco.Range)
      ),
    } as unknown as jest.Mocked<MonacoEditorService>;

    TestBed.configureTestingModule({
      providers: [
        MonacoConflictResolutionService,
        { provide: ConflictDetectionService, useValue: detectionService },
        { provide: MonacoConflictWidgetService, useValue: widgetService },
        { provide: ConflictParserService, useValue: parser },
        { provide: MonacoEditorService, useValue: monacoService },
      ],
    });

    service = TestBed.inject(MonacoConflictResolutionService);
  });

  /**
   * Builds an editor mock wired to the given model and decorations collection.
   * Returns both the editor and the collection so tests can assert lifecycle.
   */
  function createEditorMock(
    model: ResolutionModel | null,
    collection: DecorationsCollection = { clear: jest.fn() }
  ): {
    editor: ResolutionEditor;
    collection: DecorationsCollection;
    focus: jest.Mock;
  } {
    const focus = jest.fn();
    const editor = {
      getModel: jest.fn().mockReturnValue(model),
      createDecorationsCollection: jest.fn().mockReturnValue(collection),
      focus,
    } as unknown as ResolutionEditor;
    return { editor, collection, focus };
  }

  describe("refresh", () => {
    it("should return zero status when editor has no model", () => {
      const editor = {
        getModel: jest.fn().mockReturnValue(null),
      } as unknown as ResolutionEditor;

      const result = service.refresh(editor);

      expect(result).toEqual({ total: 0 });
      expect(detectionService.detectConflicts).not.toHaveBeenCalled();
      expect(widgetService.createWidgets).not.toHaveBeenCalled();
    });

    it("should detect conflicts apply decorations and create widgets when editor has a model", () => {
      const previousClear = jest.fn();
      const previousCollection = {
        clear: previousClear,
      } as DecorationsCollection;
      const model = {
        getValue: jest.fn().mockReturnValue("content"),
      } as unknown as ResolutionModel;
      const nextCollection = { clear: jest.fn() } as DecorationsCollection;

      // Prime the service with an initial collection via a first refresh call,
      // then verify the subsequent refresh clears it.
      const first = createEditorMock(model, previousCollection);
      detectionService.detectConflicts.mockReturnValue([block]);
      detectionService.createDecorations.mockReturnValue([]);
      service.refresh(first.editor);

      const decorations: monaco.editor.IModelDeltaDecoration[] = [
        {
          range: {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
          } as unknown as monaco.Range,
          options: {},
        },
      ];
      detectionService.detectConflicts.mockReturnValue([block]);
      detectionService.createDecorations.mockReturnValue(decorations);
      const next = createEditorMock(model, nextCollection);

      const result = service.refresh(next.editor);

      expect(previousClear).toHaveBeenCalledTimes(1);
      expect(detectionService.detectConflicts).toHaveBeenLastCalledWith(
        "content",
        model
      );
      expect(detectionService.createDecorations).toHaveBeenLastCalledWith([
        block,
      ]);
      expect(next.editor.createDecorationsCollection).toHaveBeenCalledWith(
        decorations
      );
      expect(widgetService.createWidgets).toHaveBeenCalled();
      expect(result).toEqual({ total: 1 });
      expect(service.currentBlocks).toEqual([block]);
    });
  });

  describe("resolveBlock", () => {
    it("should return without edits when editor has no model", () => {
      const editor = {
        getModel: jest.fn().mockReturnValue(null),
        focus: jest.fn(),
      } as unknown as ResolutionEditor;

      service.resolveBlock(editor, block, "current");

      expect(parser.getReplacementText).not.toHaveBeenCalled();
      expect(monacoService.executeEdits).not.toHaveBeenCalled();
      expect(editor.focus).not.toHaveBeenCalled();
    });

    it("should compute range from offsets and apply the edit when editor has a model", () => {
      const model = {
        getPositionAt: jest
          .fn()
          .mockImplementation((offset: number) =>
            offset === 20
              ? { lineNumber: 2, column: 3 }
              : { lineNumber: 7, column: 4 }
          ),
      } as unknown as ResolutionModel;
      const editor = {
        getModel: jest.fn().mockReturnValue(model),
        focus: jest.fn(),
      } as unknown as ResolutionEditor;
      parser.getReplacementText.mockReturnValue("replacement");

      service.resolveBlock(editor, block, "incoming");

      expect(parser.getReplacementText).toHaveBeenCalledWith(block, "incoming");
      expect(monacoService.executeEdits).toHaveBeenCalledTimes(1);
      expect(editor.focus).toHaveBeenCalledTimes(1);
      const call = monacoService.executeEdits.mock.calls[0];
      expect(call[0]).toBe(editor);
      expect(call[1]).toBe("conflict-resolution");
      expect(call[2]).toHaveLength(1);
      expect(call[2][0].text).toBe("replacement");
      expect(call[2][0].range).toMatchObject({
        startLineNumber: 2,
        startColumn: 3,
        endLineNumber: 7,
        endColumn: 4,
      });
    });
  });

  describe("focusFirstConflict", () => {
    it("should not reveal any line when no blocks exist", () => {
      const editor = {} as unknown as ResolutionEditor;

      service.focusFirstConflict(editor);

      expect(monacoService.revealLineInCenter).not.toHaveBeenCalled();
    });

    it("should reveal the first conflict line when blocks exist", () => {
      const model = {
        getValue: jest.fn().mockReturnValue("content"),
      } as unknown as ResolutionModel;
      detectionService.detectConflicts.mockReturnValue([
        { ...block, start: 42 },
      ]);
      detectionService.createDecorations.mockReturnValue([]);
      const { editor } = createEditorMock(model);
      service.refresh(editor);

      service.focusFirstConflict(editor);

      expect(monacoService.revealLineInCenter).toHaveBeenCalledWith(editor, 42);
    });
  });

  describe("dispose", () => {
    it("should clear widgets decorations and blocks when dispose is called", () => {
      const model = {
        getValue: jest.fn().mockReturnValue("content"),
      } as unknown as ResolutionModel;
      const collection = { clear: jest.fn() } as DecorationsCollection;
      detectionService.detectConflicts.mockReturnValue([block]);
      detectionService.createDecorations.mockReturnValue([]);
      const { editor } = createEditorMock(model, collection);
      service.refresh(editor);

      service.dispose(editor);

      expect(widgetService.clearWidgets).toHaveBeenCalledWith(editor);
      expect(collection.clear).toHaveBeenCalledTimes(1);
      expect(service.currentBlocks).toEqual([]);
    });

    it("should handle dispose gracefully when called without prior refresh", () => {
      const editor = {} as unknown as ResolutionEditor;

      service.dispose(editor);

      expect(widgetService.clearWidgets).toHaveBeenCalledWith(editor);
      expect(service.currentBlocks).toEqual([]);
    });
  });
});
