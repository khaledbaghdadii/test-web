import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonacoEditorService } from "./monaco-editor.service";
import { syncMonacoThemeWithApp } from "./sync-monaco-theme";

@Component({
  standalone: true,
  template: "",
})
class TestHostComponent {
  constructor() {
    syncMonacoThemeWithApp();
  }
}

describe("syncMonacoThemeWithApp", () => {
  let fixture: ComponentFixture<TestHostComponent> | null;
  let monacoService: Pick<MonacoEditorService, "setTheme">;

  const flushMutationObserver = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    fixture = null;
    monacoService = {
      setTheme: jest.fn(),
    };

    document.documentElement.classList.remove("app-dark");

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: MonacoEditorService, useValue: monacoService }],
    });
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
      fixture = null;
    }
    document.documentElement.classList.remove("app-dark");
  });

  it("should apply light theme initially when app is not dark", () => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(monacoService.setTheme).toHaveBeenCalledWith("vs");
  });

  it("should apply dark theme initially when app is dark", () => {
    document.documentElement.classList.add("app-dark");

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(monacoService.setTheme).toHaveBeenCalledWith("vs-dark");
  });

  it("should update theme when document class changes", async () => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    (monacoService.setTheme as jest.Mock).mockClear();

    document.documentElement.classList.add("app-dark");
    await flushMutationObserver();

    expect(monacoService.setTheme).toHaveBeenCalledWith("vs-dark");

    (monacoService.setTheme as jest.Mock).mockClear();

    document.documentElement.classList.remove("app-dark");
    await flushMutationObserver();

    expect(monacoService.setTheme).toHaveBeenCalledWith("vs");
  });

  it("should stop observing class changes after destroy", async () => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    (monacoService.setTheme as jest.Mock).mockClear();
    fixture.destroy();
    fixture = null;

    document.documentElement.classList.add("app-dark");
    await flushMutationObserver();

    expect(monacoService.setTheme).not.toHaveBeenCalled();
  });
});
