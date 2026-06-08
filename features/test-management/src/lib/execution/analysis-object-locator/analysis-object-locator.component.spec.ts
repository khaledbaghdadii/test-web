import { ActivatedRoute, Router } from "@angular/router";
import { AnalysisObjectLocatorComponent } from "./analysis-object-locator.component";
import { AnalysisObjectLocatorType } from "./analysis-object-locator-type";
import {
  DetectionCategory,
  DetectionType,
  DetectionUriBuilderPipe,
} from "@mxflow/features/failure-management";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("Resource Locator Component Test", () => {
  const projectId = "projectId";
  const randomResourceType = "resourceType";
  const resourceId = "resourceId";
  const detectionRoute = "detectionRoute";

  const params = {
    projectId: projectId,
    resourceType: randomResourceType,
    resourceId: resourceId,
  };

  let activatedRoute: ActivatedRoute;
  let router: Router;
  let detectionUriBuilderPipe: DetectionUriBuilderPipe;

  let component: AnalysisObjectLocatorComponent;
  let fixture: ComponentFixture<AnalysisObjectLocatorComponent>;

  beforeEach(() => {
    activatedRoute = {
      snapshot: {
        queryParams: params,
      },
    } as unknown as ActivatedRoute;
    router = {
      navigateByUrl: jest.fn(),
      navigate: jest.fn(),
    } as unknown as Router;
    detectionUriBuilderPipe = {
      transform: jest.fn(() => detectionRoute),
    } as unknown as DetectionUriBuilderPipe;
    TestBed.configureTestingModule({
      imports: [AnalysisObjectLocatorComponent],
    }).overrideComponent(AnalysisObjectLocatorComponent, {
      set: {
        providers: [
          {
            provide: DetectionUriBuilderPipe,
            useValue: detectionUriBuilderPipe,
          },
          { provide: ActivatedRoute, useValue: activatedRoute },
          { provide: Router, useValue: router },
        ],
      },
    });

    fixture = TestBed.createComponent(AnalysisObjectLocatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it.each([
    [
      AnalysisObjectLocatorType.BinaryRegression,
      DetectionType.Binary,
      DetectionCategory.Regression,
      undefined,
    ],
    [
      AnalysisObjectLocatorType.BinaryImpact,
      DetectionType.Binary,
      DetectionCategory.Impact,
      projectId,
    ],
    [
      AnalysisObjectLocatorType.ConfigurationRegression,
      DetectionType.Configuration,
      DetectionCategory.Regression,
      projectId,
    ],
    [
      AnalysisObjectLocatorType.ConfigurationImpact,
      DetectionType.Configuration,
      DetectionCategory.Impact,
      projectId,
    ],
  ])(
    "should navigate to the detection page based on the provided type",
    (
      analysisObjectLocatorType: AnalysisObjectLocatorType,
      detectionType: DetectionType,
      detectionCategory: DetectionCategory,
      projectId: string | undefined
    ) => {
      activatedRoute.snapshot.queryParams = {
        projectId: projectId,
        analysisObjectType: analysisObjectLocatorType.toString(),
        analysisObjectId: resourceId,
      };

      component.ngOnInit();

      expect(router.navigateByUrl).toHaveBeenCalledWith(detectionRoute);
      expect(detectionUriBuilderPipe.transform).toHaveBeenCalledWith({
        projectId: projectId,
        id: resourceId,
        type: detectionType,
        category: detectionCategory,
      });
    }
  );

  it("should route to the not found page in case of an unknown resource type", () => {
    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(["/not-found"]);
  });
});
