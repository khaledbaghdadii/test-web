import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TextConflictEditorComponent } from "./text-conflict-editor.component";
import { ConflictDetectionService } from "./services/detector/conflict-detection.service";
import { ConflictParserService } from "./services/parser/conflict-parser.service";
import { Button } from "primeng/button";
import type { ConflictStatus } from "./models/conflict.models";
import { MonacoEditorService } from "@mxflow/ui/monaco-editor";
import { MonacoConflictResolutionService } from "./services/resolver/monaco-conflict-resolution.service";
import { MonacoConflictWidgetService } from "./services/widget/monaco-conflict-widget.service";

jest.mock(
  "monaco-editor/esm/vs/editor/editor.api.js",
  () => ({ Range: jest.fn() }),
  {
    virtual: true,
  }
);

const EDITOR_CONTENT = "<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>>\n";
const RESOLVED_CONTENT = "ours\n";

const mockModel = {
  onDidChangeContent: jest.fn(),
  dispose: jest.fn(),
  getValue: jest.fn().mockReturnValue(RESOLVED_CONTENT),
};

const mockEditor = {
  getValue: jest.fn().mockReturnValue(RESOLVED_CONTENT),
  getModel: jest.fn().mockReturnValue(mockModel),
  dispose: jest.fn(),
};

/**
 * Stub for the generic Monaco editor component.
 * Replaces the real editor in conflict editor tests.
 */
@Component({
  selector: "mxevolve-monaco-editor",
  standalone: true,
  template: "",
})
class MockMonacoEditorComponent {
  @Input() initialContent = "";
  @Input() language = "plaintext";
  @Input() isResolving = false;
  @Input() options = {};
  @Output() editorReady = new EventEmitter<unknown>();

  getValue(): string {
    return mockEditor.getValue();
  }
}

@Component({
  standalone: true,
  imports: [TextConflictEditorComponent],
  template: `<mxevolve-text-conflict-editor
    [initialContent]="content"
    [language]="language"
    [isResolving]="isResolving"
    (resolvedContent)="onExtracted($event)"
  />`,
})
class TestHostComponent {
  content = EDITOR_CONTENT;
  language = "plaintext";
  isResolving = false;
  extractedContent: string | null = null;

  onExtracted(value: string): void {
    this.extractedContent = value;
  }
}

