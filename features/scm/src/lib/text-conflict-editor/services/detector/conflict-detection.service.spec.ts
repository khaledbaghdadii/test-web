import { TestBed } from "@angular/core/testing";
import { ConflictDetectionService } from "./conflict-detection.service";
import { ConflictParserService } from "../parser/conflict-parser.service";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { MonacoEditorService } from "@mxflow/ui/monaco-editor";
import {
  CONFLICT_CSS_CLASSES,
  CONFLICT_COLORS,
  type ConflictBlock,
} from "../../models/conflict.models";

// Stub out monaco runtime so MonacoEditorService module-level import is cheap.
jest.mock("monaco-editor/esm/vs/editor/editor.api.js", () => ({
  editor: {},
}));

type TextModel = monaco.editor.ITextModel;

describe("ConflictDetectionService", () => {
  let service: ConflictDetectionService;
  let parser: jest.Mocked<ConflictParserService>;
  let monacoService: jest.Mocked<MonacoEditorService>;

  beforeEach(() => {
    parser = {
      parse: jest.fn(),
      getConflictMarkers: jest.fn(),
      getReplacementText: jest.fn(),
    } as unknown as jest.Mocked<ConflictParserService>;

    monacoService = {
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
        ConflictDetectionService,
        { provide: ConflictParserService, useValue: parser },
        { provide: MonacoEditorService, useValue: monacoService },
      ],
    });

    service = TestBed.inject(ConflictDetectionService);
  });

  describe("detectConflicts", () => {
    it("should map offsets to line numbers and ids when parsed matches are provided", () => {
      parser.parse.mockReturnValue([
        {
          startOffset: 10,
          endOffset: 25,
          current: "ours",
          incoming: "theirs",
          raw: "raw-1",
        },
        {
          startOffset: 30,
          endOffset: 40,
          current: "ours-2",
          incoming: "theirs-2",
          raw: "raw-2",
        },
      ]);
      const positionByOffset: Record<
        number,
        { lineNumber: number; column: number }
      > = {
        10: { lineNumber: 3, column: 1 },
        25: { lineNumber: 7, column: 1 },
        30: { lineNumber: 11, column: 1 },
      };
      const model = {
        getPositionAt: jest.fn().mockImplementation((offset: number) => {
          return positionByOffset[offset] ?? { lineNumber: 13, column: 1 };
        }),
      } as unknown as TextModel;

      const result = service.detectConflicts("text", model);

      expect(result).toEqual([
        {
          startOffset: 10,
          endOffset: 25,
          current: "ours",
          incoming: "theirs",
          raw: "raw-1",
          id: "conflict-0-L3",
          start: 3,
          end: 7,
        },
        {
          startOffset: 30,
          endOffset: 40,
          current: "ours-2",
          incoming: "theirs-2",
          raw: "raw-2",
          id: "conflict-1-L11",
          start: 11,
          end: 13,
        },
      ]);
    });

    it("should return an empty array when parser finds no matches", () => {
      parser.parse.mockReturnValue([]);
      const model = {
        getPositionAt: jest.fn(),
      } as unknown as TextModel;

      const result = service.detectConflicts("no conflicts", model);

      expect(result).toEqual([]);
      expect(model.getPositionAt).not.toHaveBeenCalled();
    });
  });

  describe("createDecorations", () => {
    const block: ConflictBlock = {
      id: "b1",
      start: 10,
      end: 20,
      startOffset: 0,
      endOffset: 100,
      current: "ours",
      incoming: "theirs",
      raw: "raw",
    };

    it("should create marker and range decorations when block has current and incoming ranges", () => {
      parser.getConflictMarkers.mockReturnValue({
        start: 10,
        separator: 14,
        end: 20,
      });

      const result = service.createDecorations([block]);

      expect(result).toHaveLength(6);
      expect(result[0].options?.inlineClassName).toBe(
        CONFLICT_CSS_CLASSES.head
      );
      expect(result[1].options?.inlineClassName).toBe(
        CONFLICT_CSS_CLASSES.separator
      );
      expect(result[2].options?.inlineClassName).toBe(CONFLICT_CSS_CLASSES.end);
      expect(result[3].options?.className).toBe(
        CONFLICT_CSS_CLASSES.currentRange
      );
      expect(result[4].options?.className).toBe(
        CONFLICT_CSS_CLASSES.incomingRange
      );
      expect(result[3].options?.overviewRuler?.color).toBe(
        CONFLICT_COLORS.rulerCurrent
      );
      expect(result[4].options?.overviewRuler?.color).toBe(
        CONFLICT_COLORS.rulerIncoming
      );
      expect(result[5].options?.overviewRuler?.color).toBe(
        CONFLICT_COLORS.rulerConflict
      );
    });

    it("should skip range decorations when block has empty current and incoming ranges", () => {
      parser.getConflictMarkers.mockReturnValue({
        start: 10,
        separator: 11,
        end: 12,
      });

      const result = service.createDecorations([block]);

      expect(result).toHaveLength(4);
      expect(result[0].options?.inlineClassName).toBe(
        CONFLICT_CSS_CLASSES.head
      );
      expect(result[1].options?.inlineClassName).toBe(
        CONFLICT_CSS_CLASSES.separator
      );
      expect(result[2].options?.inlineClassName).toBe(CONFLICT_CSS_CLASSES.end);
      expect(result[3].options?.overviewRuler?.color).toBe(
        CONFLICT_COLORS.rulerConflict
      );
    });

    it("should include only current range decoration when incoming range is empty", () => {
      parser.getConflictMarkers.mockReturnValue({
        start: 10,
        separator: 14,
        end: 15,
      });

      const result = service.createDecorations([block]);

      expect(result).toHaveLength(5);
      expect(result[3].options?.className).toBe(
        CONFLICT_CSS_CLASSES.currentRange
      );
      expect(result[4].options?.overviewRuler?.color).toBe(
        CONFLICT_COLORS.rulerConflict
      );
    });

    it("should include only incoming range decoration when current range is empty", () => {
      parser.getConflictMarkers.mockReturnValue({
        start: 10,
        separator: 11,
        end: 20,
      });

      const result = service.createDecorations([block]);

      expect(result).toHaveLength(5);
      expect(result[3].options?.className).toBe(
        CONFLICT_CSS_CLASSES.incomingRange
      );
      expect(result[4].options?.overviewRuler?.color).toBe(
        CONFLICT_COLORS.rulerConflict
      );
    });

    it("should return an empty array when no blocks are provided", () => {
      const result = service.createDecorations([]);

      expect(result).toEqual([]);
    });
  });
});
