import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { MonacoEditorComponent } from "./monaco-editor.component";
import { MonacoEditorService } from "./service/monaco-editor.service";

jest.mock(
  "monaco-editor/esm/vs/editor/editor.api.js",
  () => ({ Range: jest.fn() }),
  {
    virtual: true,
  }
);

@Component({
  standalone: true,
  imports: [MonacoEditorComponent],
  template: `<mxevolve-monaco-editor
    [initialContent]="content"
    [language]="language"
    [options]="options"
    (editorReady)="onEditorReady($event)"
  />`,
})
class TestHostComponent {
  content = "hello world";
  language = "plaintext";
  options = {};
  readyEditor: unknown = null;

  onEditorReady(editor: unknown): void {
    this.readyEditor = editor;
  }
}

describe("MonacoEditorComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: MonacoEditorComponent;
  let monacoService: jest.Mocked<MonacoEditorService>;

  const flushMutationObserver = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const mockDisposable = { dispose: jest.fn() };
  const mockModel = {
    onDidChangeContent: jest.fn(() => mockDisposable),
    dispose: jest.fn(),
    getValue: jest.fn().mockReturnValue("hello world"),
  };
  const mockEditor = {
    getValue: jest.fn().mockReturnValue("hello world"),
    dispose: jest.fn(),
  };

  beforeEach(() => {
    monacoService = {
      createEditor: jest.fn().mockReturnValue(mockEditor),
      createModel: jest.fn().mockReturnValue(mockModel),
      setTheme: jest.fn(),
      setModelLanguage: jest.fn(),
      applyDecorations: jest.fn(),
      executeEdits: jest.fn(),
      revealLineInCenter: jest.fn(),
      disposeEditor: jest.fn(),
      disposeModel: jest.fn(),
    } as unknown as jest.Mocked<MonacoEditorService>;

    document.documentElement.classList.remove("app-dark");

    TestBed.configureTestingModule({
      imports: [TestHostComponent, MonacoEditorComponent],
    }).overrideComponent(MonacoEditorComponent, {
      set: {
        providers: [{ provide: MonacoEditorService, useValue: monacoService }],
      },
    });

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe("constructor", () => {
    it("should initialize with required services injected", () => {
      expect(component).toBeTruthy();
      expect(monacoService).toBeDefined();
    });

    it("should update the model language when language input changes", () => {
      monacoService.setModelLanguage.mockClear();

      fixture.componentInstance.language = "typescript";
      fixture.detectChanges();

      expect(monacoService.setModelLanguage).toHaveBeenCalledWith(
        mockModel,
        "typescript"
      );
    });

    it("should handle multiple consecutive language changes", () => {
      monacoService.setModelLanguage.mockClear();

      fixture.componentInstance.language = "typescript";
      fixture.detectChanges();

      fixture.componentInstance.language = "javascript";
      fixture.detectChanges();

      fixture.componentInstance.language = "yaml";
      fixture.detectChanges();

      expect(monacoService.setModelLanguage).toHaveBeenCalledTimes(3);
      expect(monacoService.setModelLanguage).toHaveBeenNthCalledWith(
        1,
        mockModel,
        "typescript"
      );
      expect(monacoService.setModelLanguage).toHaveBeenNthCalledWith(
        2,
        mockModel,
        "javascript"
      );
      expect(monacoService.setModelLanguage).toHaveBeenNthCalledWith(
        3,
        mockModel,
        "yaml"
      );
    });
  });

  describe("initialization", () => {
    it("should create the component when rendered", () => {
      expect(component).toBeTruthy();
    });

    it("should create a monaco model with the content and language when initialized", () => {
      expect(monacoService.createModel).toHaveBeenCalledWith(
        "hello world",
        "plaintext"
      );
    });

    it("should create a monaco editor with the model when initialized", () => {
      expect(monacoService.createEditor).toHaveBeenCalledWith(
        expect.objectContaining({ tagName: "DIV" }),
        expect.objectContaining({ model: mockModel })
      );
    });

    it("should emit editorReady with the editor instance when initialized", () => {
      expect(fixture.componentInstance.readyEditor).toBe(mockEditor);
    });

    it("should set light theme when platform is not dark when initialized", () => {
      expect(monacoService.setTheme).toHaveBeenCalledWith("vs");
    });

    it("should set dark theme when platform is dark when initialized", () => {
      monacoService.setTheme.mockClear();
      document.documentElement.classList.add("app-dark");

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      expect(monacoService.setTheme).toHaveBeenCalledWith("vs-dark");

      document.documentElement.classList.remove("app-dark");
    });

    it("should pass custom options to the editor when provided", () => {
      monacoService.createEditor.mockClear();
      monacoService.createModel.mockClear();

      fixture.componentInstance.options = { readOnly: true };
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.options = { readOnly: true };
      fixture.detectChanges();

      expect(monacoService.createEditor).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ readOnly: true })
      );
    });
  });

  describe("getValue", () => {
    it("should return editor value when editor exists", () => {
      expect(component.getValue()).toBe("hello world");
    });
  });

  describe("theme sync", () => {
    it("should sync theme to dark when platform becomes dark after initialization", async () => {
      monacoService.setTheme.mockClear();
      document.documentElement.classList.add("app-dark");
      await flushMutationObserver();

      expect(monacoService.setTheme).toHaveBeenCalledWith("vs-dark");

      document.documentElement.classList.remove("app-dark");
    });

    it("should sync theme to light when platform becomes light after initialization", async () => {
      document.documentElement.classList.add("app-dark");
      monacoService.setTheme.mockClear();
      document.documentElement.classList.remove("app-dark");
      await flushMutationObserver();

      expect(monacoService.setTheme).toHaveBeenCalledWith("vs");
    });

    it("should sync theme via MutationObserver when DOM class changes", async () => {
      monacoService.setTheme.mockClear();

      document.documentElement.classList.add("app-dark");
      await Promise.resolve();

      expect(monacoService.setTheme).toHaveBeenCalledWith("vs-dark");

      monacoService.setTheme.mockClear();
      document.documentElement.classList.remove("app-dark");
      await Promise.resolve();

      expect(monacoService.setTheme).toHaveBeenCalledWith("vs");
    });
  });

  describe("cleanup", () => {
    it("should dispose editor and model when component is destroyed", () => {
      fixture.destroy();

      expect(monacoService.disposeEditor).toHaveBeenCalledWith(mockEditor);
      expect(monacoService.disposeModel).toHaveBeenCalledWith(mockModel);
    });
  });
});
