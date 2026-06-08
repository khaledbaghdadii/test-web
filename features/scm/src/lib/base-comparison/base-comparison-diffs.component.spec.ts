import { Component, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BaseComparisonDiffsComponent } from "./base-comparison-diffs.component";
import { BaseComparisonDiffViewerOptions } from "./model/base-comparison-diffs.model";

const BASE_CONTENT = "base-config";
const LOCAL_CONTENT = "local-config";
const REMOTE_CONTENT = "remote-config";
const UPDATED_BASE_CONTENT = "base-config-updated";
const LANGUAGE = "yaml";
const UPDATED_LANGUAGE = "json";
const BASE_LABEL = "Base";
const LOCAL_LABEL = "Local";
const REMOTE_LABEL = "Remote";
const HOST_VIEWER_OPTIONS: BaseComparisonDiffViewerOptions = {
  readOnly: true,
  renderSideBySide: true,
};

const CUSTOM_LOCAL_LABEL = "Current";
const CUSTOM_REMOTE_LABEL = "Incoming";
const CUSTOM_BASE_LABEL = "Ancestor";
const UPDATED_VIEWER_OPTIONS: BaseComparisonDiffViewerOptions = {
  readOnly: false,
  renderSideBySide: false,
};

@Component({
  selector: "mxevolve-monaco-diff-viewer",
  standalone: true,
  template: "",
})
class MockMonacoDiffViewerComponent {
  @Input({ required: true })
  title!: string;

  @Input({ required: true })
  originalContent!: string;

  @Input()
  modifiedContent: string | null = null;

  @Input()
  language = "plaintext";

  @Input()
  options: BaseComparisonDiffViewerOptions = HOST_VIEWER_OPTIONS;
}

@Component({
  standalone: true,
  imports: [BaseComparisonDiffsComponent],
  template: `<mxevolve-base-comparison-diffs
    [baseContent]="baseContent"
    [localContent]="localContent"
    [remoteContent]="remoteContent"
    [language]="language"
    [baseLabel]="baseLabel"
    [localLabel]="localLabel"
    [remoteLabel]="remoteLabel"
    [viewerOptions]="viewerOptions"
  />`,
})
class TestHostComponent {
  baseContent = BASE_CONTENT;
  localContent: string | null = LOCAL_CONTENT;
  remoteContent: string | null = REMOTE_CONTENT;
  language = LANGUAGE;
  baseLabel = BASE_LABEL;
  localLabel = LOCAL_LABEL;
  remoteLabel = REMOTE_LABEL;
  viewerOptions: BaseComparisonDiffViewerOptions = HOST_VIEWER_OPTIONS;
}

@Component({
  standalone: true,
  imports: [BaseComparisonDiffsComponent],
  template: `<mxevolve-base-comparison-diffs [baseContent]="baseContent" />`,
})
class TestHostWithDefaultsComponent {
  baseContent = BASE_CONTENT;
}

