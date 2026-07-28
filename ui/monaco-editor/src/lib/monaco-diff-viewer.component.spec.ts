import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { MonacoDiffViewerComponent } from "./monaco-diff-viewer.component";
import { MonacoEditorService } from "./service/monaco-editor.service";

const INITIAL_TITLE = "Local vs Base";
const INITIAL_ORIGINAL_CONTENT = "base-content";
const INITIAL_MODIFIED_CONTENT = "local-content";
const UPDATED_ORIGINAL_CONTENT = "base-updated";
const UPDATED_MODIFIED_CONTENT = "local-updated";
const UPDATED_LANGUAGE = "typescript";
const LANGUAGE = "yaml";
const LIGHT_THEME = "vs";
const DARK_THEME = "vs-dark";
const OPTIONS = { readOnly: true, renderSideBySide: true };
const UPDATED_OPTIONS = { readOnly: false, renderSideBySide: false };

type TextModel = ReturnType<MonacoEditorService["createModel"]>;
type DiffEditor = ReturnType<MonacoEditorService["createDiffEditor"]>;
type CreateModelArgs = Parameters<MonacoEditorService["createModel"]>;
type CreateDiffEditorArgs = Parameters<MonacoEditorService["createDiffEditor"]>;
type DiffEditorModel = Exclude<Parameters<DiffEditor["setModel"]>[0], null>;
type DiffEditorOptions = Parameters<
  MonacoEditorService["updateDiffEditorOptions"]
>[1];
type Theme = Parameters<MonacoEditorService["setTheme"]>[0];
type DisposeModelArg = Parameters<MonacoEditorService["disposeModel"]>[0];

type MockedMonacoService = jest.Mocked<
  Pick<
    MonacoEditorService,
    | "createEditor"
    | "createDiffEditor"
    | "createModel"
    | "setTheme"
    | "applyDecorations"
    | "executeEdits"
    | "revealLineInCenter"
    | "disposeEditor"
    | "updateDiffEditorOptions"
    | "setModelLanguage"
    | "disposeModel"
  >
>;

type FakeModel = {
  setValue: jest.Mock<void, [string]>;
  dispose: jest.Mock<void, []>;
};

type FakeDiffEditor = {
  setModel: jest.Mock<void, [DiffEditorModel]>;
  updateOptions: jest.Mock<void, [DiffEditorOptions]>;
  dispose: jest.Mock<void, []>;
};

@Component({
  standalone: true,
  imports: [MonacoDiffViewerComponent],
  template: `<mxevolve-monaco-diff-viewer
    [title]="title"
    [originalContent]="originalContent"
    [modifiedContent]="modifiedContent"
    [language]="language"
    [options]="options"
  />`,
})
class TestHostComponent {
  title = INITIAL_TITLE;
  originalContent = INITIAL_ORIGINAL_CONTENT;
  modifiedContent: string | null = INITIAL_MODIFIED_CONTENT;
  language = LANGUAGE;
  options = OPTIONS;
}

