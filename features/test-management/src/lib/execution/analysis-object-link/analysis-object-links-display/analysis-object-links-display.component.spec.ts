import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LinkedDetectionData } from "../../test-case-execution/test-case-execution-with-linked-analysis-objects";
import {
  binaryRegressionId,
  configurationRegressionId,
  LITE_BINARY_REGRESSION_1,
  LITE_CONFIGURATION_REGRESSION_1,
} from "../analysis-object-link-test-utils";
import {
  DetectionCategory,
  DetectionType,
} from "@mxflow/features/failure-management";
import { provideRouter, Routes } from "@angular/router";
import { By } from "@angular/platform-browser";
import { AnalysisObjectLinksDisplayComponent } from "./analysis-object-links-display.component";

describe("AnalysisObjectLinksDisplayComponent", () => {
  let component: AnalysisObjectLinksDisplayComponent;
  let fixture: ComponentFixture<AnalysisObjectLinksDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisObjectLinksDisplayComponent],
      providers: [provideRouter(getLinkedDetectionDataRoutes())],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisObjectLinksDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it('should display "-" when no linked detections are provided', () => {
    component.linkedDetectionsData = [];
    component.detectionCategory = DetectionCategory.Regression;
    fixture.detectChanges();
    const spanElement = fixture.debugElement.query(By.css("span"));
    expect(spanElement).toBeTruthy();
    expect(spanElement.nativeElement.textContent.trim()).toBe("-");
  });

  it("should display linked detections", () => {
    component.linkedDetectionsData = getLinkedDetectionsData();
    component.detectionCategory = DetectionCategory.Regression;
    fixture.detectChanges();

    const linkedElements = fixture.debugElement.queryAll(
      By.css('[data-testid="linked-detection"]')
    );

    expect(linkedElements).toBeTruthy();
    expect(linkedElements.length).toBe(2);

    const firstLink = linkedElements[0].nativeElement as HTMLAnchorElement;
    const secondLink = linkedElements[1].nativeElement as HTMLAnchorElement;

    const firstLinkText = firstLink.getAttribute("href");
    const expectedFirstLink = `/app/detections/regressions/binary/${binaryRegressionId}`;

    const secondLinkText = secondLink.getAttribute("href");
    const expectedSecondLink = `/app/detections/regressions/configuration/${configurationRegressionId}`;

    expect(firstLinkText).toBe(expectedFirstLink);
    expect(secondLinkText).toBe(expectedSecondLink);
  });
});

function getLinkedDetectionsData(): LinkedDetectionData[] {
  return [
    {
      ...LITE_BINARY_REGRESSION_1,
      id: binaryRegressionId,
      analysisObjectType: DetectionType.Binary,
    },
    {
      ...LITE_CONFIGURATION_REGRESSION_1,
      id: configurationRegressionId,
      analysisObjectType: DetectionType.Configuration,
    },
  ];
}

function getLinkedDetectionDataRoutes(): Routes {
  return [
    {
      path: "app/detections/regressions/binary/:binaryRegressionId",
      component: AnalysisObjectLinksDisplayComponent,
    },
    {
      path: "app/detections/regressions/configuration/:configurationRegressionId",
      component: AnalysisObjectLinksDisplayComponent,
    },
  ];
}