describe("TextConflictEditorComponent", () => {
  const REFRESH_DEBOUNCE_MS = 100;
  const STATUS_WITH_CONFLICTS: ConflictStatus = { total: 2 };
  const STATUS_ALL_RESOLVED: ConflictStatus = { total: 0 };
  type ReadyEditor = Parameters<
    TextConflictEditorComponent["onEditorReady"]
  >[0];

  let fixture: ComponentFixture<TestHostComponent>;
  let component: TextConflictEditorComponent;
  let resolutionService: jest.Mocked<MonacoConflictResolutionService>;
  let isFixtureDestroyed: boolean;

  let contentChangeCallback: (() => void) | null;
  const mockDisposable = { dispose: jest.fn() };

  const triggerContentChange = (): void => {
    expect(contentChangeCallback).toBeTruthy();
    contentChangeCallback?.();
  };

  beforeEach(() => {
    isFixtureDestroyed = false;
    contentChangeCallback = null;
    mockModel.onDidChangeContent.mockImplementation((cb: () => void) => {
      contentChangeCallback = cb;
      return mockDisposable;
    });

    resolutionService = {
      refresh: jest.fn().mockReturnValue(STATUS_WITH_CONFLICTS),
      resolveBlock: jest.fn(),
      focusFirstConflict: jest.fn(),
      dispose: jest.fn(),
      currentBlocks: [],
    } as unknown as jest.Mocked<MonacoConflictResolutionService>;

    TestBed.configureTestingModule({
      imports: [TestHostComponent, TextConflictEditorComponent],
    }).overrideComponent(TextConflictEditorComponent, {
      set: {
        imports: [MockMonacoEditorComponent, Button],
        providers: [
          { provide: ConflictParserService, useValue: {} },
          { provide: ConflictDetectionService, useValue: {} },
          { provide: MonacoConflictWidgetService, useValue: {} },
          { provide: MonacoEditorService, useValue: {} },
          {
            provide: MonacoConflictResolutionService,
            useValue: resolutionService,
          },
        ],
      },
    });

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;

    // Simulate the generic editor emitting editorReady
    component.onEditorReady(mockEditor as unknown as ReadyEditor);
  });

  afterEach(() => {
    if (!isFixtureDestroyed) {
      fixture.destroy();
    }
  });

  describe("initialization via onEditorReady", () => {
    it("should create the component when rendered", () => {
      expect(component).toBeTruthy();
    });

    it("should refresh conflicts when editor is ready", () => {
      expect(resolutionService.refresh).toHaveBeenCalledWith(mockEditor);
    });

    it("should focus the first conflict when editor is ready", () => {
      expect(resolutionService.focusFirstConflict).toHaveBeenCalledWith(
        mockEditor
      );
    });

    it("should register a content change listener on the model when editor is ready", () => {
      expect(mockModel.onDidChangeContent).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe("conflict status", () => {
    it("should expose total conflicts count when conflicts exist", () => {
      expect(component.totalConflicts()).toBe(STATUS_WITH_CONFLICTS.total);
    });

    it("should report not all resolved when conflicts remain", () => {
      expect(component.allResolved()).toBe(false);
    });

    it("should report all resolved when no conflicts remain", () => {
      component.conflictStatus.set(STATUS_ALL_RESOLVED);

      expect(component.allResolved()).toBe(true);
    });
  });

  describe("content change debouncing", () => {
    it("should debounce refresh when content changes rapidly", fakeAsync(() => {
      resolutionService.refresh.mockClear();

      triggerContentChange();
      triggerContentChange();
      triggerContentChange();

      tick(REFRESH_DEBOUNCE_MS);

      expect(resolutionService.refresh).toHaveBeenCalledTimes(1);
    }));

    it("should update conflict status when content changes after debounce", fakeAsync(() => {
      resolutionService.refresh.mockReturnValue(STATUS_ALL_RESOLVED);

      triggerContentChange();
      tick(REFRESH_DEBOUNCE_MS);

      expect(component.conflictStatus()).toEqual(STATUS_ALL_RESOLVED);
    }));
  });

  describe("onResolve", () => {
    it("should emit resolved content when onResolve is called", () => {
      const host = fixture.componentInstance;

      component.onResolve();

      expect(host.extractedContent).toBe(RESOLVED_CONTENT);
    });
  });

  describe("cleanup", () => {
    it("should dispose conflict resolution when component is destroyed", () => {
      fixture.destroy();
      isFixtureDestroyed = true;

      expect(resolutionService.dispose).toHaveBeenCalledWith(mockEditor);
      expect(mockDisposable.dispose).toHaveBeenCalled();
    });

    it("should clear pending refresh timer when component is destroyed", fakeAsync(() => {
      resolutionService.refresh.mockClear();

      triggerContentChange();
      fixture.destroy();
      isFixtureDestroyed = true;
      tick(REFRESH_DEBOUNCE_MS);

      expect(resolutionService.refresh).not.toHaveBeenCalled();
    }));
  });

  describe("template", () => {
    it("should show remaining conflicts message when conflicts exist", () => {
      component.conflictStatus.set(STATUS_WITH_CONFLICTS);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const text = el.textContent;

      expect(text).toContain(
        `${STATUS_WITH_CONFLICTS.total} conflict(s) remaining`
      );
    });

    it("should show all resolved message when no conflicts remain", () => {
      component.conflictStatus.set(STATUS_ALL_RESOLVED);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const text = el.textContent;

      expect(text).toContain("All conflicts resolved");
    });

    it("should disable resolve button when conflicts remain", () => {
      component.conflictStatus.set(STATUS_WITH_CONFLICTS);
      fixture.detectChanges();

      const button = (fixture.nativeElement as HTMLElement).querySelector(
        "button"
      );

      expect(button?.disabled).toBe(true);
    });

    it("should enable resolve button when all conflicts are resolved", () => {
      component.conflictStatus.set(STATUS_ALL_RESOLVED);
      fixture.detectChanges();

      const button = (fixture.nativeElement as HTMLElement).querySelector(
        "button"
      );

      expect(button?.disabled).toBe(false);
    });

    it("should disable resolve button when resolving is in progress", () => {
      const host = fixture.componentInstance;
      component.conflictStatus.set(STATUS_ALL_RESOLVED);
      host.isResolving = true;
      fixture.detectChanges();

      const button = (fixture.nativeElement as HTMLElement).querySelector(
        "button"
      );

      expect(button?.disabled).toBe(true);
    });
  });
});