describe("MonacoDiffViewerComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let monacoService: MockedMonacoService;
  let originalModel: FakeModel;
  let modifiedModel: FakeModel;
  let diffEditor: FakeDiffEditor;

  const flushMutationObserver = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    originalModel = {
      setValue: jest.fn<void, [string]>(),
      dispose: jest.fn<void, []>(),
    };

    modifiedModel = {
      setValue: jest.fn<void, [string]>(),
      dispose: jest.fn<void, []>(),
    };

    diffEditor = {
      setModel: jest.fn<void, [DiffEditorModel]>(),
      updateOptions: jest.fn<void, [DiffEditorOptions]>(),
      dispose: jest.fn<void, []>(),
    };

    monacoService = {
      createEditor: jest.fn(),
      createDiffEditor: jest
        .fn<DiffEditor, CreateDiffEditorArgs>()
        .mockReturnValue(diffEditor as Partial<DiffEditor> as DiffEditor),
      createModel: jest
        .fn<TextModel, CreateModelArgs>()
        .mockReturnValueOnce(originalModel as Partial<TextModel> as TextModel)
        .mockReturnValueOnce(modifiedModel as Partial<TextModel> as TextModel),
      setTheme: jest.fn<void, [Theme]>(),
      applyDecorations: jest.fn(),
      executeEdits: jest.fn(),
      revealLineInCenter: jest.fn(),
      disposeEditor: jest.fn(),
      updateDiffEditorOptions: jest.fn(),
      setModelLanguage: jest.fn(),
      disposeModel: jest.fn<void, [DisposeModelArg]>(),
    };

    TestBed.configureTestingModule({
      imports: [TestHostComponent, MonacoDiffViewerComponent],
    }).overrideComponent(MonacoDiffViewerComponent, {
      set: {
        providers: [{ provide: MonacoEditorService, useValue: monacoService }],
      },
    });

    fixture = TestBed.createComponent(TestHostComponent);
  });

  it("should create models and diff editor when component initializes", () => {
    const expectedSetModelPayload = {
      original: originalModel,
      modified: modifiedModel,
    };

    fixture.detectChanges();

    const hostElement = fixture.debugElement.query(
      By.directive(MonacoDiffViewerComponent)
    ).nativeElement as HTMLElement;
    const diffContainerElement = hostElement.querySelector(
      "div.w-full"
    ) as HTMLElement;

    expect(monacoService.createModel).toHaveBeenNthCalledWith(
      1,
      INITIAL_ORIGINAL_CONTENT,
      LANGUAGE
    );
    expect(monacoService.createModel).toHaveBeenNthCalledWith(
      2,
      INITIAL_MODIFIED_CONTENT,
      LANGUAGE
    );
    expect(monacoService.createDiffEditor).toHaveBeenCalledTimes(1);
    expect(monacoService.createDiffEditor).toHaveBeenCalledWith(
      diffContainerElement,
      OPTIONS
    );
    expect(diffEditor.setModel).toHaveBeenCalledWith(expectedSetModelPayload);
    expect(monacoService.setTheme).toHaveBeenCalledWith(LIGHT_THEME);
    expect(hostElement).toBeTruthy();
  });

  it("should update models when original and modified content change", () => {
    fixture.detectChanges();

    originalModel.setValue.mockClear();
    modifiedModel.setValue.mockClear();

    fixture.componentInstance.originalContent = UPDATED_ORIGINAL_CONTENT;
    fixture.componentInstance.modifiedContent = UPDATED_MODIFIED_CONTENT;

    fixture.detectChanges();

    expect(originalModel.setValue).toHaveBeenCalledTimes(1);
    expect(originalModel.setValue).toHaveBeenCalledWith(
      UPDATED_ORIGINAL_CONTENT
    );
    expect(modifiedModel.setValue).toHaveBeenCalledTimes(1);
    expect(modifiedModel.setValue).toHaveBeenCalledWith(
      UPDATED_MODIFIED_CONTENT
    );
  });

  it("should set empty modified value when modified content is null", () => {
    fixture.detectChanges();

    modifiedModel.setValue.mockClear();

    fixture.componentInstance.modifiedContent = null;

    fixture.detectChanges();

    expect(modifiedModel.setValue).toHaveBeenCalledTimes(1);
    expect(modifiedModel.setValue).toHaveBeenCalledWith("");
  });

  it("should update diff options and model language when language and options change", () => {
    fixture.detectChanges();

    monacoService.updateDiffEditorOptions.mockClear();
    monacoService.setModelLanguage.mockClear();

    fixture.componentInstance.language = UPDATED_LANGUAGE;
    fixture.componentInstance.options = UPDATED_OPTIONS;

    fixture.detectChanges();

    expect(monacoService.updateDiffEditorOptions).toHaveBeenCalledTimes(1);
    expect(monacoService.updateDiffEditorOptions).toHaveBeenCalledWith(
      diffEditor,
      UPDATED_OPTIONS
    );
    expect(monacoService.setModelLanguage).toHaveBeenCalledTimes(2);
    expect(monacoService.setModelLanguage).toHaveBeenNthCalledWith(
      1,
      originalModel,
      UPDATED_LANGUAGE
    );
    expect(monacoService.setModelLanguage).toHaveBeenNthCalledWith(
      2,
      modifiedModel,
      UPDATED_LANGUAGE
    );
  });

  it("should create modified model with empty value when modified content is null at initialization", () => {
    fixture.componentInstance.modifiedContent = null;

    fixture.detectChanges();

    expect(monacoService.createModel).toHaveBeenNthCalledWith(
      1,
      INITIAL_ORIGINAL_CONTENT,
      LANGUAGE
    );
    expect(monacoService.createModel).toHaveBeenNthCalledWith(2, "", LANGUAGE);
  });

  it("should set dark theme when app dark class exists", () => {
    document.documentElement.classList.remove("app-dark");
    document.documentElement.classList.add("app-dark");
    monacoService.setTheme.mockClear();

    const localFixture = TestBed.createComponent(TestHostComponent);
    localFixture.detectChanges();

    expect(monacoService.setTheme).toHaveBeenCalledWith(DARK_THEME);

    document.documentElement.classList.remove("app-dark");
    localFixture.destroy();
  });

  it("should start and stop observing theme class changes when component lifecycle changes", async () => {
    document.documentElement.classList.remove("app-dark");
    fixture.detectChanges();

    monacoService.setTheme.mockClear();
    document.documentElement.classList.add("app-dark");
    await flushMutationObserver();

    expect(monacoService.setTheme).toHaveBeenCalledWith(DARK_THEME);

    monacoService.setTheme.mockClear();
    fixture.destroy();

    document.documentElement.classList.remove("app-dark");
    await flushMutationObserver();

    expect(monacoService.setTheme).not.toHaveBeenCalled();
  });

  it("should dispose editor and models when component is destroyed", () => {
    fixture.detectChanges();

    fixture.destroy();

    expect(diffEditor.dispose).toHaveBeenCalledTimes(1);
    expect(monacoService.disposeModel).toHaveBeenCalledTimes(2);
    expect(monacoService.disposeModel).toHaveBeenNthCalledWith(
      1,
      originalModel
    );
    expect(monacoService.disposeModel).toHaveBeenNthCalledWith(
      2,
      modifiedModel
    );
  });
});