describe("BaseComparisonDiffsComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, BaseComparisonDiffsComponent],
    }).overrideComponent(BaseComparisonDiffsComponent, {
      set: {
        imports: [MockMonacoDiffViewerComponent],
      },
    });

    fixture = TestBed.createComponent(TestHostComponent);
  });

  it("should render local and remote viewers when component initializes", () => {
    const expectedLocalTitle = `${LOCAL_LABEL} vs ${BASE_LABEL}`;
    const expectedRemoteTitle = `${REMOTE_LABEL} vs ${BASE_LABEL}`;

    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );

    const localViewer = viewers[0]
      .componentInstance as MockMonacoDiffViewerComponent;
    const remoteViewer = viewers[1]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(localViewer.title).toBe(expectedLocalTitle);
    expect(localViewer.originalContent).toBe(BASE_CONTENT);
    expect(localViewer.modifiedContent).toBe(LOCAL_CONTENT);
    expect(localViewer.language).toBe(LANGUAGE);
    expect(localViewer.options).toBe(HOST_VIEWER_OPTIONS);
    expect(remoteViewer.title).toBe(expectedRemoteTitle);
    expect(remoteViewer.originalContent).toBe(BASE_CONTENT);
    expect(remoteViewer.modifiedContent).toBe(REMOTE_CONTENT);
    expect(remoteViewer.language).toBe(LANGUAGE);
    expect(remoteViewer.options).toBe(HOST_VIEWER_OPTIONS);
  });

  it("should show deleted title when remote content is null", () => {
    const expectedRemoteDeletedTitle = `${REMOTE_LABEL} (deleted) vs ${BASE_LABEL}`;

    fixture.componentInstance.remoteContent = null;

    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );

    const remoteViewer = viewers[1]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(remoteViewer.title).toBe(expectedRemoteDeletedTitle);
    expect(remoteViewer.originalContent).toBe(BASE_CONTENT);
    expect(remoteViewer.modifiedContent).toBeNull();
    expect(remoteViewer.options).toBe(HOST_VIEWER_OPTIONS);
  });

  it("should show deleted title when local content is null", () => {
    const expectedLocalDeletedTitle = `${LOCAL_LABEL} (deleted) vs ${BASE_LABEL}`;

    fixture.componentInstance.localContent = null;

    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );
    const localViewer = viewers[0]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(localViewer.title).toBe(expectedLocalDeletedTitle);
    expect(localViewer.originalContent).toBe(BASE_CONTENT);
    expect(localViewer.modifiedContent).toBeNull();
    expect(localViewer.options).toBe(HOST_VIEWER_OPTIONS);
  });

  it("should update viewer titles when labels change", () => {
    const expectedLocalTitle = `${CUSTOM_LOCAL_LABEL} vs ${CUSTOM_BASE_LABEL}`;
    const expectedRemoteTitle = `${CUSTOM_REMOTE_LABEL} vs ${CUSTOM_BASE_LABEL}`;

    fixture.componentInstance.localLabel = CUSTOM_LOCAL_LABEL;
    fixture.componentInstance.remoteLabel = CUSTOM_REMOTE_LABEL;
    fixture.componentInstance.baseLabel = CUSTOM_BASE_LABEL;

    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );

    const localViewer = viewers[0]
      .componentInstance as MockMonacoDiffViewerComponent;
    const remoteViewer = viewers[1]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(localViewer.title).toBe(expectedLocalTitle);
    expect(remoteViewer.title).toBe(expectedRemoteTitle);
    expect(localViewer.options).toBe(HOST_VIEWER_OPTIONS);
    expect(remoteViewer.options).toBe(HOST_VIEWER_OPTIONS);
  });

  it("should update viewer options when viewer options input changes", () => {
    fixture.detectChanges();

    fixture.componentInstance.viewerOptions = UPDATED_VIEWER_OPTIONS;

    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );
    const localViewer = viewers[0]
      .componentInstance as MockMonacoDiffViewerComponent;
    const remoteViewer = viewers[1]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(localViewer.options).toBe(UPDATED_VIEWER_OPTIONS);
    expect(remoteViewer.options).toBe(UPDATED_VIEWER_OPTIONS);
  });

  it("should update language on both viewers when language input changes", () => {
    fixture.detectChanges();

    fixture.componentInstance.language = UPDATED_LANGUAGE;

    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );
    const localViewer = viewers[0]
      .componentInstance as MockMonacoDiffViewerComponent;
    const remoteViewer = viewers[1]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(localViewer.language).toBe(UPDATED_LANGUAGE);
    expect(remoteViewer.language).toBe(UPDATED_LANGUAGE);
  });

  it("should update base content on both viewers when base content input changes", () => {
    fixture.detectChanges();

    fixture.componentInstance.baseContent = UPDATED_BASE_CONTENT;

    fixture.detectChanges();

    const viewers = fixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );
    const localViewer = viewers[0]
      .componentInstance as MockMonacoDiffViewerComponent;
    const remoteViewer = viewers[1]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(localViewer.originalContent).toBe(UPDATED_BASE_CONTENT);
    expect(remoteViewer.originalContent).toBe(UPDATED_BASE_CONTENT);
  });

  it("should use default labels and options when optional inputs are not provided", () => {
    const defaultFixture = TestBed.createComponent(
      TestHostWithDefaultsComponent
    );

    defaultFixture.detectChanges();

    const viewers = defaultFixture.debugElement.queryAll(
      By.directive(MockMonacoDiffViewerComponent)
    );
    const localViewer = viewers[0]
      .componentInstance as MockMonacoDiffViewerComponent;
    const remoteViewer = viewers[1]
      .componentInstance as MockMonacoDiffViewerComponent;

    expect(viewers).toHaveLength(2);
    expect(localViewer.title).toBe("Local (deleted) vs Base");
    expect(localViewer.language).toBe("plaintext");
    expect(localViewer.options).toEqual({
      readOnly: true,
      renderSideBySide: true,
    });
    expect(remoteViewer.title).toBe("Remote (deleted) vs Base");
    expect(remoteViewer.language).toBe("plaintext");
    expect(remoteViewer.options).toEqual({
      readOnly: true,
      renderSideBySide: true,
    });

    defaultFixture.destroy();
  });
});
