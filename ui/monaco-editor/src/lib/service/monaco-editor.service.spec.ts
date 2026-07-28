import { MonacoEditorService } from "./monaco-editor.service";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

jest.mock("monaco-editor/esm/vs/editor/editor.api.js", () => {
  const create = jest.fn();
  const createModel = jest.fn();
  const createDiffEditor = jest.fn();
  const setTheme = jest.fn();
  const setModelLanguage = jest.fn();

  return {
    __esModule: true,
    editor: {
      create,
      createModel,
      createDiffEditor,
      setTheme,
      setModelLanguage,
    },
    __mocks: {
      create,
      createModel,
      createDiffEditor,
      setTheme,
      setModelLanguage,
    },
  };
});

describe("MonacoEditorService", () => {
  let service: MonacoEditorService;
  type CreateEditorOptions = Parameters<MonacoEditorService["createEditor"]>[1];
  type ApplyDecorationsEditor = Parameters<
    MonacoEditorService["applyDecorations"]
  >[0];
  type Decorations = Parameters<MonacoEditorService["applyDecorations"]>[1];
  type ExecuteEditsEditor = Parameters<MonacoEditorService["executeEdits"]>[0];
  type Edits = Parameters<MonacoEditorService["executeEdits"]>[2];
  type RevealEditor = Parameters<MonacoEditorService["revealLineInCenter"]>[0];
  type DisposableEditor = NonNullable<
    Parameters<MonacoEditorService["disposeEditor"]>[0]
  >;
  type DiffEditor = Parameters<
    MonacoEditorService["updateDiffEditorOptions"]
  >[0];
  type DiffOptions = Parameters<
    MonacoEditorService["updateDiffEditorOptions"]
  >[1];
  type CreateDiffEditorOptions = Parameters<
    MonacoEditorService["createDiffEditor"]
  >[1];
  type TextModel = Parameters<MonacoEditorService["setModelLanguage"]>[0];
  type DisposableModel = NonNullable<
    Parameters<MonacoEditorService["disposeModel"]>[0]
  >;
  let monacoMocks: {
    create: jest.Mock;
    createModel: jest.Mock;
    createDiffEditor: jest.Mock;
    setTheme: jest.Mock;
    setModelLanguage: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new MonacoEditorService();
    const monacoModule = await import(
      "monaco-editor/esm/vs/editor/editor.api.js"
    );
    monacoMocks = (monacoModule as unknown as { __mocks: typeof monacoMocks })
      .__mocks;
  });

  describe("createEditor", () => {
    it("should delegate to monaco editor.create with defaults and custom options when createEditor is called", () => {
      const fakeEditor = { id: "editor" };
      monacoMocks.create.mockReturnValue(fakeEditor);
      const container = document.createElement("div");
      const options = {
        model: { id: "model" } as unknown as monaco.editor.ITextModel,
        overviewRulerLanes: 5,
      } as CreateEditorOptions;

      const result = service.createEditor(container, options);

      expect(monacoMocks.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          automaticLayout: true,
          glyphMargin: true,
          folding: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          overviewRulerLanes: 5,
          showFoldingControls: "always",
          model: options.model,
        })
      );
      expect(result).toBe(fakeEditor);
    });
  });

  describe("createDiffEditor", () => {
    it("should delegate to monaco editor.createDiffEditor with defaults and custom options when createDiffEditor is called", () => {
      const fakeDiffEditor = { id: "diff-editor" };
      monacoMocks.createDiffEditor.mockReturnValue(fakeDiffEditor);
      const container = document.createElement("div");
      const options: CreateDiffEditorOptions = {
        renderSideBySide: false,
      };

      const result = service.createDiffEditor(container, options);

      expect(monacoMocks.createDiffEditor).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          automaticLayout: true,
          glyphMargin: true,
          folding: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          renderSideBySide: false,
          showFoldingControls: "always",
        })
      );
      expect(result).toBe(fakeDiffEditor);
    });

    it("should use default options when createDiffEditor is called without options", () => {
      const container = document.createElement("div");

      service.createDiffEditor(container);

      expect(monacoMocks.createDiffEditor).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          automaticLayout: true,
          glyphMargin: true,
          folding: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          showFoldingControls: "always",
        })
      );
    });
  });

  describe("createModel", () => {
    it("should delegate to monaco editor.createModel when createModel is called with content and language", () => {
      const fakeModel = { id: "model" };
      monacoMocks.createModel.mockReturnValue(fakeModel);

      const result = service.createModel("content", "typescript");

      expect(monacoMocks.createModel).toHaveBeenCalledWith(
        "content",
        "typescript"
      );
      expect(result).toBe(fakeModel);
    });

    it("should use plaintext by default when createModel is called without language", () => {
      service.createModel("content");

      expect(monacoMocks.createModel).toHaveBeenCalledWith(
        "content",
        "plaintext"
      );
    });
  });

  describe("setTheme", () => {
    it("should delegate to monaco editor.setTheme when setTheme is called", () => {
      service.setTheme("vs-dark");

      expect(monacoMocks.setTheme).toHaveBeenCalledWith("vs-dark");
    });
  });

  describe("applyDecorations", () => {
    it("should delegate to createDecorationsCollection when applyDecorations is called", () => {
      const collection = {
        id: "decorations",
      } as unknown as monaco.editor.IEditorDecorationsCollection;
      const editor = {
        createDecorationsCollection: jest.fn().mockReturnValue(collection),
      } as unknown as ApplyDecorationsEditor;
      const decorations: Decorations = [
        {
          range: {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
          },
          options: {},
        },
      ];

      const result = service.applyDecorations(editor, decorations);

      expect(editor.createDecorationsCollection).toHaveBeenCalledWith(
        decorations
      );
      expect(result).toBe(collection);
    });
  });

  describe("executeEdits", () => {
    it("should wrap edit execution with undo stops when executeEdits is called", () => {
      const editor = {
        pushUndoStop: jest.fn(),
        executeEdits: jest.fn(),
      } as unknown as ExecuteEditsEditor;
      const edits: Edits = [
        {
          range: {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
          },
          text: "x",
        },
      ];

      service.executeEdits(editor, "test-source", edits);

      expect(editor.pushUndoStop).toHaveBeenCalledTimes(2);
      expect(editor.executeEdits).toHaveBeenCalledWith("test-source", edits);
    });
  });

  describe("revealLineInCenter", () => {
    it("should reveal and set cursor position when revealLineInCenter is called", () => {
      const editor = {
        revealLineInCenter: jest.fn(),
        setPosition: jest.fn(),
      } as unknown as RevealEditor;

      service.revealLineInCenter(editor, 19);

      expect(editor.revealLineInCenter).toHaveBeenCalledWith(19);
      expect(editor.setPosition).toHaveBeenCalledWith({
        lineNumber: 19,
        column: 1,
      });
    });
  });

  describe("disposeEditor", () => {
    it("should do nothing when disposeEditor is called with null", () => {
      expect(() => service.disposeEditor(null)).not.toThrow();
    });

    it("should dispose the editor when disposeEditor is called", () => {
      const editor = { dispose: jest.fn() } as unknown as DisposableEditor;

      service.disposeEditor(editor);

      expect(editor.dispose).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateDiffEditorOptions", () => {
    it("should delegate to diff editor updateOptions when updateDiffEditorOptions is called", () => {
      const diffEditor = {
        updateOptions: jest.fn(),
      } as unknown as DiffEditor;
      const options: DiffOptions = {
        readOnly: true,
        renderSideBySide: false,
      };

      service.updateDiffEditorOptions(diffEditor, options);

      expect(diffEditor.updateOptions).toHaveBeenCalledWith(options);
    });
  });

  describe("setModelLanguage", () => {
    it("should delegate to monaco editor.setModelLanguage when setModelLanguage is called", () => {
      const model = { id: "model" } as unknown as TextModel;

      service.setModelLanguage(model, "typescript");

      expect(monacoMocks.setModelLanguage).toHaveBeenCalledWith(
        model,
        "typescript"
      );
    });
  });

  describe("disposeModel", () => {
    it("should do nothing when disposeModel is called with null", () => {
      expect(() => service.disposeModel(null)).not.toThrow();
    });

    it("should dispose the model when disposeModel is called", () => {
      const model = { dispose: jest.fn() } as unknown as DisposableModel;

      service.disposeModel(model);

      expect(model.dispose).toHaveBeenCalledTimes(1);
    });
  });
});
